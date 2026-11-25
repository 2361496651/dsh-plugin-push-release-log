import { normalizeSource } from '../config.js'
import { collectAppleEntries, createAppleCache, loadAppleDetail } from './apple.js'
import { collectFeedEntries } from './feed.js'
import { collectPageEntry } from './page.js'

export function createSourceContext({ fetchText, fetchJson, timeoutMs }) {
  return {
    fetchText,
    fetchJson,
    timeoutMs,
    apple: createAppleCache(fetchText, fetchJson, timeoutMs),
  }
}

export async function collectSource(sourceInput, context) {
  const source = normalizeSource(sourceInput)
  if (!source.url) throw new Error('订阅源缺少地址')
  if (source.mode === 'apple') {
    if (!['xcode', 'ios'].includes(source.track)) throw new Error('Apple 订阅源需要选择跟踪对象')
    return collectAppleEntries(source, context.apple)
  }
  if (source.mode === 'page') return collectPageEntry(source, context.fetchText, context.timeoutMs)
  return collectFeedEntries(source, context.fetchText, context.timeoutMs)
}

export async function collectSourceDetail(entry, context) {
  if (entry.source.mode !== 'apple') {
    return { content: entry.content || entry.rssText || '', detailUrl: entry.link || '', extracted: Boolean(entry.content), note: '' }
  }
  return loadAppleDetail(entry, context.apple)
}

export async function validateSource(sourceInput, context) {
  const source = normalizeSource(sourceInput)
  const result = await collectSource(source, context)
  const sample = result.entries.slice(0, 3).map(entry => ({
    title: entry.title,
    version: entry.version,
    build: entry.build,
    publishedAt: entry.publishedAt,
  }))
  return {
    ok: true,
    count: result.entries.length,
    latest: result.latest?.title ?? null,
    sample,
  }
}