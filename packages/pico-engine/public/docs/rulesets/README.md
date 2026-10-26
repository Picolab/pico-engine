# Bundled rulesets (generated docs)

Markdown here is copied from `tools/krl-schema/samples/` when you run **`npm run generate:llms`** at the repo root. Sources are the annotated KRL under `packages/pico-engine/krl/`. To regenerate samples from KRL: **`npm run check:krl-schema-samples`** (CI) or `node tools/krl-schema/cli.js -f markdown path/to/ruleset.krl`.

## OS layer (every pico)

Installed on the root pico and on each new child automatically.

| Ruleset | Doc |
|---------|-----|
| **io.picolabs.wrangler** | [wrangler](io.picolabs.wrangler.md) — **pico OS**; the supported API for mesh lifecycle (not raw `ctx:*`). If an operation is missing here, treat it as out-of-bounds or [file an engine issue](https://github.com/Picolab/pico-engine/issues). |
| **io.picolabs.pds** | [pds](io.picolabs.pds.md) — profile and shared namespaced data |
| **io.picolabs.subscription** | [subscription](io.picolabs.subscription.md) — relationships to other picos |
| **io.picolabs.pico-engine-ui** | [pico-engine-ui](io.picolabs.pico-engine-ui.md) — developer UI channel |

## Optional (install when needed)

Shipped under `/krl/` on your engine; install from the Rulesets tab or `wrangler:install_ruleset_request` with the ruleset URL.

| Ruleset | Doc | Notes |
|---------|-----|--------|
| **io.picolabs.oauth** | [oauth](io.picolabs.oauth.md) | **Root pico only** — optional mesh-wide OAuth on `/sky/*` |
| **io.picolabs.portable_subtree** | [portable_subtree](io.picolabs.portable_subtree.md) | Portable export/import of subtrees (identity-aware move) |

Application rulesets (Manifold, your apps) are not bundled; install their KRL URLs like any other ruleset.
