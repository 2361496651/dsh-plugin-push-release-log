import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Config, readConfig, PRESET_SOURCES } from '../lib/config.js'
import { parseFeed, parseAppleTitle } from '../lib/parse.js'
import { nextRunAt, dateKey } from '../lib/scheduler.js'
import { Store } from '../lib/store.js'
import { Engine } from '../lib/engine.js'
import { DingTalkChannel, splitMarkdown } from '../lib/channels/dingtalk.js'
import { summarizeEntry } from '../lib/summarize.js'

const prompt = {
  enabled: true,
  sources: [
    { id: 'apple-xcode', name: 'Xcode Release Notes', type: 'rss', url: 'https://example.com/x.xml', track: '', keywords: '', maxAgeDays: 30, enabled: true, includeBeta: false },
    { id: 'apple-ios', name: 'iOS SDK Release Notes', type: 'rss', url: 'https://example.com/i.xml', track: '', keywords: '', maxAgeDays: 30, enabled: true, includeBeta: false },
  ],
  channel: { enabled: true, keyword: 'iOS' },
  schedule: { enabled: true, time: '09:00', timezone: 'Asia/Shanghai' },
  llm: {},
  fetch: { maxAgeDays: 30, timeoutMs: 20000 },
  retention: { days: 90, items: 200, runs: 100 },
}

function feed(items) {
  return `<?xml version="1.0"?><rss><channel>${items.map(item => `<item><title>${item.title}</title><link>${item.link}</link><pubDate>${item.date}</pubDate><description>${item.desc}</description></item>`).join('')}</channel></rss>`
}

function freshStore() {
  return new Store(mkdtempSync(join(tmpdir(), 'dsh-cl-test-')))
}

function makeEngine(store, feeds, sent) {
  return new Engine({
    store,
    sourceContextFactory: () => ({ fetchText: async url => feeds[url], fetchJson: async () => ({}), timeoutMs: 20000 }),
    getConfig: () => prompt,
    llm: { async *stream() { yield { type: 'finish', reason: { kind: 'error', failure: { code: 'TEST' } } } } },
    agentDefaultModel: { currentSelection: () => ({ provider: 'p', model: 'm' }) },
    channel: { send: async message => { sent.push(message) } },
    log: { warn: () => {}, info: () => {} },
  })
}

test('config defaults are public-safe', () => {
  const config = readConfig(Config({}))
  assert.equal(config.schedule.time, '09:00')
  assert.equal(config.schedule.timezone, 'Asia/Shanghai')
  assert.equal(config.channel.keyword, 'iOS')
  assert.equal(config.sources.length, 2)
  assert.equal(config.sources[0].type, 'apple-release')
  assert.equal(PRESET_SOURCES[0].track, 'xcode')
  assert.equal(PRESET_SOURCES[1].track, 'ios')
})

test('parses Apple titles and RSS items', () => {
  assert.deepEqual(parseAppleTitle('Xcode 27.2 (27B52)', 'xcode'), { version: '27.2', qualifier: '', isBeta: false, build: '27B52' })
  assert.deepEqual(parseAppleTitle('iOS 27.3 beta 2 v2 (24C5049f)', 'ios'), { version: '27.3', qualifier: 'beta 2 v2', isBeta: true, build: '24C5049f' })
  const items = parseFeed('<rss><channel><item><title>iOS 27 (24A1)</title><link>https://x</link><pubDate>Thu, 19 Nov 2026 13:00:00 PST</pubDate><description>notes</description></item></channel></rss>')
  assert.equal(items.length, 1)
  assert.equal(items[0].title, 'iOS 27 (24A1)')
  assert.equal(items[0].link, 'https://x')
  assert.equal(Date.parse(items[0].publishedAt), Date.parse('Thu, 19 Nov 2026 13:00:00 PST'))
})

test('computes the next local schedule instant', () => {
  const now = new Date('2026-11-25T00:00:00.000Z') // 08:00 in Shanghai
  const next = nextRunAt('09:00', 'Asia/Shanghai', now)
  assert.equal(next.toISOString(), '2026-11-25T01:00:00.000Z')
  assert.equal(dateKey(now, 'Asia/Shanghai'), '2026-11-25')
})

test('first run is a baseline; a later new release is pushed once', async () => {
  const store = freshStore()
  const sent = []
  const feeds = {
    'https://example.com/x.xml': feed([{ title: 'Xcode 27.2 (27B52)', link: 'https://x27', date: 'Fri, 30 Oct 2026 00:00:00 PST', desc: 'SwiftUI changes' }]),
    'https://example.com/i.xml': feed([{ title: 'iOS 27.2.1 (24B91034)', link: 'https://i27', date: 'Mon, 09 Nov 2026 00:00:00 PST', desc: 'Liquid Glass changes' }]),
  }
  const engine = makeEngine(store, feeds, sent)

  const baseline = (await engine.run({ trigger: 'manual' })).run
  assert.equal(baseline.status, 'baseline')
  assert.equal(sent.length, 0)
  assert.equal(baseline.pushed, 0)

  feeds['https://example.com/i.xml'] = feed([
    { title: 'iOS 18.1 (16B200)', link: 'https://i181', date: 'Fri, 20 Nov 2026 00:00:00 PST', desc: 'New iOS release' },
    { title: 'iOS 27.2.1 (24B91034)', link: 'https://i27', date: 'Mon, 09 Nov 2026 00:00:00 PST', desc: 'Liquid Glass changes' },
  ])
  const next = (await engine.run({ trigger: 'manual' })).run
  assert.equal(next.status, 'success')
  assert.equal(next.pushed, 1)
  assert.equal(sent.length, 1)
  assert.match(sent[0].title, /^iOS 更新速递/)
  assert.match(sent[0].markdown, /^### iOS 更新速递/m)
  assert.match(sent[0].markdown, /规则摘要/)
})

test('pushLatest sends each source newest release', async () => {
  const store = freshStore()
  const sent = []
  const feeds = {
    'https://example.com/x.xml': feed([{ title: 'Xcode 27.2 (27B52)', link: 'https://x27', date: 'Fri, 30 Oct 2026 00:00:00 PST', desc: 'SwiftUI changes' }]),
    'https://example.com/i.xml': feed([{ title: 'iOS 27.2.1 (24B91034)', link: 'https://i27', date: 'Mon, 09 Nov 2026 00:00:00 PST', desc: 'Liquid Glass changes' }]),
  }
  const engine = makeEngine(store, feeds, sent)
  const run = await engine.pushLatest()
  assert.equal(run.status, 'success')
  assert.equal(run.pushed, 2)
  assert.equal(sent.length, 2)
  assert.deepEqual(sent.map(message => message.title.split(' · ')[1]), ['Xcode 27.2 (27B52)', 'iOS 27.2.1 (24B91034)'])
  assert.deepEqual(run.latest.map(item => item.source), ['Xcode Release Notes', 'iOS SDK Release Notes'])
})

test('LLM failure degrades to a rule summary', async () => {
  const summary = await summarizeEntry(
    { title: 'iOS 27.2 (24B1)', version: '27.2', build: '24B1', link: 'https://example.com', source: { name: 'iOS SDK Release Notes' }, track: 'ios' },
    'A new SDK release with API changes.',
    { llm: { async *stream() { yield { type: 'finish', reason: { kind: 'error', failure: { code: 'TEST' } } } } }, selection: { provider: 'p', model: 'm' } },
  )
  assert.equal(summary.degraded, true)
  assert.match(summary.impact, /自动摘要暂不可用/)
})

test('DingTalk chunking stays under the byte limit', () => {
  const chunks = splitMarkdown(Array.from({ length: 800 }, (_, index) => `段落 ${index} ${'内容'.repeat(20)}`).join('\n\n'))
  assert.ok(chunks.length > 1)
  for (const chunk of chunks) assert.ok(Buffer.byteLength(chunk, 'utf8') <= 19000)
})

test('DingTalk retries errcode 310000 with the keyword injected', async () => {
  const calls = []
  const original = globalThis.fetch
  globalThis.fetch = async (url, init) => {
    calls.push(JSON.parse(init.body))
    const data = calls.length === 1 ? { errcode: 310000, errmsg: 'keywords not in content' } : { errcode: 0, errmsg: 'ok' }
    return { status: 200, text: async () => JSON.stringify(data) }
  }
  try {
    const channel = new DingTalkChannel({ getToken: () => 'token', getKeyword: () => 'iOS', timeoutMs: 5000 })
    const result = await channel.send({ title: '更新提醒', text: '没有关键词的内容' })
    assert.equal(result.chunks, 1)
    assert.equal(calls.length, 2)
    assert.ok(calls.every(call => `${call.markdown.title}\n${call.markdown.text}`.includes('iOS')))
  } finally {
    globalThis.fetch = original
  }
})

test('routes refuse to push before a webhook is configured; clearing revokes it', async () => {
  const { createRoutes } = await import('../lib/server.js')
  const store = freshStore()
  let record
  const credentials = {
    readRecord: async () => record,
    modifyRecord: async (key, update) => { record = update(record); return record },
    deleteRecord: async () => { record = undefined },
  }
  let runs = 0
  const engine = { running: false, sourceContext: {}, run: async () => { runs += 1; return { started: true, run: {} } }, pushLatest: async () => ({ status: 'success', pushed: 0, latest: [], errors: [] }) }
  const routes = createRoutes({
    getConfig: () => readConfig(Config({})),
    store,
    engine,
    channel: { test: async () => ({ chunks: 1 }) },
    credentials,
    credentialKey: 'dsh-changelog-push/dingtalk',
    log: { warn: () => {} },
  })
  const call = (method, path, body) => new Promise((resolve, reject) => {
    const req = {
      method,
      url: path,
      async *[Symbol.asyncIterator]() {
        if (body !== undefined) yield Buffer.from(JSON.stringify(body))
      },
    }
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(status, headers) { this.statusCode = status; this.headers = headers },
      end(text) { resolve({ status: this.statusCode, body: JSON.parse(text) }) },
    }
    routes.handler(req, res).catch(reject)
  })

  const blocked = await call('POST', '/changelog-push/run')
  assert.equal(blocked.status, 400)
  assert.match(blocked.body.message, /配置钉钉 Webhook/)

  const saved = await call('POST', '/changelog-push/secret', { webhook: 'https://oapi.dingtalk.com/robot/send?access_token=test' })
  assert.equal(saved.status, 200)
  assert.match(saved.body.masked, /access_token=••••$/)

  const started = await call('POST', '/changelog-push/run')
  assert.equal(started.status, 202)
  assert.equal(runs, 1)

  const cleared = await call('POST', '/changelog-push/clear-token')
  assert.equal(cleared.status, 200)
  assert.equal(record, undefined)
  const blockedAgain = await call('POST', '/changelog-push/debug/latest')
  assert.equal(blockedAgain.status, 400)
})
