import { APPLE_DATA_PREFIX, APPLE_INDEX_URL } from '../config.js'
import { appleDetailFallbacks, doccToText, parseAppleTitle, parseFeed } from '../parse.js'

const TRACK_PREFIX = {
  xcode: /^Xcode\s/,
  ios: /^iOS\s/,
}

function indexVersion(track, title) {
  if (track === 'xcode') {
    const match = /^Xcode\s+([\d.]+)\b/.exec(title)
    return match ? match[1] : null
  }
  const match = /^iOS(?:\s*&\s*iPadOS)?\s+([\d.]+)\b/.exec(title)
  return match ? match[1] : null
}

function createRssCache(fetchText, timeoutMs) {
  const pending = new Map()
  return url => {
    if (!pending.has(url)) {
      pending.set(url, fetchText(url, { timeoutMs, retries: 2, headers: { accept: 'application/rss+xml,application/xml,text/xml;q=0.9,*/*;q=0.8' } }).catch(error => {
        pending.delete(url)
        throw error
      }))
    }
    return pending.get(url)
  }
}

export function createAppleCache(fetchText, fetchJson, timeoutMs) {
  const rssCache = createRssCache(fetchText, timeoutMs)
  const indexCache = new Map()
  const detailCache = new Map()
  return {
    rss: rssCache,
    index(track) {
      if (!indexCache.has(track)) {
        const url = APPLE_INDEX_URL[track]
        const promise = (url ? fetchJson(url, { timeoutMs, retries: 2 }) : Promise.resolve(null))
          .then(doc => {
            const map = new Map()
            if (!doc) return map
            const references = doc.references ?? {}
            for (const section of doc.topicSections ?? []) {
              for (const identifier of section.identifiers ?? []) {
                const ref = references[identifier]
                if (!ref?.url || typeof ref.url !== 'string' || !ref.url.startsWith('/documentation/')) continue
                const version = indexVersion(track, ref.title || '')
                if (version && !map.has(version)) map.set(version, ref.url)
              }
            }
            return map
          })
          .catch(() => {
            indexCache.delete(track)
            return new Map()
          })
        indexCache.set(track, promise)
      }
      return indexCache.get(track)
    },
    detail(url) {
      if (!detailCache.has(url)) {
        const promise = fetchJson(url, { timeoutMs, retries: 1 }).catch(error => {
          detailCache.delete(url)
          throw error
        })
        detailCache.set(url, promise)
      }
      return detailCache.get(url)
    },
  }
}

export async function collectAppleEntries(source, cache) {
  const track = source.track === 'xcode' ? 'xcode' : 'ios'
  const prefix = TRACK_PREFIX[track]
  const xml = await cache.rss(source.url || 'https://developer.apple.com/news/releases/rss/releases.rss')
  const feed = parseFeed(xml)
  const seen = new Map()
  for (const entry of feed) {
    if (!prefix.test(entry.title)) continue
    if (track === 'ios' && /^iOS\s*&\s*iPadOS/.test(entry.title)) continue
    const parsed = parseAppleTitle(entry.title, track)
    if (!parsed) continue
    const key = `${source.id}:${parsed.version}:${parsed.build}`
    if (seen.has(key)) continue
    seen.set(key, {
      source,
      key,
      version: parsed.version,
      build: parsed.build,
      qualifier: parsed.qualifier,
      isBeta: parsed.isBeta,
      title: entry.title,
      publishedAt: entry.publishedAt,
      link: entry.link,
      rssText: entry.text,
      track,
    })
  }
  const entries = [...seen.values()].sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
  const latest = entries[0]
  return {
    entries: entries.map(entry => ({
      ...entry,
      latestLabel: latest ? `${latest.version}${latest.qualifier ? ` ${latest.qualifier}` : ''} (${latest.build})` : '',
    })),
    latest: latest ? { version: latest.version, build: latest.build, qualifier: latest.qualifier, title: latest.title, publishedAt: latest.publishedAt } : null,
  }
}

export async function loadAppleDetail(entry, cache) {
  const track = entry.track ?? 'xcode'
  const index = await cache.index(track)
  const candidates = []
  const indexed = index.get(entry.version)
  if (indexed) candidates.push(`${APPLE_DATA_PREFIX}${indexed}.json`)
  for (const url of appleDetailFallbacks(track, entry.version)) {
    if (!candidates.includes(url)) candidates.push(url)
  }
  let lastError
  for (const url of candidates) {
    try {
      const doc = await cache.detail(url)
      const content = doccToText(doc)
      if (content.trim()) {
        const page = url.replace(APPLE_DATA_PREFIX, 'https://developer.apple.com').replace(/\.json$/, '')
        return {
          content,
          detailUrl: page,
          extracted: true,
          note: '',
        }
      }
    } catch (error) {
      lastError = error
    }
  }
  return {
    content: entry.rssText || '',
    detailUrl: entry.link || '',
    extracted: false,
    note: lastError ? `发布说明详情获取失败：${lastError.message}` : '未找到发布说明详情',
  }
}