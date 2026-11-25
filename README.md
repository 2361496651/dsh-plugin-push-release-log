# Release通知 · dsh-changelog-push

自动追踪 Apple 开发者发布日志（Xcode / iOS SDK），用 LLM 生成中文摘要，并推送到钉钉群。作为 **DeepSeek Harness** 的独立设置页运行，配置和数据都保存在你自己的 DSH profile 中。

> 插件不内置任何 Webhook。首次安装后必须在「推送通道」填写你自己的钉钉机器人地址，定时推送才会启动。

## 功能

- **Apple 官方源**：预设 `Xcode Release Notes` 与 `iOS SDK Release Notes`，共享 Apple 发布 RSS，按标题解析版本、Beta/RC 与构建号，再抓取 DocC 发布说明全文。
- **自定义源**：Apple 发布日志、普通 RSS/Atom、任意网页（按内容指纹去重）。
- **钉钉推送**：Markdown 消息、关键词校验、超长消息按字节分段、失败重试与退避。
- **每日定时**：默认 09:00（Asia/Shanghai），60 秒心跳检查，启动补跑；首次运行只建立基线，不推送历史版本。
- **去重与合并**：`sourceId:version:build` 去重；同一版本 12 小时内的多个构建号只保留最后一个。
- **中文摘要**：通过 `ctx.llm.stream` 调用当前默认模型；失败时降级为规则摘要并标记 `degraded`，不会因此中断推送。
- **运行记录**：最近 200 条更新、100 次运行，保留 90 天，只写入插件自己的状态文件。
- **凭据隔离**：Webhook 存在 DSH 凭据库，页面和日志只显示 `••••` 掩码。

## 环境要求

- DeepSeek Harness Web 版，版本 `>= 0.2.2-rc.1`（使用 `settings.section`、`configForms`、`credentials` 服务）。
- 一个钉钉群自定义机器人 Webhook。
- 默认模型可用；不可用时摘要会自动降级。

## 安装

### 从 npm 安装（推荐）

发布后，在 DSH 的 **Plugins** 页面选择安装，输入包名：

```text
dsh-changelog-push
```

也可以让 Agent 通过 `plugin_manager` 安装（需要 `danger-full-access` 或单次审批）：

```text
plugin_manager install_bundle("dsh-changelog-push")
```

### 从 GitHub 安装

在 **Plugins** 页面输入固定标签，避免每次拉取内容不同：

```text
github:2361496651/dsh-plugin-push-release-log#v0.5.0
```

GitHub 直装没有版本更新检查，升级时需要重新安装；并且需要本机可访问 GitHub、具备 `git`。

### 本地开发安装

```text
plugin_manager install_bundle("/absolute/path/to/dsh-plugin-push-release-log")
```

本地包以 `link:` 方式安装，修改 Host 代码后需要 `remove_bundle` + `install_bundle` 才会生效；Client 代码改动后刷新页面即可。

## 首次配置

1. 打开 **设置 → Release通知**。
2. 进入 **推送通道**，粘贴钉钉自定义机器人的完整 Webhook 地址，或只粘贴 `access_token`。
3. 点击 **发送测试**，确认群里能收到消息。测试失败时页面会显示钉钉返回的原因。
4. 进入 **订阅源**，确认两个 Apple 预设已启用；也可以添加 RSS 或网页源，先“校验”再保存。
5. 在 **高级** 中确认推送时间、时区、Beta 开关、LLM 供应商/模型与保留策略。
6. **概览 → 立即检查** 手动跑一次。第一次运行只记录基线，不推送历史更新。
7. 想立即验证摘要效果，用 **高级 → 调试 → 推送最新更新**：抓取每个启用源的最新一条真实发布，逐条生成摘要并发送到钉钉（会真实发送）。

> 提示：钉钉机器人如果启用了“自定义关键词”，关键词必须出现在消息标题或正文里。默认关键词是 `iOS`，可在 **推送通道** 修改；插件发送前会自动检查并在缺失时补上。

## 配置项

| 字段 | 默认值 | 说明 |
| --- | --- | --- |
| `enabled` | `true` | 插件总开关 |
| `sources` | 两个 Apple 预设 | 订阅源列表；每项含 `type`、`track`、`url`、`keywords`、`maxAgeDays`、`enabled`、`includeBeta` |
| `channel.enabled` | `true` | 是否允许推送 |
| `channel.keyword` | `iOS` | 钉钉安全关键词 |
| `schedule.enabled` | `true` | 每日定时开关 |
| `schedule.time` | `09:00` | 每日推送时间 `HH:mm` |
| `schedule.timezone` | `Asia/Shanghai` | 时区 |
| `llm.provider` / `llm.model` | 空 | 留空使用当前默认模型 |
| `fetch.maxAgeDays` | `30` | 只处理最近 N 天的发布 |
| `fetch.timeoutMs` | `20000` | 单次抓取超时 |
| `retention.days` | `90` | 历史保留天数 |
| `retention.items` | `200` | 保留更新条数 |
| `retention.runs` | `100` | 保留运行次数 |

配置通过 `ctx.configForms.get('dsh-changelog-push')`（实际条目 id 可能是 `include:dsh-changelog-push`）写入；整个 `Config` 是 volatile 的，修改不会重启插件。

## 数据与隐私

- 状态文件：`<profile>/changelog-push/state.json`，可用 **高级 → 清空记录** 删除。
- 凭据：`dsh-changelog-push/dingtalk`，保存在 DSH 凭据库；插件没有内置 token。
- 日志和 API 错误统一经过脱敏，不输出 Webhook。
- 插件不注册会话事件，也不会把推送内容写入会话记录。
- Webhook 等同于向群里发消息的权限。不要截图、不要提交到仓库；怀疑泄露时请到钉钉机器人后台重置 token。

## 目录结构

```text
lib/
  index.js           插件入口：服务注入、路由、定时调度、启动补跑
  config.js          Config schema、预设源、常量
  fetch.js           HTTP 抓取、重试、Webhook 掩码/脱敏
  parse.js           RSS/DocC 解析、Apple 标题解析
  summarize.js       LLM 摘要与规则降级、Markdown 组装
  scheduler.js       时区换算与补跑判断
  store.js           状态文件（原子写入、保留策略）
  engine.js          抓取 → 去重 → 摘要 → 推送 流水线
  server.js          /changelog-push/* HTTP API
  sources/           apple-release / rss / web 三类订阅源
  channels/          dingtalk 适配器
  vendor/            内置的 schemastery / cosmokit（MIT，见 THIRD_PARTY_NOTICES）
client/client.js     设置页（React + slots）
locale/              zh-CN / en 文案
icon.svg             插件图标
```

## 开发

```bash
node --check lib/*.js lib/**/*.js client/client.js
```

运行仓库内的离线测试（不访问 Apple、不发送钉钉消息）：

```bash
npm test
```

## 发布

1. 更新 `package.json` 版本与 `CHANGELOG.md`。
2. 确认 `git grep -n "access_token\\|3de2e311"` 没有真实凭据。
3. 打标签 `vX.Y.Z` 并推送，创建 GitHub Release。
4. `npm publish`（需要先在 npm 登录并确认包名可用）。

## License

[MIT](LICENSE)。内置依赖的许可见 [THIRD_PARTY_NOTICES](THIRD_PARTY_NOTICES)。