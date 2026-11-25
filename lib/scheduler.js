const DAY_MS = 86400000

export function validTimezone(timezone) {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone })
    return true
  } catch {
    return false
  }
}

export function tzParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)
  const lookup = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return {
    year: Number(lookup.year),
    month: Number(lookup.month),
    day: Number(lookup.day),
    hour: Number(lookup.hour),
    minute: Number(lookup.minute),
    second: Number(lookup.second),
  }
}

function offsetMs(date, timezone) {
  const parts = tzParts(date, timezone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - (date.getTime() - date.getMilliseconds())
}

export function zonedToUtc({ year, month, day, hour, minute }, timezone) {
  const target = Date.UTC(year, month - 1, day, hour, minute, 0)
  let guess = target
  for (let index = 0; index < 3; index += 1) {
    const next = target - offsetMs(new Date(guess), timezone)
    if (next === guess) break
    guess = next
  }
  return new Date(guess)
}

export function parseTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? ''))
  if (!match) return null
  return { hour: Number(match[1]), minute: Number(match[2]) }
}

export function dateKey(date, timezone) {
  const parts = tzParts(date, timezone)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

export function nextRunAt(time, timezone, now = new Date()) {
  const parsed = parseTime(time)
  if (!parsed) return null
  const zone = validTimezone(timezone) ? timezone : 'Asia/Shanghai'
  const parts = tzParts(now, zone)
  let candidate = zonedToUtc({ year: parts.year, month: parts.month, day: parts.day, ...parsed }, zone)
  if (candidate.getTime() <= now.getTime()) {
    const tomorrow = new Date(Date.UTC(parts.year, parts.month - 1, parts.day) + DAY_MS)
    candidate = zonedToUtc({
      year: tomorrow.getUTCFullYear(),
      month: tomorrow.getUTCMonth() + 1,
      day: tomorrow.getUTCDate(),
      ...parsed,
    }, zone)
  }
  return candidate
}

export function scheduledInstantForToday(time, timezone, now = new Date()) {
  const parsed = parseTime(time)
  if (!parsed) return null
  const zone = validTimezone(timezone) ? timezone : 'Asia/Shanghai'
  const parts = tzParts(now, zone)
  return zonedToUtc({ year: parts.year, month: parts.month, day: parts.day, ...parsed }, zone)
}

export function formatInZone(value, timezone) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: validTimezone(timezone) ? timezone : 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date).replace(/\//g, '-')
  } catch {
    return date.toISOString()
  }
}

export function shouldCatchUp({ lastCheckAt, time, timezone, lastScheduledDate, now = new Date() }) {
  if (!lastCheckAt) return true
  const last = Date.parse(lastCheckAt)
  if (!Number.isFinite(last)) return true
  if (now.getTime() - last >= DAY_MS) return true
  const instant = scheduledInstantForToday(time, timezone, now)
  if (!instant) return false
  const today = dateKey(now, timezone)
  return now.getTime() >= instant.getTime() && lastScheduledDate !== today
}