# Configuration and secrets demo

How to get a secret into a ruleset without putting it in the code, how to keep a ruleset idle until it has one, and where secrets stay visible.

- Overview: [`docs/cookbook/secrets/README.md`](../../docs/cookbook/secrets/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/secrets/)
- Instructions: [`docs/cookbook/secrets/instructions.md`](../../docs/cookbook/secrets/instructions.md)

| File | Shows |
|------|-------|
| `com.example.notifier.krl` | Gets its webhook URL in an event, posts only once it has one (`where ent:webhook_url`), and never shares the URL. Has the Notifier page |
| `com.example.hook_service.krl` | Stands in for an outside webhook service; gets its token from install configuration (`meta:rulesetConfig`) and refuses posts without it. Has the Inbox page |
| `com.example.notifier.bootstrap.krl` | Sets up both, sends one message before configuring the notifier and one after; the **Try It!** tab runs it |
