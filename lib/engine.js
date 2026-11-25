import { collectSource, collectSourceDetail } from './sources/index.js'
import { matchesKeywords, normalizeSource } from './config.js'
import { buildMarkdown, pushTitle, summarizeEntry } from './summarize.js'
import { dateKey, parseTime, validTimezone } from './scheduler.js'

const MERGE_WINDOW_MS = 12 * 3600000

function nowIso() {
  return new Date().toISOString()
}

function isFresh(entry, maxAgeDays, now) {
  if (!entry.publishedAt) return true
  const at = Date.parse(entry.publishedAt)
  if (!Number.isFinite(at)) return true
  return now.getTime() - at <= maxAgeDays * 86400000
}

export function mergeSameVersion(entries) {
  const byVersion = new Map()
  const groups = []
  for (const entry of entries) {
    const key = `${entry.source.id}:${entry.version}`
    const at = Date.parse(entry.publishedAt ?? '') || 0
    const list = byVersion.get(key) ?? []
    if (!byVersion.has(key)) byVersion.set(key, list)
    const group = list.find(item => Math.abs(at - (Date.parse(item.chosen.publishedAt ?? '') || 0)) <= MERGE_WINDOW_MS)
    if (!group) {
      const fresh = { chosen: entry, dropped: [] }
      list.push(fresh)
      groups.push(fresh)
      continue
    }
    const existingAt = Date.parse(group.chosen.publishedAt ?? '') || 0
    if (at >= existingAt) {
      group.dropped.push(group.chosen)
      group.chosen = entry
    } else {
      group.dropped.push(entry)
    }
  }
  return groups
}
export class Engine {
  constructor({ store, sourceContextFactory, getConfig, llm, agentDefaultModel, channel, log }) {
    this.store = store
    this.sourceContextFactory = sourceContextFactory
    this.sourceContext = sourceContextFactory?.(20000) ?? null
    this.getConfig = getConfig
    this.llm = llm
    this.agentDefaultModel = agentDefaultModel
    this.channel = channel
    this.log = log
    this.running = false
    this.lastError = null
  }

  selection(config) {
    if (config.llm.provider && config.llm.model) return { provider: config.llm.provider, model: config.llm.model }
    try {
      return this.agentDefaultModel?.currentSelection?.() ?? null
    } catch {
      return null
    }
  }

  async run({ trigger = 'manual' } = {}) {
    if (this.running) return { started: false, reason: 'running' }
    this.running = true
    const startedAt = nowIso()
    const config = this.getConfig()
    this.sourceContext = this.sourceContextFactory?.(config.fetch.timeoutMs) ?? this.sourceContext
    const run = {
      id: `run-${Date.now()}`,
      startedAt,
      finishedAt: null,
      trigger,
      status: 'success',
      new: 0,
      fetched: 0,
      fresh: 0,
      pushed: 0,
      failed: 0,
      degraded: 0,
      baseline: 0,
      errors: [],
    }
    try {
      if (!config.enabled) {
        run.status = 'skipped'
        run.note = '推送服务已停用'
        return { started: true, run }
      }
      await this.retryPending(config, run)
      await this.collectNew(config, run, startedAt)
      run.finishedAt = nowIso()
      if (run.failed > 0) run.status = 'failed'
      else if (run.baseline > 0 && run.pushed === 0 && run.fresh === 0) run.status = 'baseline'
      this.recordSchedule(config, trigger)
      return { started: true, run }
    } catch (error) {
      run.status = 'failed'
      run.finishedAt = nowIso()
      run.errors.push({ source: 'runner', message: error?.message || String(error) })
      this.lastError = error?.message || String(error)
      return { started: true, run }
    } finally {
      this.store.addRun(run)
      this.store.prune(config.retention)
      this.store.save()
      this.running = false
    }
  }

  recordSchedule(config, trigger) {
    const now = new Date()
    const zone = validTimezone(config.schedule.timezone) ? config.schedule.timezone : 'Asia/Shanghai'
    this.store.state.schedule.lastRunDate = dateKey(now, zone)
    if (trigger === 'scheduled' || trigger === 'startup') {
      this.store.state.schedule.lastScheduledDate = dateKey(now, zone)
    }
  }

  async retryPending(config, run) {
    if (!config.channel.enabled) return
    const pending = this.store.state.items.filter(item => item.status === 'failed' && (item.attempts ?? 0) < 3)
    for (const item of pending.slice(0, 20)) {
      if (!item.markdown) {
        item.status = 'dead'
        continue
      }
      try {
        await this.channel.send({ title: item.pushTitle || item.title, markdown: item.markdown })
        item.status = 'pushed'
        item.pushedAt = nowIso()
        item.error = null
        item.attempts = (item.attempts ?? 0) + 1
        run.pushed += 1
        this.store.state.channel.status = 'ok'
        this.store.state.channel.lastError = null
        this.store.state.channel.lastSuccessAt = item.pushedAt
      } catch (error) {
        item.attempts = (item.attempts ?? 0) + 1
        item.error = String(error?.message || error).slice(0, 300)
        item.status = item.attempts >= 3 ? 'dead' : 'failed'
        run.failed += 1
        this.store.state.channel.status = 'error'
        this.store.state.channel.lastError = item.error
      }
    }
  }

  async findLatest(config) {
    const targets = []
    const errors = []
    let fetched = 0
    for (const [index, rawSource] of config.sources.entries()) {
      const source = normalizeSource(rawSource, index)
      if (!source.enabled) continue
      try {
        const result = await collectSource(source, this.sourceContext)
        const entries = result.entries ?? []
        fetched += entries.length
        const candidates = entries.filter(entry => {
          if (source.includeBeta !== true && entry.isBeta) return false
          return matchesKeywords(source.keywords, entry.title, entry.rssText || entry.content)
        })
        candidates.sort((a, b) => String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? '')))
        if (candidates.length) targets.push({ source, entry: candidates[0] })
      } catch (error) {
        errors.push({ source: source.name || source.id, message: String(error?.message || error).slice(0, 300) })
      }
    }
    return { targets, fetched, errors }
  }

  async pushLatest() {
    if (this.running) throw new Error('正在运行，请稍后再试')
    const config = this.getConfig()
    if (!config.channel.enabled) throw new Error('推送通道已关闭，请先在「推送通道」中启用')
    this.running = true
    const run = {
      id: `run-${Date.now()}`,
      startedAt: nowIso(),
      finishedAt: null,
      trigger: 'debug',
      status: 'success',
      new: 0,
      fetched: 0,
      fresh: 0,
      pushed: 0,
      failed: 0,
      degraded: 0,
      baseline: 0,
      errors: [],
    }
    try {
      const { targets, fetched, errors } = await this.findLatest(config)
      run.fetched = fetched
      run.errors.push(...errors)
      if (!targets.length) {
        run.status = 'failed'
        run.errors.push({ source: 'debug', message: '订阅源中没有找到可推送的更新' })
      } else {
        run.latest = targets.map(({ source, entry }) => ({
          source: source.name || source.id,
          title: entry.title,
          version: entry.version,
          build: entry.build,
          link: entry.link,
        }))
        for (const { entry } of targets) {
          await this.processEntry(entry, config, run)
        }
        run.status = run.failed > 0 ? (run.pushed > 0 ? 'partial' : 'failed') : 'success'
      }
    } catch (error) {
      run.status = 'failed'
      run.errors.push({ source: 'debug', message: String(error?.message || error) })
    } finally {
      run.finishedAt = nowIso()
      this.store.addRun(run)
      this.store.save()
      this.running = false
    }
    return run
  }

  async collectNew(config, run, startedAt) {
    const now = new Date()
    const queue = []
    for (const [index, rawSource] of config.sources.entries()) {
      const source = normalizeSource(rawSource, index)
      if (!source.enabled) continue
      let result
      try {
        result = await collectSource(source, this.sourceContext)
      } catch (error) {
        const message = String(error?.message || error).slice(0, 300)
        const cursor = this.store.cursor(source.id)
        cursor.lastError = { at: nowIso(), message }
        run.errors.push({ source: source.name || source.id, message })
        continue
      }
      const entries = result.entries ?? []
      run.fetched += entries.length
      const cursor = this.store.cursor(source.id)
      cursor.lastCheckAt = startedAt
      cursor.lastError = null
      cursor.lastOk = nowIso()
      if (result.latest) cursor.latest = result.latest

      const maxAgeDays = Number(source.maxAgeDays) > 0 ? Number(source.maxAgeDays) : config.fetch.maxAgeDays
      const freshEntries = entries.filter(entry => isFresh(entry, maxAgeDays, now))
      const keywordPass = freshEntries.filter(entry => matchesKeywords(source.keywords, entry.title, entry.rssText || entry.content))
      const skippedByKeyword = freshEntries.filter(entry => !keywordPass.includes(entry))
      if (skippedByKeyword.length) this.store.markSeen(source.id, skippedByKeyword.map(entry => entry.key))
      if (!cursor.initialized) {
        cursor.initialized = true
        this.store.markSeen(source.id, keywordPass.map(entry => entry.key))
        run.baseline += 1
        continue
      }

      const unseen = keywordPass.filter(entry => !cursor.seen.includes(entry.key))
      const withoutBeta = unseen.filter(entry => source.includeBeta === true || !entry.isBeta)
      const skippedBeta = unseen.filter(entry => !withoutBeta.includes(entry))
      this.store.markSeen(source.id, skippedBeta.map(entry => entry.key))
      const stale = entries.filter(entry => !freshEntries.includes(entry))
      this.store.markSeen(source.id, stale.map(entry => entry.key))

      for (const group of mergeSameVersion(withoutBeta)) {
        if (group.dropped.length) this.store.markSeen(source.id, group.dropped.map(entry => entry.key))
        queue.push(group.chosen)
      }
      this.store.save()
    }

    queue.sort((a, b) => (a.publishedAt ?? '').localeCompare(b.publishedAt ?? ''))
    for (const entry of queue.slice(0, 30)) {
      await this.processEntry(entry, config, run)
      this.store.save()
    }
  }

  async processEntry(entry, config, run) {
    const cursor = this.store.cursor(entry.source.id)
    let detail
    try {
      detail = entry.mockContent
        ? { content: entry.mockContent, detailUrl: entry.link, extracted: true, note: '' }
        : await collectSourceDetail(entry, this.sourceContext)
    } catch (error) {
      detail = {
        content: entry.rssText || '',
        detailUrl: entry.link,
        extracted: false,
        note: String(error?.message || error).slice(0, 200),
      }
    }
    const linked = { ...entry, link: detail.detailUrl || entry.link }
    const selection = this.selection(config)
    const keyword = config.channel.keyword || 'iOS'
    const summary = await summarizeEntry(linked, detail.content || entry.rssText || '', {
      llm: this.llm,
      selection,
      timeoutMs: 60000,
      keyword,
    })
    if (summary.degraded) run.degraded += 1
    const markdown = buildMarkdown(linked, summary, keyword)
    const messageTitle = pushTitle(linked, keyword)
    const message = {
      title: messageTitle,
      version: summary.version,
      date: summary.date,
      highlights: summary.highlights,
      impact: summary.impact,
      link: summary.link || linked.link,
      markdown,
    }
    const item = {
      id: entry.key,
      sourceId: entry.source.id,
      sourceName: entry.source.name,
      version: entry.version,
      build: entry.build,
      title: entry.title,
      link: linked.link,
      publishedAt: entry.publishedAt,
      createdAt: nowIso(),
      summary,
      impact: summary.impact,
      date: summary.date,
      degraded: summary.degraded === true,
      markdown,
      pushTitle: messageTitle,
      channel: 'dingtalk',
      channels: config.channel.enabled ? ['dingtalk'] : [],
      status: 'skipped',
      attempts: 0,
      pushedAt: null,
      error: null,
      pushError: null,
    }
    run.fresh += 1
    run.new += 1
    if (config.channel.enabled) {
      try {
        await this.channel.send({ ...message, title: messageTitle })
        item.status = 'pushed'
        item.pushedAt = nowIso()
        item.attempts = 1
        run.pushed += 1
        this.store.state.channel.status = 'ok'
        this.store.state.channel.lastError = null
        this.store.state.channel.lastSuccessAt = item.pushedAt
      } catch (error) {
        item.status = 'failed'
        item.attempts = 1
        item.error = String(error?.message || error).slice(0, 300)
        item.pushError = item.error
        item.channels = []
        run.failed += 1
        run.errors.push({ source: entry.source.name || entry.source.id, message: item.error })
        this.store.state.channel.status = 'error'
        this.store.state.channel.lastError = item.error
      }
    }
    this.store.markSeen(entry.source.id, [entry.key])
    this.store.addItem(item)
    void cursor
  }
}
