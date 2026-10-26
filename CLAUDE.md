# pico-engine — guide for coding agents

This is the **pico engine**: an open-source Node.js runtime for **picos** (persistent compute objects) — small, always-on actors with persistent identity, state, and availability that talk by events and queries. Behavior is written in **KRL** (the pico rules language), compiled to JavaScript. Read `docs/design/pico-overview.md` first if the model isn't in your head yet.

Lerna mono-repo. Current release line: 1.7.x (identity portability). Next: 1.8 (`docs/release/1.8.md`).

## The one rule that governs all design: strict layering

```
engine    ← primitives only (channels, events, persistence, DIDs, schema). Knows nothing about Manifold.
wrangler  ← the "pico OS": wraps primitives in KRL functions/events (children, channels, relationships).
manifold  ← framework for pico meshes; supplies the vocabulary (owner, thing, community). Separate repo.
apps      ← sensor-network, Fuse, … built on Manifold.
```

Engine and wrangler stay **domain-agnostic**. If a change needs the words "owner", "thing", or "community" in engine or wrangler code, it belongs in `manifold-api` instead. Picos are **actors**, not "agents"; say pico/actor in docs and code.

## Layout

| Path | What |
|------|------|
| `packages/pico-engine` | The npm package people install; HTTP server, CLI, auth/OAuth, identity, UI host |
| `packages/pico-engine-core` | Executes compiled KRL; event lifecycle |
| `packages/krl-parser` → `krl-compiler` → `krl-generator` | KRL → AST → JS; AST → KRL |
| `packages/krl-stdlib` | KRL standard library |
| `packages/pico-engine-ui` | Default web UI (`npm run build` at repo root includes its bundle in `public/`) |
| `packages/pico-engine/public/docs/` | **User-facing docs** (pico, pico-engine, KRL manual, discovery). `docs/MOVED` points here |
| `docs/design/` | Design docs (schemas, identity, move, relationships, harness) |
| `docs/release/` | Per-release plans (`1.8.md`) and notes (`1.7.0.md`) |
| `MEMORY.md` | Long-running working log: roadmap, decisions, gotchas. Source of truth for *why*; skim the TOC |
| `test-rulesets/`, `demos/` | KRL used by tests and demos |

Sibling repos (same org, not in this tree): `manifold-api` (Manifold KRL), `sensor-network`, `MCPforEXP`, `pico-framework` (lifecycle/channels/LevelDB; engine depends on `^0.8.2` for 1.8 policy ceiling).

## Commands

```sh
npm run setup          # NOT `npm i` — lerna links packages
npm start              # dev engine with watch (cd packages/pico-engine && npm start)
npm run build          # all packages with a build script (parser, stdlib, core, engine, UI → public/)
npm test               # lerna run test (ava); Node 20/22 — Node 24 breaks krl-parser timeouts
cd packages/pico-engine && npm run test:layer2-policy   # focused suites: see package.json scripts
cd packages/pico-engine-ui && npm run dev              # Vite dev server (optional; root build updates public/ bundle)
echo 'ruleset x { … }' | npx krl-compiler               # KRL → JS on stdout (no diagnostics mode yet; 1.8 adds `krl check`)
```

Env vars: `PORT`, `PICO_ENGINE_HOME`, `PICO_ENGINE_BASE_URL` and others — `pico-engine --help`, full registry in `MEMORY.md` ("Engine environment variables").

## KRL conventions (engine behavior — these are not style preferences)

Rule shape:
```krl
rule name {
  select when domain type
  pre { x = event:attr("x") }            // NAME DECLARATIONS, not assignment; no re-binding
  if cond then every { action1(); action2() }   // ONE action block; no action-level else
  fired { ent:things{[id, "name"]} := x; raise domain event "next" attributes {...} }
  else  { error warn <<skipped: …>> }    // optional; runs when the rule did NOT fire
}
```

| Do | Don't |
|----|-------|
| One action block, `every { }` for several actions | Two `if … then` blocks, or `else` on the action |
| One postlude: `always` / `fired` / `notfired`, optional `else`, optional `finally` | `fired { } notfired { }` as two blocks |
| `event:send(...)` in the action block | `event:send` inside `fired` |
| Composite path for nested entity keys: `ent:m{[a, "b"]} := v` | Chained paths `ent:m{a}{"b"} := v` (parse error) |
| Path assignment `ent:m{k} := v` | `ent:m := ent:m.put([k], v)` |
| Direct path reads in `pre`: `n = ent:p{rcn}{"name"} \|\| event:attr("name")` | Refining a binding by re-declaring it |
| Chain multi-step setup with **events + callbacks** (`callback_eci`, `rcn`) | `schedule … at time:add(...)` to wait for work to finish |
| Wrangler for lifecycle: channels, children, rulesets, `wrangler:picoQuery` | `ctx:*` from application or demo rulesets (engine escape hatch) |
| `raise wrangler event "child_deletion_request" attributes {"eci": picoId}` | legacy `wrangler child_deletion` with `{"id": …}` (never runs) |
| `wrangler:picoQuery` (works over family channels) | `wrangler:skyQuery` (deprecated; HTTP blocked on family channels) |

Also: `if X then noop(); fired { … }` runs `fired` when X is **true**. Rules in one ruleset selecting the same event run in **rule-name lexicographic order**; across rulesets the order is undefined. A stray character after `meta { }` silently prevents registration — if a ruleset never seems to run, check it actually loaded.

Terminology: **relationships** (1.6.2+; "subscriptions" in older code and docs). Channels have **ECIs** and **policies**; policy is the authorization gate. Every pico has a `discovery` channel.

## Working in this repo

- Design before code for anything touching identity, policy, schema, or the Sky API: add or update a doc in `docs/design/` and link it from `MEMORY.md`.
- Keep `MEMORY.md` current when you learn an engine behavior the hard way; it is what future sessions read.
- Don't commit or publish; leave that to the maintainer. `npm run publish` builds and publishes every package — never run it.
- Tests are ava, serial for engine suites (`--serial`, 2–3 min timeouts). Add a focused `test:*` script when you add a suite.
- UI changes need `npm run build` (repo root) or `npm run dev` in `pico-engine-ui` or they won't appear in `public/`.
