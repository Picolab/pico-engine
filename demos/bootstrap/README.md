# Bootstrap and channels demo

A bootstrap ruleset installs a small app in dependency order and configures it, and the app creates its own channel on install, with a policy built from its schema.

- Overview: [`docs/cookbook/bootstrap/README.md`](../../docs/cookbook/bootstrap/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/bootstrap/)
- Instructions: [`docs/cookbook/bootstrap/instructions.md`](../../docs/cookbook/bootstrap/instructions.md)

| File | Shows |
|------|-------|
| `com.example.visitors.bootstrap.krl` | The bootstrap: installs each ruleset when the one it needs is installed, and gives the app its install configuration |
| `com.example.visitors.format.krl` | A module the app uses, so it is installed first |
| `com.example.visitors.krl` | The app: reads its configuration, and creates or updates its channel on install. Its page shows the pico's rulesets and channels |
