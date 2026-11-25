import { DINGTALK_ENDPOINT } from '../config.js'
import { normalizeWebhook } from '../fetch.js'

const SEND_GAP_MS = 3000
const MAX_CHUNK_BYTES = 19000

export class ChannelError extends Error {
  constructor(message, { errcode, errmsg } = {}) {
    super(message)
    this.name = 'ChannelError'
    this.errcode = errcode
    this.errmsg = errmsg
  }
}

function byteLength(text) {
  return Buffer.byteLength(text, 'utf8')
}

export function splitMarkdown(text, maxBytes = MAX_CHUNK_BYTES) {
  const source = String(text ?? '').trim()
  if (!source) return ['']
  if (byteLength(source) <= maxBytes) return [source]
  const chunks = []
  let current = ''
  const push = () => {
    if (current.trim()) chunks.push(current.trim())
    current = ''
  }
  for (const paragraph of source.split(/\n{2,}/)) {
    const piece = `${paragraph}\n\n`
    if (byteLength(current + piece) <= maxBytes) {
      current += piece
      continue
    }
    push()
    if (byteLength(piece) <= maxBytes) {
      current = piece
      continue
    }
    for (const line of paragraph.split('\n')) {
      const linePiece = `${line}\n`
      if (byteLength(current + linePiece) <= maxBytes) {
        current += linePiece
      } else {
        push()
        if (byteLength(linePiece) <= maxBytes) {
          current = linePiece
        } else {
          let buffer = ''
          for (const char of line) {
            if (byteLength(buffer + char) > maxBytes) {
              chunks.push(buffer)
              buffer = ''
            }
            buffer += char
          }
          current = buffer
        }
      }
    }
  }
  push()
  return chunks.length ? chunks : ['']
}

export class DingTalkChannel {
  constructor({ getToken, getKeyword, timeoutMs = 20000 }) {
    this.getToken = getToken
    this.getKeyword = getKeyword
    this.timeoutMs = timeoutMs
    this.lastSentAt = 0
    this.sending = Promise.resolve()
  }

  async waitGap() {
    const wait = this.lastSentAt + SEND_GAP_MS - Date.now()
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait))
  }

  ensureKeyword(title, text) {
    const keyword = String(this.getKeyword() ?? '').trim()
    if (!keyword) return { title, text }
    const haystack = `${title}\n${text}`.toLowerCase()
    if (haystack.includes(keyword.toLowerCase())) return { title, text }
    return { title: `${keyword} · ${title}`.slice(0, 64), text: `> ${keyword} 更新提醒\n\n${text}` }
  }

  async postOnce(url, body) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), this.timeoutMs)
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json;charset=utf-8' },
        body: JSON.stringify(body),
        signal: controller.signal,
      })
      const text = await response.text()
      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new ChannelError(`钉钉返回了非 JSON 响应（HTTP ${response.status}）`)
      }
      if (data.errcode !== 0) {
        throw new ChannelError(`钉钉拒绝：${data.errmsg || `errcode ${data.errcode}`}`, {
          errcode: data.errcode,
          errmsg: data.errmsg,
        })
      }
      this.lastSentAt = Date.now()
      return data
    } finally {
      clearTimeout(timer)
    }
  }

  async postWithRetry(url, body, retries = 2) {
    let lastError
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        return await this.postOnce(url, body)
      } catch (error) {
        lastError = error
        const keywordError = error instanceof ChannelError && error.errcode === 310000
        if (keywordError && attempt === 0) {
          const fixed = this.ensureKeyword(body.markdown.title, body.markdown.text)
          body = {
            ...body,
            markdown: { title: fixed.title.slice(0, 64), text: fixed.text },
          }
          continue
        }
        if (attempt === retries) break
        await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 2000 : 6000))
      }
    }
    throw lastError ?? new ChannelError('钉钉发送失败')
  }

  async send({ title, text, markdown }) {
    const token = await this.getToken()
    if (!token) throw new ChannelError('尚未配置钉钉 Webhook')
    const url = normalizeWebhook(token)
    const content = this.ensureKeyword(String(title ?? '更新提醒').slice(0, 64), String(markdown ?? text ?? ''))
    const chunks = splitMarkdown(content.text)
    this.sending = this.sending.then(async () => {
      for (let index = 0; index < chunks.length; index += 1) {
        const body = index === 0 ? chunks[index] : `（续 ${index + 1}/${chunks.length}）\n\n${chunks[index]}`
        const fixed = this.ensureKeyword(content.title, body)
        await this.waitGap()
        await this.postWithRetry(url, {
          msgtype: 'markdown',
          markdown: { title: fixed.title.slice(0, 64), text: fixed.text },
          at: { isAtAll: false },
        })
      }
    })
    try {
      await this.sending
    } catch (error) {
      this.sending = Promise.resolve()
      throw error
    }
    return { chunks: chunks.length, endpoint: DINGTALK_ENDPOINT }
  }
}