window.__ModuleLoader__.load({
  id: 'dsh-changelog-push',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const NS = 'dsh-changelog-push'
    const ENTRY_ID = 'dsh-changelog-push'
    const FORM_IDS = [ENTRY_ID, `include:${ENTRY_ID}`]
    const TABS = ['overview', 'sources', 'channel', 'runs', 'advanced']

    const zh = {
      nav: 'Release通知',
      'meta.title': 'Release通知',
      'meta.description': '自动抓取 Apple 开发者发布日志，生成中文摘要并推送到钉钉。',
      'tabs.overview': '概览',
      'tabs.sources': '订阅源',
      'tabs.channel': '推送通道',
      'tabs.runs': '运行记录',
      'tabs.advanced': '高级',
      'common.save': '保存',
      'common.cancel': '取消',
      'common.replace': '替换',
      'common.test': '发送测试',
      'common.validate': '校验',
      'common.remove': '移除',
      'common.add': '添加',
      'common.retry': '重试',
      'common.loading': '加载中…',
      'common.empty': '暂无数据',
      'common.on': '已启用',
      'common.off': '已停用',
      'common.enabled': '启用',
      'common.disabled': '停用',
      'overview.title': 'Release通知',
      'overview.subtitle': '自动抓取 Apple 开发者发布日志，生成中文摘要并推送到钉钉。',
      'overview.runNow': '立即检查',
      'overview.running': '正在检查…',
      'overview.nextRun': '下次计划',
      'overview.lastCheck': '上次检查',
      'overview.lastResult': '上次结果',
      'overview.channel': '推送通道',
      'overview.recent': '最近更新',
      'overview.steps': '快速开始',
      'overview.step.sources': '确认订阅源',
      'overview.step.sources.desc': '默认已添加 Xcode 与 iOS SDK 两个 Apple 发布源。',
      'overview.step.channel': '配置钉钉推送',
      'overview.step.channel.desc': '填写钉钉自定义机器人的 Webhook，并发送一条测试消息。',
      'overview.step.schedule': '设定推送时间',
      'overview.step.schedule.desc': '每天到点检查一次，有新版本时自动推送中文摘要。',
      'overview.step.done': '已完成',
      'overview.step.todo': '待完成',
      'overview.configureHint': '还未配置钉钉 Webhook。完成配置后，定时检查和手动推送才会运行。',
      'overview.configureNow': '去配置',
      'overview.noNext': '未启用计划',
      'overview.noCheck': '尚未检查',
      'sources.title': '订阅源',
      'sources.desc': 'Apple 源共用同一份发布 RSS，按标题过滤；也可以添加任意 RSS 或网页监控。',
      'sources.empty': '还没有订阅源',
      'sources.empty.desc': '添加一个 Apple 发布源或自定义 RSS。',
      'sources.addApple': '添加 Apple 源',
      'sources.addRss': '添加 RSS 源',
      'sources.addPage': '添加网页监控',
      'sources.includeBeta': '包含 beta / RC',
      'sources.keywords': '关键词（含排除，-前缀）',
      'sources.maxAgeDays': '最长天数',
      'sources.track': '跟踪',
      'sources.track.xcode': 'Xcode',
      'sources.track.ios': 'iOS SDK',
      'sources.mode.apple': 'Apple 官方',
      'sources.mode.rss': 'RSS',
      'sources.mode.page': '网页',
      'sources.checkNow': '立即检查',
      'sources.checkOk': '检查完成，发现 {count} 条更新',
      'sources.validateOk': '校验通过：{count} 条，最新 {latest}',
      'sources.validateEmpty': '校验通过，但没有匹配的条目',
      'sources.validateFail': '校验失败：{message}',
      'sources.lastCheck': '上次检查',
      'sources.latest': '最新',
      'sources.never': '从未',
      'sources.url': '地址',
      'sources.name': '名称',
      'channel.title': '推送通道',
      'channel.desc': '当前版本只支持钉钉自定义机器人（Webhook）。',
      'channel.dingtalk': '钉钉',
      'channel.enabled': '启用钉钉推送',
      'channel.keyword': '安全关键词',
      'channel.keyword.desc': '钉钉机器人若启用了自定义关键词，请保持一致；默认 iOS。',
      'channel.webhook': 'Webhook 地址',
      'channel.webhook.desc': '填写完整地址或 access_token，保存后只显示掩码。',
      'channel.configured': '已配置',
      'channel.notConfigured': '未配置',
      'channel.testOk': '测试消息已发送（{chunks} 段）',
      'channel.testFail': '测试失败：{message}',
      'channel.lastSuccess': '最近成功',
      'channel.lastError': '最近错误',
      'channel.secretSaved': 'Webhook 已更新',
      'channel.config': '配置 Webhook',
      'channel.clear': '清除 Webhook',
      'channel.clearDesc': '删除当前保存的 Webhook 凭据。清除后定时推送会暂停，直到重新配置。',
      'channel.clearOk': '已清除 Webhook',
      'channel.clearConfirm': '确定清除已保存的钉钉 Webhook？',
      'channel.onlyDingtalk': '其他通道（飞书、Slack、邮件）暂未开放。',
      'runs.title': '运行记录',
      'runs.desc': '保留最近 100 次运行与 200 条更新，90 天后自动清理。',
      'runs.all': '全部',
      'runs.success': '成功',
      'runs.failed': '失败',
      'runs.baseline': '基线',
      'runs.empty': '还没有运行记录',
      'runs.empty.desc': '点击「立即检查」或等待计划任务执行。',
      'runs.trigger.scheduled': '计划',
      'runs.trigger.startup': '启动补跑',
      'runs.trigger.manual': '手动',
      'runs.trigger.debug': '调试',
      'runs.fetched': '抓取 {n}',
      'runs.fresh': '新增 {n}',
      'runs.pushed': '推送 {n}',
      'runs.failedCount': '失败 {n}',
      'runs.degraded': '规则摘要 {n}',
      'runs.items': '更新历史',
      'runs.items.empty': '还没有更新记录',
      'runs.status.pushed': '已推送',
      'runs.status.failed': '待重试',
      'runs.status.dead': '已放弃',
      'runs.status.skipped': '未推送',
      'runs.open': '查看',
      'advanced.title': '高级设置',
      'advanced.desc': '调整计划、模型与数据保留；修改会立即生效。',
      'advanced.schedule': '每日检查',
      'advanced.schedule.enabled': '启用每日检查',
      'advanced.schedule.time': '检查时间',
      'advanced.schedule.timezone': '时区',
      'advanced.llm': '摘要模型',
      'advanced.llm.desc': '留空时使用当前默认模型；摘要失败会自动降级为规则摘要。',
      'advanced.llm.provider': 'Provider',
      'advanced.llm.model': 'Model',
      'advanced.fetch': '抓取',
      'advanced.fetch.maxAgeDays': '只推送最近 N 天的版本',
      'advanced.fetch.timeout': '请求超时（毫秒）',
      'advanced.retention': '数据保留',
      'advanced.retention.items': '最多保留更新',
      'advanced.retention.runs': '最多保留运行',
      'advanced.retention.days': '保留天数',
      'advanced.debug': '调试',
      'advanced.debug.latest': '推送最新更新',
      'advanced.debug.latest.desc': '抓取每个订阅源中的最新一条更新，逐条生成中文摘要并立即推送到钉钉（会真实发送）。',
      'advanced.clear': '清空记录',
      'advanced.clear.desc': '删除所有更新历史与运行记录，不影响订阅源与配置。',
      'advanced.clearConfirm': '确定清空所有更新历史与运行记录？',
      'advanced.statePath': '状态文件由插件保存在 DSH 配置目录，不写入会话记录。',
      'advanced.saved': '已保存',
    }

    const en = {
      nav: 'Release Notifications',
      'meta.title': 'Release Notifications',
      'meta.description': 'Fetch Apple developer release notes, summarize in Chinese and push to DingTalk.',
      'tabs.overview': 'Overview',
      'tabs.sources': 'Sources',
      'tabs.channel': 'Channel',
      'tabs.runs': 'History',
      'tabs.advanced': 'Advanced',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.replace': 'Replace',
      'common.test': 'Send test',
      'common.validate': 'Validate',
      'common.remove': 'Remove',
      'common.add': 'Add',
      'common.retry': 'Retry',
      'common.loading': 'Loading…',
      'common.empty': 'Nothing here yet',
      'common.on': 'Enabled',
      'common.off': 'Disabled',
      'common.enabled': 'Enable',
      'common.disabled': 'Disable',
      'overview.title': 'Release Notifications',
      'overview.subtitle': 'Fetch Apple developer release notes, summarize in Chinese and push to DingTalk.',
      'overview.runNow': 'Check now',
      'overview.running': 'Checking…',
      'overview.nextRun': 'Next run',
      'overview.lastCheck': 'Last check',
      'overview.lastResult': 'Last result',
      'overview.channel': 'Channel',
      'overview.recent': 'Recent releases',
      'overview.steps': 'Getting started',
      'overview.step.sources': 'Confirm sources',
      'overview.step.sources.desc': 'Xcode and iOS SDK sources are included by default.',
      'overview.step.channel': 'Configure DingTalk',
      'overview.step.channel.desc': 'Paste a DingTalk robot webhook and send a test message.',
      'overview.step.schedule': 'Set a schedule',
      'overview.step.schedule.desc': 'Check daily and push Chinese summaries when new builds appear.',
      'overview.step.done': 'Done',
      'overview.step.todo': 'To do',
      'overview.configureHint': 'No DingTalk webhook configured yet. Scheduled checks and manual pushes stay paused until you add one.',
      'overview.configureNow': 'Configure',
      'overview.noNext': 'Schedule disabled',
      'overview.noCheck': 'Never checked',
      'sources.title': 'Sources',
      'sources.desc': 'Apple sources share one release RSS feed and filter by title. Any RSS or page source can be added.',
      'sources.empty': 'No sources yet',
      'sources.empty.desc': 'Add an Apple release source or a custom RSS feed.',
      'sources.addApple': 'Add Apple source',
      'sources.addRss': 'Add RSS source',
      'sources.addPage': 'Add page monitor',
      'sources.includeBeta': 'Include beta / RC',
      'sources.keywords': 'Keywords (prefix - to exclude)',
      'sources.maxAgeDays': 'Max age (days)',
      'sources.track': 'Track',
      'sources.track.xcode': 'Xcode',
      'sources.track.ios': 'iOS SDK',
      'sources.mode.apple': 'Apple',
      'sources.mode.rss': 'RSS',
      'sources.mode.page': 'Page',
      'sources.checkNow': 'Check now',
      'sources.checkOk': 'Checked: {count} releases',
      'sources.validateOk': 'Valid: {count} entries, latest {latest}',
      'sources.validateEmpty': 'Valid, but no matching entries',
      'sources.validateFail': 'Validation failed: {message}',
      'sources.lastCheck': 'Last check',
      'sources.latest': 'Latest',
      'sources.never': 'Never',
      'sources.url': 'URL',
      'sources.name': 'Name',
      'channel.title': 'Channel',
      'channel.desc': 'Only DingTalk custom robot webhooks are supported in this version.',
      'channel.dingtalk': 'DingTalk',
      'channel.enabled': 'Enable DingTalk push',
      'channel.keyword': 'Security keyword',
      'channel.keyword.desc': 'Must match the keyword configured on the robot; defaults to iOS.',
      'channel.webhook': 'Webhook',
      'channel.webhook.desc': 'Paste the full URL or access_token. It is masked after saving.',
      'channel.configured': 'Configured',
      'channel.notConfigured': 'Not configured',
      'channel.testOk': 'Test message sent ({chunks} chunks)',
      'channel.testFail': 'Test failed: {message}',
      'channel.lastSuccess': 'Last success',
      'channel.lastError': 'Last error',
      'channel.secretSaved': 'Webhook updated',
      'channel.config': 'Configure webhook',
      'channel.clear': 'Clear webhook',
      'channel.clearDesc': 'Delete the saved webhook credential. Scheduled pushes pause until you configure one again.',
      'channel.clearOk': 'Webhook cleared',
      'channel.clearConfirm': 'Clear the saved DingTalk webhook?',
      'channel.onlyDingtalk': 'Feishu, Slack and email are not available yet.',
      'runs.title': 'History',
      'runs.desc': 'Keeps the last 100 runs and 200 releases, pruned after 90 days.',
      'runs.all': 'All',
      'runs.success': 'Success',
      'runs.failed': 'Failed',
      'runs.baseline': 'Baseline',
      'runs.empty': 'No runs yet',
      'runs.empty.desc': 'Click "Check now" or wait for the schedule.',
      'runs.trigger.scheduled': 'Scheduled',
      'runs.trigger.startup': 'Startup',
      'runs.trigger.manual': 'Manual',
      'runs.trigger.debug': 'Debug',
      'runs.fetched': 'Fetched {n}',
      'runs.fresh': 'New {n}',
      'runs.pushed': 'Pushed {n}',
      'runs.failedCount': 'Failed {n}',
      'runs.degraded': 'Rule summary {n}',
      'runs.items': 'Release history',
      'runs.items.empty': 'No releases yet',
      'runs.status.pushed': 'Pushed',
      'runs.status.failed': 'Retrying',
      'runs.status.dead': 'Abandoned',
      'runs.status.skipped': 'Not pushed',
      'runs.open': 'Open',
      'advanced.title': 'Advanced',
      'advanced.desc': 'Tune schedule, model and retention. Changes apply immediately.',
      'advanced.schedule': 'Daily check',
      'advanced.schedule.enabled': 'Enable daily check',
      'advanced.schedule.time': 'Time',
      'advanced.schedule.timezone': 'Time zone',
      'advanced.llm': 'Summary model',
      'advanced.llm.desc': 'Leave blank to use the current default model. Failures fall back to rule summaries.',
      'advanced.llm.provider': 'Provider',
      'advanced.llm.model': 'Model',
      'advanced.fetch': 'Fetch',
      'advanced.fetch.maxAgeDays': 'Only push builds from the last N days',
      'advanced.fetch.timeout': 'Request timeout (ms)',
      'advanced.retention': 'Retention',
      'advanced.retention.items': 'Max releases',
      'advanced.retention.runs': 'Max runs',
      'advanced.retention.days': 'Days',
      'advanced.debug': 'Debug',
      'advanced.debug.latest': 'Push latest release',
      'advanced.debug.latest.desc': 'Fetch the newest release from each source, summarize every one, and send them to DingTalk now (real messages will be sent).',
      'advanced.clear': 'Clear history',
      'advanced.clear.desc': 'Delete all release and run history. Sources and settings are untouched.',
      'advanced.clearConfirm': 'Clear all release and run history?',
      'advanced.statePath': 'State is stored by the plugin in the DSH config directory, never in the session transcript.',
      'advanced.saved': 'Saved',
    }

    const css = `
.dsh-cl-root{display:flex;flex-direction:column;gap:18px;padding:22px 24px 40px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;max-width:1080px;margin:0 auto}
.dsh-cl-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px}
.dsh-cl-title{font-size:19px;font-weight:600;letter-spacing:-.01em}
.dsh-cl-sub{color:var(--dsw-alias-label-secondary);margin-top:4px;max-width:640px}
.dsh-cl-actions{display:flex;align-items:center;gap:8px;flex-shrink:0}
.dsh-cl-btn{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:6px 12px;font-size:12.5px;cursor:pointer;display:inline-flex;align-items:center;gap:6px;transition:background .15s,border-color .15s}
.dsh-cl-btn:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover)}
.dsh-cl-btn:disabled{opacity:.5;cursor:not-allowed}
.dsh-cl-btn.primary{background:var(--dsw-alias-button-primary-fill);border-color:transparent;color:var(--dsw-alias-label-primary-foreground);font-weight:500}
.dsh-cl-btn.primary:hover:not(:disabled){background:var(--dsw-alias-button-primary-hover)}
.dsh-cl-btn.danger{color:var(--dsw-alias-state-error-primary)}
.dsh-cl-btn.danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover-danger)}
.dsh-cl-btn.ghost{border-color:transparent;background:transparent}
.dsh-cl-tabs{display:flex;gap:2px;border-bottom:1px solid var(--dsw-alias-border-l1);margin-top:-4px}
.dsh-cl-tab{appearance:none;background:none;border:0;border-bottom:2px solid transparent;padding:9px 12px;color:var(--dsw-alias-label-secondary);font-size:13px;cursor:pointer;display:flex;align-items:center;gap:6px;margin-bottom:-1px}
.dsh-cl-tab:hover{color:var(--dsw-alias-label-primary)}
.dsh-cl-tab.active{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:500}
.dsh-cl-count{font-size:11px;color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2);border-radius:9px;padding:1px 6px}
.dsh-cl-body{display:flex;flex-direction:column;gap:16px}
.dsh-cl-card{border:1px solid var(--dsw-alias-settings-card-stroke,var(--dsw-alias-border-l1));border-radius:12px;background:var(--dsw-alias-settings-card-fill,var(--dsw-alias-bg-layer-1));overflow:hidden}
.dsh-cl-card-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-cl-card-title{font-size:13.5px;font-weight:600}
.dsh-cl-card-sub{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:2px}
.dsh-cl-card-body{padding:14px 16px}
.dsh-cl-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dsh-cl-stat{border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:12px 14px;background:var(--dsw-alias-bg-layer-1);display:flex;flex-direction:column;gap:4px;min-width:0}
.dsh-cl-stat-label{font-size:11.5px;color:var(--dsw-alias-label-tertiary);display:flex;align-items:center;gap:5px}
.dsh-cl-stat-value{font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-cl-stat-hint{font-size:11.5px;color:var(--dsw-alias-label-tertiary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.dsh-cl-badge{display:inline-flex;align-items:center;gap:4px;border-radius:999px;padding:1px 8px;font-size:11px;line-height:18px;white-space:nowrap;border:1px solid transparent}
.dsh-cl-badge.ok{color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2)}
.dsh-cl-badge.warn{color:var(--dsw-alias-state-warn-label);background:var(--dsw-alias-bg-layer-2)}
.dsh-cl-badge.err{color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2)}
.dsh-cl-badge.muted{color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-2)}
.dsh-cl-badge.info{color:var(--dsw-alias-link);background:var(--dsw-alias-bg-layer-2)}
.dsh-cl-steps{display:flex;flex-direction:column;gap:2px}
.dsh-cl-step{display:flex;align-items:center;gap:12px;padding:11px 2px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-cl-step:last-child{border-bottom:0}
.dsh-cl-step-icon{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;border:1px solid var(--dsw-alias-border-l2);color:var(--dsw-alias-label-tertiary);background:var(--dsw-alias-bg-layer-1)}
.dsh-cl-step-icon.done{border-color:transparent;background:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary-foreground)}
.dsh-cl-step-main{flex:1;min-width:0}
.dsh-cl-step-title{font-weight:500}
.dsh-cl-step-desc{font-size:12px;color:var(--dsw-alias-label-tertiary);margin-top:1px}
.dsh-cl-row{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-cl-row:last-child{border-bottom:0}
.dsh-cl-row-main{flex:1;min-width:0}
.dsh-cl-row-title{font-weight:500;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dsh-cl-row-sub{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-top:2px;overflow-wrap:anywhere}
.dsh-cl-input,.dsh-cl-select{appearance:none;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);border-radius:7px;padding:5px 8px;font-size:12.5px;min-width:0;font-family:inherit}
.dsh-cl-input:focus,.dsh-cl-select:focus{outline:none;border-color:var(--dsw-alias-brand-primary)}
.dsh-cl-input::placeholder{color:var(--dsw-alias-label-tertiary)}
.dsh-cl-field{display:flex;align-items:flex-start;gap:14px;padding:9px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dsh-cl-field:last-child{border-bottom:0}
.dsh-cl-field-label{width:160px;flex-shrink:0;padding-top:4px;font-size:12.5px}
.dsh-cl-field-hint{font-size:11.5px;color:var(--dsw-alias-label-tertiary);margin-top:2px}
.dsh-cl-field-control{flex:1;min-width:0;display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.dsh-cl-switch{position:relative;width:32px;height:18px;border-radius:9px;background:var(--dsw-alias-bg-layer-4);border:0;cursor:pointer;flex-shrink:0;transition:background .15s}
.dsh-cl-switch.on{background:var(--dsw-alias-brand-primary)}
.dsh-cl-switch::after{content:'';position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground);transition:transform .15s}
.dsh-cl-switch.on::after{transform:translateX(14px)}
.dsh-cl-switch:disabled{opacity:.5;cursor:not-allowed}
.dsh-cl-empty{display:flex;flex-direction:column;align-items:center;text-align:center;padding:30px 16px;color:var(--dsw-alias-label-tertiary);gap:4px}
.dsh-cl-empty-title{color:var(--dsw-alias-label-primary);font-weight:500;margin-top:6px}
.dsh-cl-link{color:var(--dsw-alias-link);text-decoration:none;font-size:12px}
.dsh-cl-link:hover{text-decoration:underline}
.dsh-cl-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11.5px}
.dsh-cl-notice{display:flex;gap:8px;align-items:flex-start;border-radius:8px;padding:9px 12px;font-size:12px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary)}
.dsh-cl-notice.err{color:var(--dsw-alias-state-error-primary)}
.dsh-cl-notice.ok{color:var(--dsw-alias-state-success-primary)}
.dsh-cl-filters{display:flex;gap:6px;flex-wrap:wrap}
.dsh-cl-chip{border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary);font-size:11.5px;border-radius:999px;padding:2px 10px;cursor:pointer}
.dsh-cl-chip.active{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}
.dsh-cl-split{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.dsh-cl-details summary{cursor:pointer;color:var(--dsw-alias-label-secondary);font-size:12px}
.dsh-cl-pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--dsw-alias-bg-layer-2);border-radius:8px;padding:10px;font-size:12px;margin:8px 0 0;max-height:260px;overflow:auto}
.dsh-cl-footer{display:flex;justify-content:flex-end;gap:8px}
@media (max-width:860px){.dsh-cl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dsh-cl-split{grid-template-columns:1fr}.dsh-cl-field{flex-direction:column;gap:4px}.dsh-cl-field-label{width:auto}}
`
    function Icon({ name, size = 15 }) {
      const paths = {
        bell: [h('path', { key: 'a', d: 'M6 8a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6' }), h('path', { key: 'b', d: 'M9.5 18a2.5 2.5 0 0 0 5 0' })],
        refresh: [h('path', { key: 'a', d: 'M20 11a8 8 0 1 0-2.3 5.7' }), h('path', { key: 'b', d: 'M20 5v6h-6' })],
        check: [h('path', { key: 'a', d: 'M5 12.5 10 17.5 19 7.5' })],
        plus: [h('path', { key: 'a', d: 'M12 5v14M5 12h14' })],
        send: [h('path', { key: 'a', d: 'M4 12 20 5l-4 15-5-6-7-2Z' })],
        clock: [h('circle', { key: 'a', cx: 12, cy: 12, r: 8 }), h('path', { key: 'b', d: 'M12 8v4.5l3 2' })],
        external: [h('path', { key: 'a', d: 'M14 5h5v5M19 5l-8 8' }), h('path', { key: 'b', d: 'M18 14v4a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h4' })],
        info: [h('circle', { key: 'a', cx: 12, cy: 12, r: 8 }), h('path', { key: 'b', d: 'M12 11v5M12 8h.01' })],
        trash: [h('path', { key: 'a', d: 'M4 7h16M9 7V5h6v2M7 7l1 12h8l1-12' })],
        code: [h('path', { key: 'a', d: 'm8 7-4 5 4 5M16 7l4 5-4 5' })],
        rss: [h('path', { key: 'a', d: 'M5 5a14 14 0 0 1 14 14M5 12a7 7 0 0 1 7 7' }), h('circle', { key: 'b', cx: 5.5, cy: 18.5, r: 1.5 })],
      }
      return h('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true }, paths[name] ?? paths.info)
    }

    function format(iso, timezone) {
      if (!iso) return '—'
      const date = new Date(iso)
      if (Number.isNaN(date.getTime())) return '—'
      try {
        return new Intl.DateTimeFormat('zh-CN', {
          timeZone: timezone || 'Asia/Shanghai',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        }).format(date).replace(/\//g, '-')
      } catch {
        return date.toISOString().slice(5, 16).replace('T', ' ')
      }
    }

    function relative(iso) {
      if (!iso) return ''
      const delta = Date.now() - Date.parse(iso)
      if (!Number.isFinite(delta)) return ''
      if (delta < 60000) return '刚刚'
      if (delta < 3600000) return `${Math.floor(delta / 60000)} 分钟前`
      if (delta < 86400000) return `${Math.floor(delta / 3600000)} 小时前`
      return `${Math.floor(delta / 86400000)} 天前`
    }

    function api(path, body) {
      return fetch(`/changelog-push${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: body === undefined ? {} : { 'content-type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
      }).then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.message || `HTTP ${response.status}`)
        return data
      })
    }

    function Switch({ checked, onChange, disabled }) {
      return h('button', {
        type: 'button',
        className: `dsh-cl-switch${checked ? ' on' : ''}`,
        role: 'switch',
        'aria-checked': checked,
        disabled,
        onClick: () => onChange(!checked),
      })
    }

    function Field({ label, hint, children }) {
      return h('div', { className: 'dsh-cl-field' }, h('div', { className: 'dsh-cl-field-label' }, label, hint ? h('div', { className: 'dsh-cl-field-hint' }, hint) : null), h('div', { className: 'dsh-cl-field-control' }, children))
    }

    function Card({ title, sub, extra, children, bodyClass }) {
      return h('section', { className: 'dsh-cl-card' },
        title ? h('div', { className: 'dsh-cl-card-head' }, h('div', null, h('div', { className: 'dsh-cl-card-title' }, title), sub ? h('div', { className: 'dsh-cl-card-sub' }, sub) : null), extra ?? null) : null,
        h('div', { className: bodyClass ?? 'dsh-cl-card-body' }, children))
    }

    function Empty({ title, desc, action }) {
      return h('div', { className: 'dsh-cl-empty' }, h(Icon, { name: 'bell', size: 22 }), h('div', { className: 'dsh-cl-empty-title' }, title), desc ? h('div', null, desc) : null, action ? h('div', { style: { marginTop: 10 } }, action) : null)
    }

    function Badge({ tone = 'muted', children }) {
      return h('span', { className: `dsh-cl-badge ${tone}` }, children)
    }

    function useConfig(ctx) {
      const [snap, setSnap] = useState(null)
      const formRef = useRef(null)
      useEffect(() => {
        let off = null
        const timer = setInterval(() => {
          if (!formRef.current) {
            try {
              if (ctx.configForms) {
                for (const candidate of FORM_IDS) {
                  try {
                    const form = ctx.configForms.get(candidate)
                    if (form) { formRef.current = form; break }
                  } catch {}
                }
              }
            } catch {}
          }
          if (formRef.current && !off) {
            const update = () => setSnap(formRef.current.getSnapshot())
            off = formRef.current.subscribe(update)
            update()
            clearInterval(timer)
          }
        }, 400)
        return () => {
          clearInterval(timer)
          if (typeof off === 'function') off()
        }
      }, [ctx])
      const mutate = useCallback(ops => {
        const form = formRef.current
        if (!form) throw new Error('配置尚未就绪')
        return form.mutate(ops)
      }, [])
      return { snap, mutate, value: snap?.value ?? null, writable: snap?.writable !== false }
    }

    function useStatus() {
      const [state, setState] = useState(null)
      const [error, setError] = useState(null)
      const load = useCallback(async () => {
        try {
          setState(await api('/state'))
          setError(null)
        } catch (err) {
          setError(err.message)
        }
      }, [])
      useEffect(() => {
        load()
        const timer = setInterval(load, 5000)
        return () => clearInterval(timer)
      }, [load])
      return { state, error, reload: load }
    }

    function OverviewTab({ t, state, loading, onRun, onJump }) {
      const sources = state?.sources ?? []
      const channel = state?.channel
      const checks = sources.map(source => source.lastCheckAt).filter(Boolean).sort()
      const lastCheck = checks.at(-1) ?? null
      const steps = [
        { key: 'sources', done: sources.some(source => source.enabled), tab: 'sources' },
        { key: 'channel', done: Boolean(channel?.configured && channel?.enabled), tab: 'channel' },
        { key: 'schedule', done: Boolean(state?.schedule?.enabled), tab: 'advanced' },
      ]
      const lastRun = state?.runs?.[0]
      const recent = state?.items?.slice(0, 3) ?? []
      const pushed24h = (state?.items ?? []).filter(item => item.pushedAt && Date.now() - Date.parse(item.pushedAt) < 86400000).length
      const stat = (icon, label, value, hint) => h('div', { className: 'dsh-cl-stat' },
        h('div', { className: 'dsh-cl-stat-label' }, h(Icon, { name: icon, size: 13 }), label),
        h('div', { className: 'dsh-cl-stat-value' }, value),
        h('div', { className: 'dsh-cl-stat-hint' }, hint))
      const stepRow = step => h('div', { key: step.key, className: 'dsh-cl-step' },
        h('div', { className: `dsh-cl-step-icon${step.done ? ' done' : ''}` }, h(Icon, { name: step.done ? 'check' : 'info', size: 13 })),
        h('div', { className: 'dsh-cl-step-main' },
          h('div', { className: 'dsh-cl-step-title' }, t(`overview.step.${step.key}`)),
          h('div', { className: 'dsh-cl-step-desc' }, t(`overview.step.${step.key}.desc`))),
        step.done
          ? h(Badge, { tone: 'ok' }, t('overview.step.done'))
          : h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => onJump(step.tab) }, t('common.add')))
      const recentRow = item => h('div', { key: item.id, className: 'dsh-cl-row' },
        h('div', { className: 'dsh-cl-row-main' },
          h('div', { className: 'dsh-cl-row-title' }, item.title, item.degraded ? h(Badge, { tone: 'warn' }, '规则摘要') : null),
          h('div', { className: 'dsh-cl-row-sub' }, `${item.sourceName} · ${format(item.pushedAt || item.publishedAt, state?.schedule?.timezone)}`)),
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
          h(Badge, { tone: item.status === 'pushed' ? 'ok' : item.status === 'failed' ? 'err' : 'muted' }, t(`runs.status.${item.status}`)),
          item.link ? h('a', { className: 'dsh-cl-link', href: item.link, target: '_blank', rel: 'noreferrer' }, t('runs.open')) : null))
      return h('div', { className: 'dsh-cl-body' },
        h('div', { className: 'dsh-cl-grid' },
          stat('clock', t('overview.nextRun'), state?.nextRunAt ? format(state.nextRunAt, state?.schedule?.timezone) : t('overview.noNext'), state?.schedule?.time ?? ''),
          stat('refresh', t('overview.lastCheck'), lastCheck ? format(lastCheck, state?.schedule?.timezone) : t('overview.noCheck'), relative(lastCheck)),
          stat('send', t('overview.channel'), channel?.configured ? '钉钉' : t('channel.notConfigured'), lastRun ? `${t('overview.lastResult')}：${t(`runs.${lastRun.status}`)}` : (channel?.enabled ? t('common.on') : t('common.off'))),
          stat('bell', '24h', String(pushed24h), `共 ${state?.items?.length ?? 0} 条记录`)),
        state && !channel?.configured ? h('div', { className: 'dsh-cl-notice' },
          h(Icon, { name: 'info', size: 14 }),
          h('span', null, t('overview.configureHint')),
          h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => onJump('channel') }, t('overview.configureNow'))) : null,
        state?.channel?.lastError ? h('div', { className: 'dsh-cl-notice err' }, h(Icon, { name: 'info', size: 14 }), h('span', null, state.channel.lastError)) : null,
        h('div', { className: 'dsh-cl-split' },
          h(Card, { title: t('overview.steps') },
            h('div', { className: 'dsh-cl-steps' }, steps.map(stepRow))),
          h(Card, {
            title: t('overview.recent'),
            extra: h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => onJump('runs') }, '全部'),
          },
          recent.length === 0
            ? h(Empty, { title: t('runs.items.empty'), desc: t('runs.empty.desc') })
            : h('div', null, recent.map(recentRow)))),
        h('div', { className: 'dsh-cl-footer' },
          h('button', { type: 'button', className: 'dsh-cl-btn primary', onClick: onRun, disabled: loading || state?.running || !channel?.configured },
            h(Icon, { name: 'refresh' }),
            state?.running ? t('overview.running') : t('overview.runNow'))))
    }

    function SourcesTab({ t, value, mutate, writable, state }) {
      const sources = value?.sources ?? []
      const [results, setResults] = useState({})
      const [busy, setBusy] = useState({})
      const status = new Map((state?.sources ?? []).map(source => [source.id, source]))
      const commit = next => mutate([{ op: 'set', path: ['sources'], value: next }])
      const patch = (id, changes) => commit(sources.map(source => (source.id === id ? { ...source, ...changes } : source)))
      const addSource = type => {
        const stamp = Date.now().toString(36)
        const base = {
          id: `custom-${stamp}`,
          name: type === 'apple-release' ? '自定义 Apple 源' : type === 'web' ? '网页监控' : '自定义 RSS',
          type,
          track: type === 'apple-release' ? 'ios' : '',
          url: type === 'apple-release' ? 'https://developer.apple.com/news/releases/rss/releases.rss' : '',
          keywords: '',
          maxAgeDays: 30,
          enabled: true,
          includeBeta: false,
        }
        commit([...sources, base])
      }
      const typeKey = source => source.type === 'apple-release' ? 'apple' : source.type === 'web' ? 'page' : 'rss'
      const check = async source => {
        setBusy(prev => ({ ...prev, [source.id]: true }))
        try {
          const result = await api('/source/check', { source })
          setResults(prev => ({ ...prev, [source.id]: { ok: true, text: t('sources.checkOk', { count: result.count ?? 0 }) } }))
        } catch (error) {
          setResults(prev => ({ ...prev, [source.id]: { ok: false, text: t('sources.validateFail', { message: error.message }) } }))
        } finally {
          setBusy(prev => ({ ...prev, [source.id]: false }))
        }
      }
      const validate = async source => {
        setBusy(prev => ({ ...prev, [source.id]: true }))
        try {
          const result = await api('/source/validate', { source })
          setResults(prev => ({ ...prev, [source.id]: result.count ? { ok: true, text: t('sources.validateOk', { count: result.count, latest: result.latest ?? '' }) } : { ok: true, text: t('sources.validateEmpty') } }))
        } catch (error) {
          setResults(prev => ({ ...prev, [source.id]: { ok: false, text: t('sources.validateFail', { message: error.message }) } }))
        } finally {
          setBusy(prev => ({ ...prev, [source.id]: false }))
        }
      }
      return h('div', { className: 'dsh-cl-body' },
        h(Card, {
          title: t('sources.title'),
          sub: t('sources.desc'),
          extra: h('div', { style: { display: 'flex', gap: 6 } },
            h('button', { type: 'button', className: 'dsh-cl-btn', onClick: () => addSource('apple-release'), disabled: !writable }, h(Icon, { name: 'plus' }), t('sources.addApple')),
            h('button', { type: 'button', className: 'dsh-cl-btn', onClick: () => addSource('rss'), disabled: !writable }, t('sources.addRss')),
            h('button', { type: 'button', className: 'dsh-cl-btn', onClick: () => addSource('web'), disabled: !writable }, t('sources.addPage'))),
        },
        sources.length === 0 ? h(Empty, { title: t('sources.empty'), desc: t('sources.empty.desc'), action: h('button', { type: 'button', className: 'dsh-cl-btn primary', onClick: () => addSource('apple-release') }, t('sources.addApple')) })
          : sources.map(source => {
            const live = status.get(source.id)
            const result = results[source.id]
            return h('div', { key: source.id, className: 'dsh-cl-row', style: { alignItems: 'flex-start' } },
              h('div', { style: { paddingTop: 2 } }, h(Switch, { checked: source.enabled !== false, onChange: next => patch(source.id, { enabled: next }), disabled: !writable })),
              h('div', { className: 'dsh-cl-row-main' },
                h('div', { className: 'dsh-cl-row-title' },
                  h('input', { className: 'dsh-cl-input', defaultValue: source.name, onBlur: event => patch(source.id, { name: event.target.value.trim() || source.name }), style: { width: 180 }, disabled: !writable }),
                  h('span', { className: 'dsh-cl-badge muted' }, t(`sources.mode.${typeKey(source)}`)),
                  source.type === 'apple-release' ? h('select', { className: 'dsh-cl-select', value: source.track || 'ios', onChange: event => patch(source.id, { track: event.target.value }), disabled: !writable },
                    h('option', { value: 'xcode' }, t('sources.track.xcode')),
                    h('option', { value: 'ios' }, t('sources.track.ios'))) : null,
                  source.type === 'apple-release' ? h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } },
                    h(Switch, { checked: source.includeBeta === true, onChange: next => patch(source.id, { includeBeta: next }), disabled: !writable }), t('sources.includeBeta')) : null),
                h('div', { className: 'dsh-cl-row-sub' },
                  h('input', { className: 'dsh-cl-input dsh-cl-mono', defaultValue: source.url, onBlur: event => patch(source.id, { url: event.target.value.trim() }), style: { width: '100%', marginTop: 4 }, disabled: !writable, placeholder: 'https://…' })),
                h('div', { className: 'dsh-cl-row-sub', style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5, alignItems: 'center' } },
                  h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } },
                    t('sources.keywords'),
                    h('input', { className: 'dsh-cl-input', defaultValue: source.keywords ?? '', onBlur: event => patch(source.id, { keywords: event.target.value.trim() }), style: { width: 170 }, disabled: !writable, placeholder: 'beta, -RC' })),
                  h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } },
                    t('sources.maxAgeDays'),
                    h('input', { type: 'number', min: 1, max: 365, className: 'dsh-cl-input', defaultValue: source.maxAgeDays ?? 30, onBlur: event => patch(source.id, { maxAgeDays: Number(event.target.value) || 30 }), style: { width: 70 }, disabled: !writable }))),
                h('div', { className: 'dsh-cl-row-sub', style: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 5 } },
                  h('span', null, `${t('sources.lastCheck')}：${live?.lastCheckAt ? format(live.lastCheckAt, state?.schedule?.timezone) : t('sources.never')}`),
                  h('span', null, `${t('sources.latest')}：${live?.latest?.title ?? live?.latest?.version ?? '—'}`),
                  live?.error ? h('span', { style: { color: 'var(--dsw-alias-state-error-primary)' } }, live.error) : null),
                result ? h('div', { className: 'dsh-cl-notice' + (result.ok ? ' ok' : ' err'), style: { marginTop: 6 } }, result.text) : null),
              h('div', { style: { display: 'flex', gap: 6, paddingTop: 2 } },
                h('button', { type: 'button', className: 'dsh-cl-btn', onClick: () => check(source), disabled: busy[source.id] }, busy[source.id] ? '…' : t('sources.checkNow')),
                h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => validate(source), disabled: busy[source.id] }, t('common.validate')),
                h('button', { type: 'button', className: 'dsh-cl-btn ghost danger', onClick: () => commit(sources.filter(item => item.id !== source.id)), disabled: !writable }, t('common.remove'))))
          })))
    }

    function ChannelTab({ t, value, mutate, writable, state, onSecret }) {
      const channel = value?.channel ?? {}
      const status = state?.channel ?? {}
      const [editing, setEditing] = useState(false)
      const [webhook, setWebhook] = useState('')
      const [message, setMessage] = useState(null)
      const [busy, setBusy] = useState(false)
      const [localConfigured, setLocalConfigured] = useState(null)
      const [localMasked, setLocalMasked] = useState(null)
      const configured = localConfigured ?? status.configured
      const masked = localMasked ?? status.masked
      const patch = changes => mutate([{ op: 'set', path: ['channel'], value: { ...channel, ...changes } }])
      const save = async () => {
        setBusy(true)
        setMessage(null)
        try {
          const result = await onSecret(webhook)
          setLocalConfigured(true)
          setLocalMasked(result?.masked ?? null)
          setMessage({ ok: true, text: t('channel.secretSaved') })
          setEditing(false)
          setWebhook('')
        } catch (error) {
          setMessage({ ok: false, text: error.message })
        } finally {
          setBusy(false)
        }
      }
      const test = async () => {
        setBusy(true)
        setMessage(null)
        try {
          const result = await api('/test', {})
          setMessage({ ok: true, text: t('channel.testOk', { chunks: result.chunks ?? 1 }) })
        } catch (error) {
          setMessage({ ok: false, text: t('channel.testFail', { message: error.message }) })
        } finally {
          setBusy(false)
        }
      }
      return h('div', { className: 'dsh-cl-body' },
        h(Card, { title: t('channel.title'), sub: t('channel.desc') },
          h(Field, { label: t('channel.enabled') }, h(Switch, { checked: channel.enabled !== false, onChange: next => patch({ enabled: next }), disabled: !writable }), h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 12 } }, channel.enabled !== false ? t('common.on') : t('common.off'))),
          h(Field, { label: t('channel.keyword'), hint: t('channel.keyword.desc') }, h('input', { className: 'dsh-cl-input', defaultValue: channel.keyword ?? 'iOS', onBlur: event => patch({ keyword: event.target.value.trim() || 'iOS' }), disabled: !writable, style: { width: 160 } })),
          h(Field, { label: t('channel.webhook'), hint: t('channel.webhook.desc') },
            h('div', { style: { display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', width: '100%' } },
              editing
                ? h('input', { className: 'dsh-cl-input dsh-cl-mono', value: webhook, onChange: event => setWebhook(event.target.value), placeholder: 'https://oapi.dingtalk.com/robot/send?access_token=…', style: { flex: 1, minWidth: 280 } })
                : h('span', { className: 'dsh-cl-mono', style: { flex: 1, color: configured ? 'var(--dsw-alias-label-primary)' : 'var(--dsw-alias-label-tertiary)' } }, configured ? masked : t('channel.notConfigured')),
              editing ? h('button', { type: 'button', className: 'dsh-cl-btn primary', onClick: save, disabled: busy || !writable }, t('common.save')) : h('button', { type: 'button', className: 'dsh-cl-btn', onClick: () => setEditing(true), disabled: !writable }, configured ? t('common.replace') : t('channel.config')),
              editing ? h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => { setEditing(false); setWebhook('') } }, t('common.cancel')) : null)),
          h(Field, { label: t('common.test') }, h('button', { type: 'button', className: 'dsh-cl-btn', onClick: test, disabled: busy || !configured }, h(Icon, { name: 'send' }), t('common.test')), h('span', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' } }, t('channel.onlyDingtalk'))),
          message ? h('div', { className: 'dsh-cl-notice' + (message.ok ? ' ok' : ' err') }, message.text) : null,
          status.lastError ? h('div', { className: 'dsh-cl-notice err', style: { marginTop: 8 } }, h(Icon, { name: 'info' }), h('span', null, `${t('channel.lastError')}：${status.lastError}`)) : null,
          h('div', { className: 'dsh-cl-notice', style: { marginTop: 8 } }, h(Icon, { name: 'info' }), h('span', null, `${t('channel.lastSuccess')}：${status.lastSuccessAt ? format(status.lastSuccessAt, state?.schedule?.timezone) : '—'}`))),
        configured ? h(Card, { title: t('channel.clear') },
          h('div', { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' } },
            h('div', { style: { fontSize: 12, color: 'var(--dsw-alias-label-tertiary)', maxWidth: 620 } }, t('channel.clearDesc')),
            h('button', { type: 'button', className: 'dsh-cl-btn danger', onClick: async () => {
              if (typeof window !== 'undefined' && !window.confirm(t('channel.clearConfirm'))) return
              try { await api('/clear-token', {}); setLocalConfigured(false); setLocalMasked(''); setMessage({ ok: true, text: t('channel.clearOk') }) } catch (error) { setMessage({ ok: false, text: error.message }) }
            }, disabled: !writable }, t('channel.clear')))) : null)
    }

    function RunsTab({ t, state, timezone }) {
      const [filter, setFilter] = useState('all')
      const [expanded, setExpanded] = useState(null)
      const runs = (state?.runs ?? []).filter(run => filter === 'all' || run.status === filter)
      const items = state?.items ?? []
      const triggerLabel = trigger => t(`runs.trigger.${trigger}`)
      const statusTone = status => (status === 'success' ? 'ok' : status === 'failed' ? 'err' : 'muted')
      const itemTone = status => (status === 'pushed' ? 'ok' : status === 'failed' ? 'warn' : status === 'dead' ? 'err' : 'muted')
      const filters = ['all', 'success', 'failed', 'baseline'].map(key => h('button', {
        key,
        type: 'button',
        className: `dsh-cl-chip${filter === key ? ' active' : ''}`,
        onClick: () => setFilter(key),
      }, t(`runs.${key}`)))
      const runRow = run => h('div', { key: run.id, className: 'dsh-cl-row', style: { alignItems: 'flex-start' } },
        h('div', { className: 'dsh-cl-row-main' },
          h('div', { className: 'dsh-cl-row-title' },
            h(Badge, { tone: statusTone(run.status) }, run.status === 'success' ? t('runs.success') : run.status === 'failed' ? t('runs.failed') : run.status === 'baseline' ? t('runs.baseline') : run.status),
            triggerLabel(run.trigger),
            h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } }, format(run.startedAt, timezone))),
          h('div', { className: 'dsh-cl-row-sub' },
            t('runs.fetched', { n: run.fetched ?? 0 }), ' · ',
            t('runs.fresh', { n: run.fresh ?? 0 }), ' · ',
            t('runs.pushed', { n: run.pushed ?? 0 }),
            run.failed ? ` · ${t('runs.failedCount', { n: run.failed })}` : '',
            run.degraded ? ` · ${t('runs.degraded', { n: run.degraded })}` : ''),
          run.errors?.length ? h('details', { className: 'dsh-cl-details', style: { marginTop: 4 } },
            h('summary', null, `${run.errors.length} 条错误`),
            h('pre', { className: 'dsh-cl-pre' }, run.errors.map(error => `${error.source}: ${error.message}`).join('\n'))) : null,
          expanded === run.id && run.errors?.length ? h('pre', { className: 'dsh-cl-pre' }, run.errors.map(error => `${error.source}: ${error.message}`).join('\n')) : null),
        h('button', { type: 'button', className: 'dsh-cl-btn ghost', onClick: () => setExpanded(expanded === run.id ? null : run.id) }, expanded === run.id ? '收起' : '详情'))
      const itemRow = item => h('div', { key: item.id, className: 'dsh-cl-row', style: { alignItems: 'flex-start' } },
        h('div', { className: 'dsh-cl-row-main' },
          h('div', { className: 'dsh-cl-row-title' }, item.title, item.degraded ? h(Badge, { tone: 'warn' }, '规则摘要') : null, item.orphan ? h(Badge, { tone: 'muted' }, '源已删除') : null),
          h('div', { className: 'dsh-cl-row-sub' }, `${item.sourceName} · ${format(item.publishedAt, timezone)}${item.pushedAt ? ` · 推送于 ${format(item.pushedAt, timezone)}` : ''}${item.error ? ` · ${item.error}` : ''}`),
          h('details', { className: 'dsh-cl-details' },
            h('summary', null, t('runs.open')),
            item.impact ? h('p', null, item.impact) : null,
            (item.highlights ?? []).length ? h('ul', null, item.highlights.map((highlight, index) => h('li', { key: index }, highlight))) : null)),
        h('div', { style: { display: 'flex', gap: 8, alignItems: 'center' } },
          h(Badge, { tone: itemTone(item.status) }, t(`runs.status.${item.status}`)),
          item.link ? h('a', { className: 'dsh-cl-link', href: item.link, target: '_blank', rel: 'noreferrer' }, t('runs.open')) : null))
      return h('div', { className: 'dsh-cl-body' },
        h(Card, { title: t('runs.title'), sub: t('runs.desc'), extra: h('div', { className: 'dsh-cl-filters' }, filters) },
          runs.length === 0
            ? h(Empty, { title: t('runs.empty'), desc: t('runs.empty.desc') })
            : h('div', null, runs.map(runRow))),
        h(Card, { title: t('runs.items'), extra: h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } }, `${items.length} 条`) },
          items.length === 0
            ? h(Empty, { title: t('runs.items.empty'), desc: t('runs.empty.desc') })
            : h('div', null, items.map(itemRow))))
    }

    function AdvancedTab({ t, value, mutate, writable, state }) {
      const schedule = value?.schedule ?? {}
      const llm = value?.llm ?? {}
      const fetchCfg = value?.fetch ?? {}
      const retention = value?.retention ?? {}
      const [message, setMessage] = useState(null)
      const [busy, setBusy] = useState(false)
      const patch = (path, next) => mutate([{ op: 'set', path, value: next }])
      const clear = async () => {
        if (!window.confirm(t('advanced.clearConfirm'))) return
        try {
          await api('/clear', {})
          setMessage({ ok: true, text: t('advanced.saved') })
        } catch (error) {
          setMessage({ ok: false, text: error.message })
        }
      }
      return h('div', { className: 'dsh-cl-body' },
        h(Card, { title: t('advanced.schedule') },
          h(Field, { label: t('advanced.schedule.enabled') }, h(Switch, { checked: schedule.enabled !== false, onChange: next => patch(['schedule'], { ...schedule, enabled: next }), disabled: !writable })),
          h(Field, { label: t('advanced.schedule.time') }, h('input', { type: 'time', className: 'dsh-cl-input', defaultValue: schedule.time ?? '09:00', onBlur: event => event.target.value && patch(['schedule'], { ...schedule, time: event.target.value }), disabled: !writable })),
          h(Field, { label: t('advanced.schedule.timezone') }, h('input', { className: 'dsh-cl-input', defaultValue: schedule.timezone ?? 'Asia/Shanghai', onBlur: event => patch(['schedule'], { ...schedule, timezone: event.target.value.trim() || 'Asia/Shanghai' }), disabled: !writable, style: { width: 220 } }), h('span', { style: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 11.5 } }, state?.nextRunAt ? `下次 ${format(state.nextRunAt, schedule.timezone)}` : ''))),
        h(Card, { title: t('advanced.llm'), sub: t('advanced.llm.desc') },
          h(Field, { label: t('advanced.llm.provider') }, h('input', { className: 'dsh-cl-input dsh-cl-mono', defaultValue: llm.provider ?? '', placeholder: '留空使用默认', onBlur: event => patch(['llm'], { ...llm, provider: event.target.value.trim() }), disabled: !writable, style: { width: 260 } })),
          h(Field, { label: t('advanced.llm.model') }, h('input', { className: 'dsh-cl-input dsh-cl-mono', defaultValue: llm.model ?? '', placeholder: '留空使用默认', onBlur: event => patch(['llm'], { ...llm, model: event.target.value.trim() }), disabled: !writable, style: { width: 260 } }))),
        h(Card, { title: t('advanced.fetch') },
          h(Field, { label: t('advanced.fetch.maxAgeDays') }, h('input', { type: 'number', min: 1, max: 365, className: 'dsh-cl-input', defaultValue: fetchCfg.maxAgeDays ?? 30, onBlur: event => patch(['fetch'], { ...fetchCfg, maxAgeDays: Number(event.target.value) || 30 }), disabled: !writable, style: { width: 100 } })),
          h(Field, { label: t('advanced.fetch.timeout') }, h('input', { type: 'number', min: 1000, max: 120000, step: 1000, className: 'dsh-cl-input', defaultValue: fetchCfg.timeoutMs ?? 20000, onBlur: event => patch(['fetch'], { ...fetchCfg, timeoutMs: Number(event.target.value) || 20000 }), disabled: !writable, style: { width: 120 } }))),
        h(Card, { title: t('advanced.retention') },
          h(Field, { label: t('advanced.retention.items') }, h('input', { type: 'number', min: 20, max: 2000, className: 'dsh-cl-input', defaultValue: retention.items ?? 200, onBlur: event => patch(['retention'], { ...retention, items: Number(event.target.value) || 200 }), disabled: !writable, style: { width: 110 } })),
          h(Field, { label: t('advanced.retention.runs') }, h('input', { type: 'number', min: 10, max: 1000, className: 'dsh-cl-input', defaultValue: retention.runs ?? 100, onBlur: event => patch(['retention'], { ...retention, runs: Number(event.target.value) || 100 }), disabled: !writable, style: { width: 110 } })),
          h(Field, { label: t('advanced.retention.days') }, h('input', { type: 'number', min: 7, max: 3650, className: 'dsh-cl-input', defaultValue: retention.days ?? 90, onBlur: event => patch(['retention'], { ...retention, days: Number(event.target.value) || 90 }), disabled: !writable, style: { width: 110 } }))),
        h(Card, { title: t('advanced.debug') },
          h(Field, { label: t('advanced.debug.latest'), hint: t('advanced.debug.latest.desc') }, h('button', { type: 'button', className: 'dsh-cl-btn', onClick: async () => {
            setBusy(true)
            setMessage(null)
            try {
              const result = await api('/debug/latest', {})
              const latest = result.latest ?? []
              const titles = latest.map(item => `${item.source} ${item.title}`).join('、')
              if (result.ok) {
                setMessage({ ok: true, text: `已推送 ${result.pushed} 条最新更新：${titles}` })
              } else if (result.pushed > 0) {
                setMessage({ ok: false, text: `部分成功：已推送 ${result.pushed} 条（${titles}）；其余失败：${result.message ?? ''}` })
              } else {
                setMessage({ ok: false, text: result.message ?? '推送失败' })
              }
            } catch (error) {
              setMessage({ ok: false, text: error.message })
            } finally {
              setBusy(false)
            }
          }, disabled: busy || !writable || !state?.channel?.configured }, busy ? '…' : t('advanced.debug.latest'), h(Icon, { name: 'send' }))),
          h(Field, { label: t('advanced.clear'), hint: t('advanced.clear.desc') }, h('button', { type: 'button', className: 'dsh-cl-btn danger', onClick: clear, disabled: !writable }, h(Icon, { name: 'trash' }), t('advanced.clear')))),
        message ? h('div', { className: 'dsh-cl-notice' + (message.ok ? ' ok' : ' err') }, message.text) : null,
        h('div', { style: { fontSize: 11.5, color: 'var(--dsw-alias-label-tertiary)' } }, t('advanced.statePath')))
    }

    function Panel({ ctx, t }) {
      const [tab, setTab] = useState('overview')
      const { state, error, reload } = useStatus()
      const { value, mutate, writable } = useConfig(ctx)
      const [busy, setBusy] = useState(false)
      const [flash, setFlash] = useState(null)
      const timezone = state?.schedule?.timezone ?? value?.schedule?.timezone ?? 'Asia/Shanghai'
      const run = async () => {
        setBusy(true)
        setFlash(null)
        try {
          const result = await api('/run', {})
          setFlash({ ok: true, text: result.started === false ? '正在运行，请稍后刷新。' : '已开始检查，进度会自动刷新。' })
          setTimeout(reload, 1500)
        } catch (err) {
          setFlash({ ok: false, text: err.message })
        } finally {
          setBusy(false)
        }
      }
      const onSecret = webhook => api('/secret', { webhook })
      const enabled = state?.config?.enabled !== false && value?.enabled !== false
      const body = !value
        ? h('div', { className: 'dsh-cl-empty' }, t('common.loading'))
        : tab === 'overview'
          ? h(OverviewTab, { t, state, loading: busy, onRun: run, onJump: setTab })
          : tab === 'sources'
            ? h(SourcesTab, { t, value, mutate, writable, state })
            : tab === 'channel'
              ? h(ChannelTab, { t, value, mutate, writable, state, onSecret })
              : tab === 'runs'
                ? h(RunsTab, { t, state, timezone })
                : h(AdvancedTab, { t, value, mutate, writable, state })
      return h('div', { className: 'dsh-cl-root' },
        h('div', { className: 'dsh-cl-head' },
          h('div', null,
            h('div', { className: 'dsh-cl-title' }, t('overview.title')),
            h('div', { className: 'dsh-cl-sub' }, t('overview.subtitle'))),
          h('div', { className: 'dsh-cl-actions' },
            h(Badge, { tone: enabled ? 'ok' : 'muted' }, enabled ? t('common.on') : t('common.off')),
            h('button', { type: 'button', className: 'dsh-cl-btn primary', onClick: run, disabled: busy || state?.running || !state?.channel?.configured }, h(Icon, { name: 'refresh' }), state?.running || busy ? t('overview.running') : t('overview.runNow')))),
        error ? h('div', { className: 'dsh-cl-notice err' }, h(Icon, { name: 'info' }), h('span', null, error)) : null,
        flash ? h('div', { className: 'dsh-cl-notice' + (flash.ok ? ' ok' : ' err') }, flash.text) : null,
        h('div', { className: 'dsh-cl-tabs' }, TABS.map(key => h('button', { key, type: 'button', className: `dsh-cl-tab${tab === key ? ' active' : ''}`, onClick: () => setTab(key) },
          t(`tabs.${key}`),
          key === 'sources' ? h('span', { className: 'dsh-cl-count' }, value?.sources?.length ?? 0) : null,
          key === 'runs' ? h('span', { className: 'dsh-cl-count' }, state?.runs?.length ?? 0) : null))),
        body)
    }

    let style = null
    return {
      inject: ['slots', 'locale', 'configForms'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'changelog-push: dictionaries')
        const tr = ctx.locale.bind(NS)
        const t = (key, params) => {
          let text = tr(key) ?? key
          if (params) for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
          return text
        }
        const bind = key => (params) => {
          let text = tr(key) ?? key
          if (params) for (const [name, value] of Object.entries(params)) text = text.replaceAll(`{${name}}`, String(value))
          return text
        }
        ctx.effect(() => {
          if (typeof document === 'undefined') return
          style = document.createElement('style')
          style.setAttribute('data-dsh-changelog-push', '')
          style.textContent = css
          document.head.appendChild(style)
          return () => style?.remove()
        }, 'changelog-push: styles')
        ctx.slots.inject('settings.section', () => ctx.slots.register({
          name: 'settings.section',
          id: 'changelog-push',
          order: 40,
          label: bind('nav'),
          locale: NS,
        }, () => h(Panel, { ctx, t })))
        ctx.slots.inject('settings.section.icon', () => ctx.slots.register({
          name: 'settings.section.icon',
          id: 'changelog-push',
        }, props => h('svg', {
          width: props?.size ?? 18,
          height: props?.size ?? 18,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true',
        },
        h('path', { d: 'M18 8a6 6 0 0 0-12 0c0 7-3 8-3 8h18s-3-1-3-8' }),
        h('path', { d: 'M13.7 21a2 2 0 0 1-3.4 0' }))))
      },
    }
  },
})