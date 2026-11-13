# Guard rules demo

Ask for something five times and get it once. A guard rule makes a request idempotent, and a gate rule with `last` refuses work until it can be done.

- Overview: [`docs/cookbook/guard_rules/README.md`](../../docs/cookbook/guard_rules/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/guard_rules/)
- Instructions: [`docs/cookbook/guard_rules/instructions.md`](../../docs/cookbook/guard_rules/instructions.md)

| File | Shows |
|------|-------|
| `com.example.archive.krl` | A guard rule and the rule it starts, a gate rule with `last`, and the Archive page |
| `com.example.archive_store.krl` | Installed on the Archive child pico; keeps the notes |
| `com.example.archive.bootstrap.krl` | Sets up the demo on a new pico, asks for the archive five times, and tries a note too early; the **Try It!** tab runs it |
