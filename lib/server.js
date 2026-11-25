import { maskWebhook, normalizeWebhook, redact } from './fetch.js'
import { dateKey, nextRunAt, scheduledInstantForToday, validTimezone } from './scheduler.js'
import { normalizeSource } from './config.js'
import { collectSource, validateSource } from './sources/index.js'

function json(res, status, value) {
  const body = JSON.stringify(value)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(body),
  })
  res.end(body)
}

async function readJson(req, limit = 1024 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > limit) throw new Error('请求体过大')
    chunks.push(chunk)
  }
  if (!chunks.length) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  if (!text.trim()) return {}
  const value = JSON.parse(text)
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('请求体必须是 JSON 对象')
  return value
}

export function createRoutes({ getConfig, store, engine, channel, credentials, credentialKey, log }) {
  const readToken = async () => {
    try {
      const record = await credentials.readRecord(credentialKey)
      return record?.payload?.token ?? ''
    } catch {
      return ''
    }
  }

  const requireConfigured = async () => {
    if (await readToken()) return true
    return false
  }

  const makeChannelState = async () => {
    const config = getConfig()
    const record = await credentials.readRecord(credentialKey).catch(() => undefined)
    const token = record?.payload?.token ?? ''
    const configured = Boolean(token)
    const recent = store.state.items.find(item => item.status === 'pushed' && item.channel === 'dingtalk')
    return {
      enabled: config.channel.enabled,
      keyword: config.channel.keyword,
      configured,
      masked: configured ? maskWebhook(normalizeWebhook(token)) : '',
      status: store.state.channel.status,
      lastError: store.state.channel.lastError ? redact(store.state.channel.lastError, token) : null,
      lastSuccessAt: store.state.channel.lastSuccessAt ?? recent?.pushedAt ?? null,
    }
  }

  const state = async () => {
    const config = getConfig()
    const zone = validTimezone(config.schedule.timezone) ? config.schedule.timezone : 'Asia/Shanghai'
    const today = dateKey(new Date(), zone)
    const instantToday = scheduledInstantForToday(config.schedule.time, zone)
    const channelState = await makeChannelState()
    let next = null
    if (config.enabled && config.schedule.enabled && channelState.configured) {
      if (store.state.schedule.lastScheduledDate === today && instantToday) {
        const tomorrow = new Date(instantToday.getTime() + 86400000 - 1000)
        next = nextRunAt(config.schedule.time, zone, tomorrow)?.toISOString() ?? null
      } else {
        next = nextRunAt(config.schedule.time, zone)?.toISOString() ?? null
      }
    }
    const cursors = store.state.cursors
    const sources = config.sources.map((rawSource, index) => {
      const source = normalizeSource(rawSource, index)
      const cursor = cursors[source.id]
      return {
        ...source,
        lastCheckAt: cursor?.lastCheckAt ?? null,
        latest: cursor?.latest ?? null,
        ok: !cursor?.lastError,
        error: cursor?.lastError ? redact(cursor.lastError.message, '') : null,
        seen: cursor?.seen?.length ?? 0,
      }
    })
    const sourceIds = new Set(sources.map(source => source.id))
    return {
      now: new Date().toISOString(),
      running: engine.running,
      nextRunAt: next,
      schedule: {
        enabled: config.schedule.enabled,
        time: config.schedule.time,
        timezone: zone,
        lastRunDate: store.state.schedule.lastRunDate ?? null,
        lastScheduledDate: store.state.schedule.lastScheduledDate ?? null,
      },
      channel: channelState,
      config: {
        enabled: config.enabled,
        fetch: config.fetch,
        retention: config.retention,
        llm: config.llm,
      },
      sources,
      items: store.state.items.slice(0, 50).map(item => ({
        id: item.id,
        sourceId: item.sourceId,
        sourceName: item.sourceName,
        version: item.version,
        build: item.build,
        title: item.title,
        link: item.link,
        publishedAt: item.publishedAt,
        pushedAt: item.pushedAt,
        status: item.status,
        orphan: !sourceIds.has(item.sourceId),
        attempts: item.attempts,
        degraded: item.degraded,
        error: item.error ? redact(item.error, '') : null,
        summary: item.summary?.impact ?? '',
        impact: item.summary?.impact ?? '',
        highlights: item.summary?.highlights ?? [],
        markdown: item.markdown ?? '',
      })),
      runs: store.state.runs.slice(0, 50).map(run => ({
        ...run,
        errors: (run.errors ?? []).map(error => ({ ...error, message: redact(error.message, '') })),
      })),
    }
  }

  const handler = async (req, res) => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const path = url.pathname.replace(/\/+$/, '')
    const method = req.method ?? 'GET'
    try {
      if (method === 'GET' && path === '/changelog-push/state') return json(res, 200, await state())

      if (method === 'POST' && path === '/changelog-push/run') {
        if (!(await requireConfigured())) return json(res, 400, { ok: false, message: '请先在「推送通道」配置钉钉 Webhook' })
        if (engine.running) return json(res, 202, { started: false, reason: 'running' })
        engine.run({ trigger: 'manual' }).catch(error => log.warn?.(error))
        return json(res, 202, { started: true })
      }

      if (method === 'POST' && path === '/changelog-push/test') {
        if (!(await requireConfigured())) return json(res, 400, { ok: false, message: '请先在「推送通道」配置钉钉 Webhook' })
        const config = getConfig()
        const keyword = config.channel.keyword || 'iOS'
        try {
          const result = await channel.test({
            title: `${keyword} 更新速递 · 测试消息`,
            markdown: [
              `### ${keyword} 更新速递 · 测试消息`,
              '',
              `**版本**：测试　**日期**：${new Date().toISOString().slice(0, 10)}`,
              '**来源**：dsh-changelog-push',
              '',
              '**要点**',
              '- 这是一条来自「Release通知」的测试消息',
              '- 收到即表示钉钉通道配置正确',
              '',
              '**对开发者的影响**',
              '无需处理，仅用于验证推送链路。',
            ].join('\n'),
          })
          store.state.channel = { status: 'ok', lastError: null, lastSuccessAt: new Date().toISOString() }
          store.save()
          return json(res, 200, { ok: true, chunks: result.chunks })
        } catch (error) {
          store.state.channel = { ...(store.state.channel ?? {}), status: 'error', lastError: redact(error?.message || String(error), '') }
          store.save()
          throw error
        }
      }

      if (method === 'POST' && path === '/changelog-push/secret') {
        const body = await readJson(req)
        const webhook = normalizeWebhook(body.webhook)
        if (!/^https:\/\/oapi\.dingtalk\.com\/robot\/send\?access_token=.+/.test(webhook)) {
          return json(res, 400, { ok: false, message: '请填写钉钉自定义机器人 Webhook 地址或 access_token' })
        }
        try {
          new URL(webhook)
        } catch {
          return json(res, 400, { ok: false, message: 'Webhook 地址不合法' })
        }
        await credentials.modifyRecord(credentialKey, () => ({ kind: 'grant', payload: { token: webhook } }))
        store.state.channel = { ...(store.state.channel ?? {}), status: 'unknown', lastError: null }
        store.save()
        return json(res, 200, { ok: true, masked: maskWebhook(webhook) })
      }

      if (method === 'POST' && path === '/changelog-push/source/check') {
        const body = await readJson(req)
        const result = await collectSource(body.source, engine.sourceContext)
        return json(res, 200, { ok: true, count: result.entries.length, latest: result.latest })
      }

      if (method === 'POST' && path === '/changelog-push/source/validate') {
        const body = await readJson(req)
        const result = await validateSource(body.source, engine.sourceContext)
        return json(res, 200, result ?? { ok: false, message: '校验不可用' })
      }

      if (method === 'POST' && (path === '/changelog-push/debug/latest' || path === '/changelog-push/debug/inject')) {
        if (!(await requireConfigured())) return json(res, 400, { ok: false, message: '请先在「推送通道」配置钉钉 Webhook' })
        const run = await engine.pushLatest()
        const ok = run.status === 'success'
        const message = ok ? undefined : (run.errors?.at(-1)?.message ?? '推送失败')
        return json(res, 200, { ok, status: run.status, pushed: run.pushed, latest: run.latest ?? [], message, run })
      }

      if (method === 'POST' && path === '/changelog-push/clear') {
        store.state.items = []
        store.state.runs = []
        store.save()
        return json(res, 200, { ok: true })
      }

      if (method === 'POST' && (path === '/changelog-push/clear-token' || path === '/changelog-push/reset-token')) {
        try {
          await credentials.deleteRecord(credentialKey)
        } catch (error) {
          if (error?.code !== 'CREDENTIAL_NOT_FOUND') throw error
        }
        store.state.channel = { ...(store.state.channel ?? {}), status: 'unknown', lastError: null, lastSuccessAt: null }
        store.save()
        return json(res, 200, { ok: true, configured: false })
      }

      return json(res, 404, { ok: false, message: 'Not found' })
    } catch (error) {
      const message = redact(error?.message || String(error), '')
      if (log?.warn) log.warn('changelog-push route failed: %s', message)
      return json(res, 500, { ok: false, message })
    }
  }

  return { handler, state }
}