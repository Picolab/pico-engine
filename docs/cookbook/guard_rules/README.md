# Guard rules

Events can arrive more than once: a person clicks twice, a script retries, two picos ask for the same thing. A rule that reacts to an event is **idempotent** when running it again has no further effect. A **guard rule** is the usual way to get there. It responds to the event, tests a condition, and only then raises the event that a second rule listens for to do the real work.

This demo's pico needs exactly one child pico, its Archive. Ask for the archive as often as you like: the guard lets one request through.

It also shows a **gate rule**: a rule placed before others that selects the same event, and stops them with `last` when they can't run yet. Here, notes go into the archive, so the gate refuses them until the archive exists. This is the shape of the "authorize, then use" pattern, where the gate starts an authorization instead of refusing.

To run it, follow the [instructions](/cookbook/guard_rules/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Archive keeper | [`com.example.archive.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/guard_rules/com.example.archive.krl) | The guard rule `archive_needed` and the rule it raises an event for, the gate rule `require_archive` with `last`, and an Archive `@view` that counts requests |
| Archive store | [`com.example.archive_store.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/guard_rules/com.example.archive_store.krl) | Installed on the Archive child; keeps the notes and shares them |
| Bootstrap | [`com.example.archive.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/guard_rules/com.example.archive.bootstrap.krl) | Sets up the demo, asks for the archive five times, and adds a note before and after the archive exists. The developer UI's **Try It!** tab runs it |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
