import { parseFeed } from '../parse.js'

export async function collectFeedEntries(source, fetchText, timeoutMs) {
  const xml = await fetchText(source.url, {
    timeoutMs,
    retries: 2,
    headers: { accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml;q=0.9,*/*;q=0.8' },
  })
  const feed = parseFeed(xml)
  const seen = new Set()
  const entries = []
  for (const entry of feed) {
    const identity = entry.link || entry.title
    if (!identity || seen.has(identity)) continue
    seen.add(identity)
    entries.push({
      source,
      key: `${source.id}:${identity}`,
      version: entry.title.slice(0, 80),
      build: '',
      qualifier: '',
      isBeta: false,
      title: entry.title,
      publishedAt: entry.publishedAt,
      link: entry.link,
      content: entry.text,
      latestLabel: entry.title,
    })
  }
  return {
    entries,
    latest: entries[0] ? { version: entries[0].title, build: '', title: entries[0].title, publishedAt: entries[0].publishedAt } : null,
  }
}