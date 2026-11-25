import { createHash } from 'node:crypto'
import { pageToText } from '../parse.js'

export async function collectPageEntry(source, fetchText, timeoutMs) {
  const html = await fetchText(source.url, { timeoutMs, retries: 2 })
  const text = pageToText(html)
  if (!text.trim()) throw new Error('页面没有可读正文')
  const fingerprint = createHash('sha1').update(text).digest('hex')
  const today = new Date().toISOString().slice(0, 10)
  const entry = {
    source,
    key: `${source.id}:${fingerprint.slice(0, 16)}`,
    version: today,
    build: fingerprint.slice(0, 8),
    qualifier: '',
    isBeta: false,
    title: `${source.name} 有更新`,
    publishedAt: new Date().toISOString(),
    link: source.url,
    content: text,
    latestLabel: `${today} 变更`,
  }
  return { entries: [entry], latest: entry }
}