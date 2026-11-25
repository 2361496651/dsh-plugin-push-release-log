import { formatInZone } from './scheduler.js'

const MAX_PROMPT_NOTES = 12000

export function extractJson(text) {
  const source = String(text ?? '').trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = source.indexOf('{')
  const end = source.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(source.slice(start, end + 1))
  } catch {
    return null
  }
}

function cleanString(value, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function isHttpUrl(value) {
  return /^https?:\/\//i.test(String(value ?? ''))
}

export function entryDate(entry) {
  const time = Date.parse(entry.publishedAt ?? '')
  if (!Number.isFinite(time)) return ''
  return formatInZone(new Date(time), 'Asia/Shanghai').slice(0, 10)
}

/** Build the DingTalk title for an entry, keeping the required keyword. */
export function pushTitle(entry, keyword = 'iOS') {
  const prefix = `${keyword} 更新速递 · `
  if (entry.track === 'xcode') return `${prefix}Xcode ${entry.version}${entry.build ? ` (${entry.build})` : ''}`
  if (entry.track === 'ios') return `${prefix}iOS SDK ${entry.version}${entry.build ? ` (${entry.build})` : ''}`
  return `${prefix}${entry.title}`.slice(0, 64)
}

function fallbackTitle(entry, keyword = 'iOS') {
  if (entry.track === 'xcode') return `${keyword} 更新速递 · Xcode ${entry.version}`
  if (entry.track === 'ios') return `${keyword} 更新速递 · iOS SDK ${entry.version}`
  return `${keyword} 更新速递 · ${entry.title}`
}

export function normalizeSummary(raw, entry, keyword = 'iOS') {
  if (!raw || typeof raw !== 'object') return null
  const highlights = Array.isArray(raw.highlights)
    ? raw.highlights.map(item => cleanString(item, 160)).filter(Boolean).slice(0, 6)
    : []
  const impact = cleanString(raw.impact ?? raw.summary, 1200)
  if (!highlights.length && impact.length < 20) return null
  const rawLink = cleanString(raw.link, 500)
  return {
    title: cleanString(raw.title, 120) || fallbackTitle(entry, keyword),
    version: cleanString(raw.version, 40) || entry.version || '',
    build: cleanString(raw.build, 40) || entry.build || '',
    date: cleanString(raw.date, 20) || entryDate(entry),
    highlights,
    impact,
    link: isHttpUrl(rawLink) ? rawLink : entry.link,
    degraded: false,
  }
}

function bulletsFrom(content) {
  const lines = String(content ?? '').split('\n').map(line => line.trim()).filter(Boolean)
  const bullets = []
  for (const line of lines) {
    if (/^[-*]\s/.test(line)) bullets.push(line.replace(/^[-*]\s*/, '').replace(/\s*\(\d+\)$/, ''))
  }
  return bullets
}

export function ruleSummary(entry, content, reason, keyword = 'iOS') {
  const bullets = bulletsFrom(content).slice(0, 5)
  const plain = String(content ?? '').replace(/\s+/g, ' ').trim()
  const impactParts = [`${entry.title} 已发布。自动摘要暂不可用，以下为规则提取的要点。`]
  if (reason) impactParts.push(`（原因：${String(reason).slice(0, 80)}）`)
  const impact = impactParts.join(' ').slice(0, 500)
  const highlights = bullets.length
    ? bullets
    : plain.split(/(?<=。)/).map(item => item.trim()).filter(Boolean).slice(0, 5)
  return {
    title: fallbackTitle(entry, keyword),
    version: entry.version || '',
    build: entry.build || '',
    date: entryDate(entry),
    highlights: highlights.slice(0, 6).map(item => item.slice(0, 160)),
    impact,
    link: entry.link || '',
    degraded: true,
  }
}

function trackBrief(track) {
  if (track === 'xcode') {
    return '这是 Xcode 发布说明。重点概括：IDE 与工具链变化、新编译器/构建系统行为、SDK 版本、模拟器变化、已知问题，以及对现有工程的影响。'
  }
  if (track === 'ios') {
    return '这是 iOS/iPadOS SDK 发布说明。重点概括：新 API 与框架变化、弃用/移除、行为与运行时变化、隐私/权限/entitlement 变更、最低部署版本，以及与 Xcode 版本的对应关系（例如「iOS & iPadOS 27.3 SDK 随 Xcode 27.3 提供」）。'
  }
  return '请概括这次更新的主要内容，以及可能影响开发者现有工程的变化。'
}

export function buildPrompt(entry, content) {
  const notes = String(content ?? '').slice(0, MAX_PROMPT_NOTES)
  return [
    {
      role: 'system',
      content: [{
        type: 'text',
        text: '你是 Apple 平台开发者的技术编辑。请把官方发布说明改写成中文摘要，只输出一个 JSON 对象，不要输出 Markdown 代码块或任何解释。',
      }],
    },
    {
      role: 'user',
      content: [{
        type: 'text',
        text: [
          `发布日志：${entry.title}`,
          `版本：${entry.version}${entry.qualifier ? ` ${entry.qualifier}` : ''}`,
          `构建号：${entry.build || '未知'}`,
          `来源：${entry.source?.name ?? 'Apple Developer'}`,
          '',
          trackBrief(entry.track),
          '',
          '要求：',
          '1. title 形如「Xcode 27.3 发布」或「iOS SDK 27.3 发布」。',
          '2. highlights 为 3–6 条面向开发者的要点，每条不超过 60 个中文字符。',
          '3. impact 用 80–200 个中文字符说明对开发者的影响；没有明显影响时写升级建议。',
          `4. version 填 ${entry.version || '版本号'}，build 填 ${entry.build || '构建号'}，date 填 ${entryDate(entry) || '发布日期'}。`,
          `5. link 使用原文链接：${entry.link || '（无）'}。`,
          '6. 只依据给出的发布说明，不要编造版本号或功能；不要罗列所有 build 号；输出中文。',
          '7. 返回结构：{"title":"…","version":"…","build":"…","date":"YYYY-MM-DD","highlights":["…"],"impact":"…","link":"…"}',
          '',
          '发布说明原文：',
          notes,
        ].join('\n'),
      }],
    },
  ]
}

export async function summarizeEntry(entry, content, { llm, selection, timeoutMs = 60000, keyword = 'iOS' } = {}) {
  if (!llm || typeof llm.stream !== 'function') {
    return ruleSummary(entry, content, '当前环境没有可用的 LLM 服务', keyword)
  }
  const provider = selection?.provider
  const model = selection?.model
  if (!provider || !model) return ruleSummary(entry, content, '没有可用的默认模型', keyword)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  let text = ''
  let failure = ''
  try {
    for await (const chunk of llm.stream({
      provider,
      model,
      messages: buildPrompt(entry, content),
      signal: controller.signal,
      maxTokens: 1600,
    })) {
      if (chunk?.type === 'text-delta') text += chunk.text ?? ''
      else if (chunk?.type === 'finish') {
        const kind = chunk.reason?.kind
        if (kind === 'error' || kind === 'aborted') failure = chunk.reason?.failure?.message || kind
      }
    }
  } catch (error) {
    failure = error?.message || String(error)
  } finally {
    clearTimeout(timer)
  }
  if (failure) return ruleSummary(entry, content, failure, keyword)
  const normalized = normalizeSummary(extractJson(text), entry, keyword)
  if (!normalized) return ruleSummary(entry, content, text ? '模型返回内容无法解析' : '模型没有返回内容', keyword)
  return normalized
}

export function buildMarkdown(entry, summary, keyword = 'iOS') {
  const lines = []
  const label = entry.track === 'xcode'
    ? `Xcode ${summary.version || entry.version}`
    : entry.track === 'ios'
      ? `iOS SDK ${summary.version || entry.version}`
      : (entry.title || fallbackTitle(entry))
  lines.push(`### ${keyword} 更新速递 · ${label}`)
  lines.push('')
  const versionText = summary.version
    ? `${entry.track === 'ios' ? 'iOS SDK ' : entry.track === 'xcode' ? 'Xcode ' : ''}${summary.version}${summary.build ? ` (${summary.build})` : ''}`
    : entry.version || '未知'
  lines.push(`**版本**：${versionText}　**日期**：${summary.date || entryDate(entry) || '未知'}`)
  lines.push(`**来源**：${entry.source?.name ?? 'Apple Developer'}`)
  if (summary.degraded) {
    lines.push('')
    lines.push('> 本次使用规则摘要（LLM 摘要不可用）')
  }
  if (summary.highlights?.length) {
    lines.push('')
    lines.push('**要点**')
    for (const highlight of summary.highlights) lines.push(`- ${highlight}`)
  }
  if (summary.impact) {
    lines.push('')
    lines.push('**对开发者的影响**')
    lines.push(summary.impact)
  }
  const link = summary.link || entry.link
  if (link) {
    lines.push('')
    lines.push(`[查看完整发布说明](${link})`)
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}
