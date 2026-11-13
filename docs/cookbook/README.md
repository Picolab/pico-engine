# Cookbook

Worked examples you can install and run. Each recipe has an overview and step-by-step instructions. The KRL lives in the pico-engine repository under [`demos/`](https://github.com/Picolab/pico-engine/tree/master/demos), and the engine ships a copy.

The quickest start is the **Try It!** tab on the root pico in the developer UI (engine config `show_tryit_menu` can show it on every pico, or hide it). It lists the demos that have a bootstrap ruleset. Open one and **Run** it: the tab creates a child pico and installs that ruleset, which sets up the whole demo. The same window shows each ruleset's code and its path on disk. Edit a file, **Flush**, and watch the demo change. Agents can do the same with the dev MCP server (`pico-engine mcp --stdio`): `list_try_it_demos`, `run_try_it_demo`, and `try_it_status`. It also serves these pages as `pico://docs/cookbook/...` resources.

The demos are meant for an engine without [OAuth](/pico-views?id=oauth-protected-meshes), such as one on your own machine. On a mesh with OAuth turned on they still install, but their pages and `curl` examples call the pico without an access token, so they may not load their data. The Try It! tab says so when that's the case.

| Recipe | What it shows | KRL |
|--------|---------------|-----|
| [Echo](/cookbook/echo/) | The hello world of events: a rule answers an event with a directive, from a page or from `curl` | [`demos/echo/`](https://github.com/Picolab/pico-engine/tree/master/demos/echo) |
| [Score tracker](/cookbook/score_tracker/) | A contest pico with a leaderboard, and an app channel whose policy lets contestants play without changing the pico | [`demos/score_tracker/`](https://github.com/Picolab/pico-engine/tree/master/demos/score_tracker) |
| [Pico views](/cookbook/xmlui/) | XMLUI pages served from a pico: queries, events, app channels, detail routes, components (the Thermostat demo), and a view over another pico's data | [`demos/xmlui/`](https://github.com/Picolab/pico-engine/tree/master/demos/xmlui) |
| [Two picos talking](/cookbook/two_picos/) | Two picos form a relationship, and one queries the other over it | [`demos/two_picos/`](https://github.com/Picolab/pico-engine/tree/master/demos/two_picos) |
| [Child pico tasks](/cookbook/child_tasks/) | Running each task in a new child pico that reports back and deletes itself, so the parent never waits | [`demos/child_tasks/`](https://github.com/Picolab/pico-engine/tree/master/demos/child_tasks) |
| [Guard rules](/cookbook/guard_rules/) | Making a request idempotent with a guard rule, and refusing work with a gate rule and `last` until it can be done | [`demos/guard_rules/`](https://github.com/Picolab/pico-engine/tree/master/demos/guard_rules) |
| [Layered rulesets](/cookbook/layered_rulesets/) | Rules that each do one thing and raise an event, and add-on rulesets that change what a pico does without editing the base | [`demos/layered_rulesets/`](https://github.com/Picolab/pico-engine/tree/master/demos/layered_rulesets) |
| [Collection](/cookbook/collection/) | A pico that keeps a collection of other picos over relationships, accepts members by role, and reports on all of them | [`demos/collection/`](https://github.com/Picolab/pico-engine/tree/master/demos/collection) |
| [Configuration and secrets](/cookbook/secrets/) | Getting a secret into a ruleset with install configuration or an event, keeping a ruleset idle until it has one, and where secrets stay visible | [`demos/secrets/`](https://github.com/Picolab/pico-engine/tree/master/demos/secrets) |
| [Bootstrap and channels](/cookbook/bootstrap/) | A bootstrap ruleset installing an app in dependency order with configuration, and an app that creates or updates its own channel on install, with a policy built from its schema | [`demos/bootstrap/`](https://github.com/Picolab/pico-engine/tree/master/demos/bootstrap) |
| [KBlog](/cookbook/kblog/) | A blog written in KRL: four rulesets that work together through an event hierarchy, with a reader channel and an author channel | [`demos/kblog/`](https://github.com/Picolab/pico-engine/tree/master/demos/kblog) |
| [Moving picos](/cookbook/moving_picos/) | Exporting a pico and its children from one engine and importing them on another, keeping its did:webvh identity and relationships | [`demos/moving_picos/`](https://github.com/Picolab/pico-engine/tree/master/demos/moving_picos) |
