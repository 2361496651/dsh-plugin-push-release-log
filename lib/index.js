import {
  Config,
  CREDENTIAL_KEY,
  readConfig,
} from './config.js'
import { createDingTalkAdapter } from './channels/index.js'
import { Engine } from './engine.js'
import { fetchJson, fetchText } from './fetch.js'
import { createRoutes } from './server.js'
import { createSourceContext } from './sources/index.js'
import { Store } from './store.js'
import { dateKey, parseTime, scheduledInstantForToday, shouldCatchUp, validTimezone } from './scheduler.js'

export { Config }
export const name = 'dsh-changelog-push'
export const inject = ['llm', 'credentials', 'webServer', 'profileContext', 'agentDefaultModel']

export function apply(ctx, config) {
  const getConfig = () => readConfig(config)
  const store = new Store(ctx.profileContext.dir)
  const sourceContextFactory = timeoutMs => createSourceContext({ fetchText, fetchJson, timeoutMs })
  const log = {
    warn: message => ctx.logger?.warn?.(String(message)),
    info: message => ctx.logger?.info?.(String(message)),
    error: message => ctx.logger?.error?.(String(message)),
  }

  const readToken = async () => {
    try {
      const record = await ctx.credentials.readRecord(CREDENTIAL_KEY)
      return record?.payload?.token ?? ''
    } catch {
      return ''
    }
  }

  const channel = createDingTalkAdapter({
    getToken: readToken,
    getKeyword: () => getConfig().channel.keyword,
    timeoutMs: 20000,
  })

  const engine = new Engine({
    store,
    sourceContextFactory,
    getConfig,
    llm: ctx.llm,
    agentDefaultModel: ctx.agentDefaultModel,
    channel,
    log,
  })

  const routes = createRoutes({
    getConfig,
    store,
    engine,
    channel,
    credentials: ctx.credentials,
    credentialKey: CREDENTIAL_KEY,
    log,
  })

  ctx.effect(() => ctx.webServer.register({ kind: 'prefix', path: '/changelog-push', handler: routes.handler }))

  ctx.inject(['settings'], scope => {
    scope.effect(() => scope.settings.configure({ auto: false }, ctx.fiber))
  })

  const runInBackground = trigger => {
    engine.run({ trigger }).catch(error => log.warn(`运行失败：${error?.message || error}`))
  }

  const tick = async () => {
    if (engine.running) return
    const config = getConfig()
    if (!config.enabled || !config.schedule.enabled) return
    if (!(await readToken())) return
    if (!parseTime(config.schedule.time)) return
    const timezone = validTimezone(config.schedule.timezone) ? config.schedule.timezone : 'Asia/Shanghai'
    const instant = scheduledInstantForToday(config.schedule.time, timezone)
    if (!instant || Date.now() < instant.getTime()) return
    if (store.state.schedule.lastScheduledDate === dateKey(new Date(), timezone)) return
    runInBackground('scheduled')
  }

  const interval = setInterval(() => {
    tick().catch(error => log.warn(`定时检查失败：${error?.message || error}`))
  }, 60000)
  ctx.effect(() => () => clearInterval(interval))

  const startup = setTimeout(async () => {
    const config = getConfig()
    if (!config.enabled || !config.schedule.enabled || engine.running) return
    if (!(await readToken())) return
    const checks = Object.values(store.state.cursors ?? {}).map(cursor => cursor.lastCheckAt).filter(Boolean)
    const lastCheckAt = checks.length ? checks.sort().at(-1) : null
    const timezone = validTimezone(config.schedule.timezone) ? config.schedule.timezone : 'Asia/Shanghai'
    if (shouldCatchUp({
      lastCheckAt,
      time: config.schedule.time,
      timezone,
      lastScheduledDate: store.state.schedule.lastScheduledDate,
    })) {
      runInBackground('startup')
    }
  }, 2500)
  ctx.effect(() => () => clearTimeout(startup))

  log.info(`已加载，状态文件：${store.file}`)
}
