import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const EMPTY = () => ({
  schemaVersion: 1,
  version: 1,
  cursors: {},
  items: [],
  runs: [],
  channel: { status: 'unknown', lastError: null, lastSuccessAt: null },
  schedule: { lastRunDate: null, nextRunAt: null, lastStartupCatchupAt: null },
})

export class Store {
  constructor(home) {
    this.dir = join(home, 'changelog-push')
    this.file = join(this.dir, 'state.json')
    this.state = this.load()
  }

  load() {
    try {
      if (!existsSync(this.file)) return EMPTY()
      const parsed = JSON.parse(readFileSync(this.file, 'utf8'))
      return { ...EMPTY(), ...parsed }
    } catch {
      return EMPTY()
    }
  }

  save() {
    try {
      mkdirSync(this.dir, { recursive: true })
      const tmp = `${this.file}.tmp`
      writeFileSync(tmp, JSON.stringify(this.state, null, 2))
      renameSync(tmp, this.file)
    } catch {
      // Never let a state write failure break push delivery.
    }
  }

  prune(retention) {
    const now = Date.now()
    const cutoff = now - retention.days * 86400000
    const keepTime = value => {
      const at = Date.parse(value)
      return Number.isFinite(at) ? at >= cutoff : true
    }
    this.state.items = this.state.items.filter(item => keepTime(item.pushedAt || item.createdAt)).slice(0, retention.items)
    this.state.runs = this.state.runs.filter(run => keepTime(run.startedAt)).slice(0, retention.runs)
    for (const [id, cursor] of Object.entries(this.state.cursors)) {
      if (cursor.seen?.length > 1000) cursor.seen = cursor.seen.slice(-1000)
      if (!cursor.lastCheckAt && !cursor.seen?.length) delete this.state.cursors[id]
    }
  }

  cursor(sourceId) {
    if (!this.state.cursors[sourceId]) {
      this.state.cursors[sourceId] = {
        seen: [],
        initialized: false,
        lastCheckAt: null,
        latest: null,
        lastOk: null,
        lastError: null,
      }
    }
    return this.state.cursors[sourceId]
  }

  markSeen(sourceId, keys) {
    const cursor = this.cursor(sourceId)
    const seen = new Set(cursor.seen)
    for (const key of keys) seen.add(key)
    cursor.seen = [...seen]
  }

  addItem(item) {
    this.state.items.unshift(item)
  }

  addRun(run) {
    this.state.runs.unshift(run)
  }

  channel() {
    return this.state.channel
  }
}