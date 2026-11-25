const DEFAULT_HEADERS = {
  'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) dsh-changelog-push/0.3',
  'accept': 'text/html,application/xhtml+xml,application/xml,application/json;q=0.9,*/*;q=0.8',
  'accept-language': 'en-US,en;q=0.9,zh-CN;q=0.8',
}

export class FetchError extends Error {
  constructor(message, { url, status, retryable } = {}) {
    super(message)
    this.name = 'FetchError'
    this.url = url
    this.status = status
    this.retryable = retryable === true
  }
}

export function redact(value, token) {
  let text = String(value ?? '')
  if (token) text = text.split(token).join('••••')
  return text
    .replace(/access_token=[^&\s"']+/g, 'access_token=••••')
    .replace(/\b[a-f0-9]{32,}\b/gi, '••••')
}

export function normalizeWebhook(input) {
  const raw = String(input ?? '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://oapi.dingtalk.com/robot/send?access_token=${encodeURIComponent(raw)}`
}

export function maskWebhook(url) {
  if (!url) return ''
  const raw = normalizeWebhook(url)
  if (!/[?&]access_token=/.test(raw)) return ''
  return 'https://oapi.dingtalk.com/robot/send?access_token=••••'
}

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

function charsetFrom(contentType, bytes) {
  const header = /charset=["']?([\w-]+)/i.exec(contentType || '')
  if (header) return header[1].toLowerCase()
  const head = new TextDecoder('latin1').decode(bytes.slice(0, 2048))
  const meta = /<meta[^>]+charset=["']?([\w-]+)/i.exec(head)
  return meta ? meta[1].toLowerCase() : 'utf-8'
}

function decode(bytes, contentType) {
  const charset = charsetFrom(contentType, bytes)
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes)
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
  }
}

export async function fetchText(url, options = {}) {
  const {
    timeoutMs = 20000,
    retries = 3,
    headers = {},
    signal,
  } = options
  const attempts = Math.max(1, retries + 1)
  let lastError
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (signal?.aborted) throw new FetchError('已取消', { url, retryable: false })
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const onAbort = () => controller.abort()
    signal?.addEventListener('abort', onAbort, { once: true })
    try {
      const response = await fetch(url, {
        headers: { ...DEFAULT_HEADERS, ...headers },
        redirect: 'follow',
        signal: controller.signal,
      })
      const buffer = await response.arrayBuffer()
      const body = decode(new Uint8Array(buffer), response.headers.get('content-type') || '')
      if (!response.ok) {
        const retryable = response.status === 429 || response.status >= 500
        throw new FetchError(`HTTP ${response.status}`, { url, status: response.status, retryable })
      }
      return body
    } catch (error) {
      lastError = error instanceof FetchError
        ? error
        : new FetchError(error?.name === 'AbortError' ? `请求超时（${Math.round(timeoutMs / 1000)}s）` : String(error?.message || error), {
            url,
            retryable: error?.name !== 'AbortError' || attempt < attempts - 1,
          })
      if (!lastError.retryable || attempt === attempts - 1) break
      await new Promise(resolve => setTimeout(resolve, 1000 * 3 ** attempt))
    } finally {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
    }
  }
  throw lastError
}

export async function fetchJson(url, options = {}) {
  const text = await fetchText(url, options)
  try {
    return JSON.parse(text)
  } catch {
    throw new FetchError('响应不是合法 JSON', { url, retryable: false })
  }
}