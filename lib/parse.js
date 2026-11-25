const NAMED_ENTITIES = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  hellip: '…',
  mdash: '—',
  ndash: '–',
  rsquo: '’',
  lsquo: '‘',
  ldquo: '“',
  rdquo: '”',
  middot: '·',
  bull: '•',
  copy: '©',
  reg: '®',
  trade: '™',
}

export function decodeEntities(value) {
  return String(value ?? '')
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED_ENTITIES[name.toLowerCase()] ?? match)
}

export function stripHtml(value) {
  return decodeEntities(
    String(value ?? '')
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
      .replace(/<[^>]+>/g, ' '),
  )
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
}

export function cdataOrText(value) {
  if (value == null) return ''
  const cdata = /^<!\[CDATA\[([\s\S]*?)\]\]>$/.exec(value.trim())
  return decodeEntities(cdata ? cdata[1] : value)
}

function firstTag(xml, tag) {
  const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i').exec(xml)
  return match ? match[1] : ''
}

function attr(xml, tag, name) {
  const match = new RegExp(`<${tag}\\b([^>]*)>`, 'i').exec(xml)
  if (!match) return ''
  const value = new RegExp(`\\b${name}=["']([^"']*)["']`, 'i').exec(match[1])
  return value ? decodeEntities(value[1]) : ''
}

function parseEntry(xml) {
  const title = cdataOrText(firstTag(xml, 'title'))
  let link = cdataOrText(firstTag(xml, 'link')).trim()
  if (!link) link = attr(xml, 'link', 'href')
  if (!link) {
    const guid = cdataOrText(firstTag(xml, 'guid')).trim()
    if (/^https?:\/\//i.test(guid)) link = guid
  }
  const publishedRaw = cdataOrText(firstTag(xml, 'pubDate')) || cdataOrText(firstTag(xml, 'published')) || cdataOrText(firstTag(xml, 'updated'))
  const publishedAt = Number.isFinite(Date.parse(publishedRaw)) ? new Date(publishedRaw).toISOString() : null
  const content = cdataOrText(firstTag(xml, 'content:encoded'))
    || cdataOrText(firstTag(xml, 'content'))
    || cdataOrText(firstTag(xml, 'description'))
    || cdataOrText(firstTag(xml, 'summary'))
  return {
    title,
    link,
    publishedAt,
    rawContent: content,
    text: stripHtml(content),
  }
}

/** Parse RSS 2.0, RSS 1.0-ish and Atom into a flat entry list. */
export function parseFeed(xml) {
  const source = String(xml ?? '')
  const chunks = [...source.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)].map(match => match[1])
  if (chunks.length === 0) chunks.push(...[...source.matchAll(/<entry\b[^>]*>([\s\S]*?)<\/entry>/gi)].map(match => match[1]))
  return chunks.map(parseEntry).filter(entry => entry.title)
}

export function parseAppleTitle(title, track) {
  const text = String(title ?? '').trim()
  if (track === 'xcode') {
    const match = /^Xcode\s+([\d.]+)(?:\s+(beta|RC)\s*(\d+))?\s*\(([0-9A-Za-z]+)\)/i.exec(text)
    if (!match) return null
    return {
      version: match[1],
      qualifier: match[2] ? `${match[2]}${match[3] ? ` ${match[3]}` : ''}` : '',
      isBeta: Boolean(match[2]),
      build: match[4],
    }
  }
  const match = /^iOS\s+([\d.]+)(?:\s+(beta|RC)\s*(\d+))?(?:\s+v(\d+))?\s*\(([0-9A-Za-z]+)\)/i.exec(text)
  if (!match) return null
  const qualifierParts = []
  if (match[2]) qualifierParts.push(match[2])
  if (match[3]) qualifierParts.push(match[3])
  if (match[4]) qualifierParts.push(`v${match[4]}`)
  return {
    version: match[1],
    qualifier: qualifierParts.join(' '),
    isBeta: Boolean(match[2]),
    build: match[5],
  }
}

export function appleDetailUrl(track, version) {
  if (track === 'xcode') return `https://developer.apple.com/tutorials/data/documentation/xcode-release-notes/xcode-${version.replace(/\./g, '_')}-release-notes.json`
  const slug = `ios-ipados-${version.replace(/\./g, '_')}-release-notes`
  return `https://developer.apple.com/tutorials/data/documentation/${slug}.json`
}

export function appleDetailFallbacks(track, version) {
  if (track === 'xcode') {
    const slug = `xcode-${version.replace(/\./g, '_')}-release-notes`
    return [`https://developer.apple.com/tutorials/data/documentation/${slug}.json`]
  }
  const specials = { '16.1': 'ios-16_1-release-notes', '12': 'ios-12-release-notes' }
  const list = []
  if (specials[version]) list.push(`https://developer.apple.com/tutorials/data/documentation/${specials[version]}.json`)
  list.push(`https://developer.apple.com/tutorials/data/documentation/ios-ipados-${version.replace(/\./g, '_')}-release-notes.json`)
  return list
}

export function inlineText(inline) {
  if (!Array.isArray(inline)) return ''
  return inline.map(item => {
    if (!item) return ''
    if (item.type === 'text') return item.text ?? ''
    if (item.type === 'codeVoice') return item.code ?? ''
    if (item.type === 'reference') return item.title ?? item.identifier?.split('/').pop() ?? ''
    return inlineText(item.inlineContent)
  }).join('')
}

function blockText(block, depth = 0) {
  if (!block) return ''
  switch (block.type) {
    case 'heading':
      return `${'#'.repeat(Math.min(6, (block.level ?? 1) + 1))} ${block.text ?? ''}`
    case 'paragraph':
      return inlineText(block.inlineContent)
    case 'codeListing':
      return `\`\`\`\n${(block.code ?? []).join('\n')}\n\`\`\``
    case 'unorderedList':
      return (block.items ?? []).map(item => `- ${blockText(item, depth + 1)}`).join('\n')
    case 'orderedList':
      return (block.items ?? []).map((item, index) => `${index + 1}. ${blockText(item, depth + 1)}`).join('\n')
    case 'aside':
      return `> ${(block.content ?? []).map(item => blockText(item, depth + 1)).join('\n> ')}`
    case 'table':
      return (block.rows ?? []).map(row => (row ?? []).map(cell => cell.map?.(part => blockText(part)).join(' ') ?? blockText(cell)).join(' | ')).join('\n')
    case 'termList':
      return (block.items ?? []).map(item => `${inlineText(item.term?.inlineContent)}：${(item.definition?.content ?? []).map(part => blockText(part, depth + 1)).join(' ')}`).join('\n')
    default:
      return (block.content ?? []).map(item => blockText(item, depth + 1)).join('\n')
  }
}

export function doccToText(doc, { maxChars = 14000 } = {}) {
  const blocks = []
  const abstract = inlineText(doc?.abstract)
  if (abstract) blocks.push(abstract)
  for (const section of doc?.primaryContentSections ?? []) {
    if (section?.kind === 'content') {
      for (const content of section.content ?? []) {
        const text = blockText(content)
        if (text?.trim()) blocks.push(text.trim())
      }
    } else if (section?.kind === 'declarations') {
      for (const declaration of section.declarations ?? []) {
        const tokens = declaration.tokens?.map(token => token.text).join('')
        if (tokens) blocks.push(`\`\`\`\n${tokens}\n\`\`\``)
      }
    }
  }
  return blocks.join('\n\n').slice(0, maxChars)
}

export function pageToText(html, { maxChars = 12000 } = {}) {
  const source = String(html ?? '')
  const article = /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(source)?.[1]
    || /<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(source)?.[1]
    || source
  return stripHtml(article)
    .replace(/\n{3,}/g, '\n\n')
    .slice(0, maxChars)
}