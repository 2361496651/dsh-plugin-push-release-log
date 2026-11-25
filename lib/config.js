import Schema from './vendor/schemastery.js'

export const ENTRY_ID = 'dsh-changelog-push'
export const CREDENTIAL_KEY = 'dsh-changelog-push/dingtalk'

export const DINGTALK_ENDPOINT = 'https://oapi.dingtalk.com/robot/send?access_token='
export const APPLE_RSS_URL = 'https://developer.apple.com/news/releases/rss/releases.rss'
export const APPLE_INDEX_URL = {
  xcode: 'https://developer.apple.com/tutorials/data/documentation/xcode-release-notes.json',
  ios: 'https://developer.apple.com/tutorials/data/documentation/ios-ipados-release-notes.json',
}
export const APPLE_DATA_PREFIX = 'https://developer.apple.com/tutorials/data'

export const DEFAULT_TIME = '09:00'
export const DEFAULT_TIMEZONE = 'Asia/Shanghai'

export const PRESET_SOURCES = [
  {
    id: 'apple-xcode',
    name: 'Xcode Release Notes',
    type: 'apple-release',
    mode: 'apple',
    track: 'xcode',
    url: APPLE_RSS_URL,
    enabled: true,
    includeBeta: false,
  },
  {
    id: 'apple-ios',
    name: 'iOS SDK Release Notes',
    type: 'apple-release',
    mode: 'apple',
    track: 'ios',
    url: APPLE_RSS_URL,
    enabled: true,
    includeBeta: false,
  },
]

const SourceSchema = Schema.object({
  id: Schema.string().required(),
  name: Schema.string().required(),
  type: Schema.union([Schema.const('apple-release'), Schema.const('rss'), Schema.const('web')]).default('rss'),
  track: Schema.string().default(''),
  url: Schema.string().default(''),
  keywords: Schema.string().default(''),
  maxAgeDays: Schema.number().min(1).max(365).default(30),
  enabled: Schema.boolean().default(true),
  includeBeta: Schema.boolean().default(false),
})

export const Config = Schema.object({
  enabled: Schema.boolean().default(true),
  sources: Schema.array(SourceSchema).default(PRESET_SOURCES),
  channel: Schema.object({
    enabled: Schema.boolean().default(true),
    keyword: Schema.string().default('iOS'),
  }).default({ enabled: true, keyword: 'iOS' }),
  schedule: Schema.object({
    enabled: Schema.boolean().default(true),
    time: Schema.string().pattern(/^([01]\d|2[0-3]):[0-5]\d$/).default(DEFAULT_TIME),
    timezone: Schema.string().default(DEFAULT_TIMEZONE),
  }).default({ enabled: true, time: DEFAULT_TIME, timezone: DEFAULT_TIMEZONE }),
  llm: Schema.object({
    provider: Schema.string().default(''),
    model: Schema.string().default(''),
  }).default({ provider: '', model: '' }),
  fetch: Schema.object({
    maxAgeDays: Schema.number().min(1).max(365).default(30),
    timeoutMs: Schema.number().min(5000).max(120000).default(20000),
  }).default({ maxAgeDays: 30, timeoutMs: 20000 }),
  retention: Schema.object({
    days: Schema.number().min(1).max(3650).default(90),
    items: Schema.number().min(10).max(2000).default(200),
    runs: Schema.number().min(10).max(2000).default(100),
  }).default({ days: 90, items: 200, runs: 100 }),
}).volatile()

/** Read the live value of a schemastery volatile field (or a plain value). */
export function valueOf(field) {
  return typeof field?.get === 'function' ? field.get() : field
}

/** Current configuration snapshot, robust against plain values and partial configs. */
export function readConfig(config) {
  const raw = valueOf(config) ?? {}
  return {
    enabled: raw.enabled ?? true,
    sources: Array.isArray(raw.sources) ? raw.sources : PRESET_SOURCES,
    channel: { enabled: true, keyword: 'iOS', ...(raw.channel ?? {}) },
    schedule: { enabled: true, time: DEFAULT_TIME, timezone: DEFAULT_TIMEZONE, ...(raw.schedule ?? {}) },
    llm: { provider: '', model: '', ...(raw.llm ?? {}) },
    fetch: { maxAgeDays: 30, timeoutMs: 20000, ...(raw.fetch ?? {}) },
    retention: { days: 90, items: 200, runs: 100, ...(raw.retention ?? {}) },
  }
}

export function normalizeSource(source, index = 0) {
  const rawType = source?.type ?? source?.mode
  const type = rawType === 'apple' || rawType === 'apple-release'
    ? 'apple-release'
    : rawType === 'page' || rawType === 'web' ? 'web' : 'rss'
  const mode = type === 'apple-release' ? 'apple' : type === 'web' ? 'page' : 'rss'
  const fallbackId = type === 'apple-release'
    ? `apple-${source?.track || index}`
    : `source-${index + 1}`
  return {
    id: String(source?.id || fallbackId),
    name: String(source?.name || source?.url || `Source ${index + 1}`),
    type,
    mode,
    track: type === 'apple-release' ? String(source?.track || '') : '',
    url: String(source?.url || ''),
    keywords: String(source?.keywords || ''),
    maxAgeDays: Number(source?.maxAgeDays) > 0 ? Number(source.maxAgeDays) : 30,
    enabled: source?.enabled !== false,
    includeBeta: source?.includeBeta === true,
  }
}

/** Split a keyword field into required (+) and excluded (-) terms. */
export function parseKeywords(value) {
  const include = []
  const exclude = []
  for (const token of String(value ?? '').split(/[,\n]/)) {
    const term = token.trim()
    if (!term) continue
    if (term.startsWith('-') || term.startsWith('!')) {
      const clean = term.slice(1).trim()
      if (clean) exclude.push(clean.toLowerCase())
    } else {
      include.push(term.toLowerCase())
    }
  }
  return { include, exclude }
}

/** Apply the optional keyword filter to an entry title/body. */
export function matchesKeywords(keywords, ...parts) {
  const { include, exclude } = parseKeywords(keywords)
  const haystack = parts.filter(Boolean).join('\n').toLowerCase()
  if (!haystack) return include.length === 0
  if (exclude.some(term => haystack.includes(term))) return false
  if (include.length === 0) return true
  return include.some(term => haystack.includes(term))
}

export function presetSourceState() {
  return PRESET_SOURCES.map(source => ({ ...source }))
}