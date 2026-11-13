# Bootstrap and channels

Two habits make a KRL app easy to install:

- **A bootstrap ruleset.** An app of several rulesets has an install order: a ruleset that uses another as a module can't be installed before it. A bootstrap ruleset knows the order. Installed on a pico, it installs the others one at a time, each when the `wrangler:ruleset_installed` event for the one before arrives, and gives each its configuration. Every Try It! demo starts this way.
- **A channel made on install.** An app ruleset creates the channel its users need from a rule that selects its own `wrangler:ruleset_installed`. That rule updates the channel if it already exists, so reinstalling doesn't pile up channels or change the channel id people are using.

This demo is a small visitor log. The bootstrap installs a formatting module and then the app, with a greeting in its install configuration. The app creates its channel with a policy built from its own schema. The schema lists only documented rules and functions, so the channel allows exactly the ruleset's documented API.

To run it, follow the [instructions](/cookbook/bootstrap/instructions).

## The rulesets

| Ruleset | File | What it shows |
|---------|------|---------------|
| Bootstrap | [`com.example.visitors.bootstrap.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/bootstrap/com.example.visitors.bootstrap.krl) | Installing in dependency order with `install_ruleset_request` and `absoluteURL: meta:rulesetURI`, and passing `config` |
| Formatting | [`com.example.visitors.format.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/bootstrap/com.example.visitors.format.krl) | A module the app needs, so it goes first |
| Visitor log | [`com.example.visitors.krl`](https://github.com/Picolab/pico-engine/blob/master/demos/bootstrap/com.example.visitors.krl) | `meta:rulesetConfig`; a channel created on install, with a policy built from `wrangler:rulesetSchema`; updated in place with `wrangler:updateChannel`; and duplicates cleaned up with `wrangler:deleteChannel` |

## What you need

- A running pico engine (1.9.4 or later for the page, which uses the shared `PicoTheme` component).
- `io.picolabs.xmlui` on the pico for the page. The bootstrap installs it.
