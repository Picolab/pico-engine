# Layered rulesets demo

A base ruleset whose rule does one thing and raises an event, and two add-on rulesets that change what the pico does without editing it.

- Overview: [`docs/cookbook/layered_rulesets/README.md`](../../docs/cookbook/layered_rulesets/README.md) (on the docs site: https://docs.picolabs.io/#/cookbook/layered_rulesets/)
- Instructions: [`docs/cookbook/layered_rulesets/instructions.md`](../../docs/cookbook/layered_rulesets/instructions.md)

| File | Shows |
|------|-------|
| `com.example.invitations.krl` | The base: accepts full invitation URLs, records connections, raises `invite:connection_made`, and has the Invitations page, which adds the layers one at a time |
| `com.example.invitations.short_links.krl` | An add-on that selects the same event with a different URL pattern and raises it again with the full invitation |
| `com.example.invitations.welcome.krl` | An add-on that reacts to `invite:connection_made` |
| `com.example.invitations.bootstrap.krl` | Installs only the base on a new pico; the **Try It!** tab runs it |
