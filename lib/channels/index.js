import { isHttpUrl, normalizeWebhook } from '../fetch.js'
import { ChannelError, DingTalkChannel } from './dingtalk.js'

export { ChannelError }

export function createDingTalkAdapter({ getToken, getKeyword, timeoutMs }) {
  const client = new DingTalkChannel({ getToken, getKeyword, timeoutMs })
  return {
    id: 'dingtalk',
    name: '钉钉',
    validate(config) {
      const token = normalizeWebhook(config?.token)
      if (!token || !isHttpUrl(token)) return { ok: false, message: 'Webhook 地址不合法' }
      if (!/access_token=./.test(token)) return { ok: false, message: '缺少 access_token' }
      return { ok: true }
    },
    async send(message) {
      return client.send(message)
    },
    async test({ title = 'dsh-changelog-push 测试消息', text = '这是一条测试消息。' } = {}) {
      return client.send({ title, text: `**测试消息**\n\n${text}` })
    },
  }
}