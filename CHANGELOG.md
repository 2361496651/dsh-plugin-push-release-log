# Changelog

## 0.5.0

### Breaking

- Removed the built-in DingTalk webhook. First-time users must configure their
  own webhook on 「推送通道」 before scheduled or manual pushes can run.
- Scheduling, manual runs, tests, and “推送最新更新” are gated on a configured
  webhook; `/reset-token` now clears the credential instead of restoring one.

### Changed

- Added package repository/engines metadata for registry installs.
- Added first-run onboarding copy, “清除 Webhook”, and clearer error messages.
- Added LICENSE, SECURITY, THIRD_PARTY_NOTICES, CHANGELOG, and offline tests.

## 0.4.0

- Per-source “推送最新更新”: sends the newest release from every enabled
  source, not just one.
- Summary output aligned with the `{title,version,build,date,highlights,impact,link}`
  contract; Markdown heading uses the configured keyword.
- Source types renamed to `apple-release|rss|web`, with `keywords` and
  per-source `maxAgeDays`.
- Display name changed to 「Release通知」 / “Release Notifications”.
