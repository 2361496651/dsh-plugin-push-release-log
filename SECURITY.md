# Security

## Reporting

Please report vulnerabilities privately through GitHub Security Advisories:

https://github.com/2361496651/dsh-plugin-push-release-log/security/advisories/new

Do not open a public issue containing a DingTalk webhook, an access token, or
a state file.

## Webhook credential

A DingTalk custom-robot webhook grants permission to post messages to a group.
It is stored in the DSH credential store under `dsh-changelog-push/dingtalk`
and is never written into the plugin source, logs, or the session transcript.
If a webhook leaks, reset the robot token in the DingTalk console and enter the
new address on the plugin's 「推送通道」 page.

The plugin ships no built-in webhook; every installation must configure its
own.
