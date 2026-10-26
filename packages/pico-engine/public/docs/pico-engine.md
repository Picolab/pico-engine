# pico-engine — operator guide

This document is the **canonical operator reference** for running and configuring the pico engine. It ships with the npm package under `public/docs/` and is indexed in [`llms.txt`](llms.txt).

**New to picos?** Read [pico-overview.md](pico-overview.md) — what picos are, why they exist, and the event-query model (`docs/design/pico-overview.md` in the repo).

## Documentation source of truth

| Location | Role |
|----------|------|
| **This file** (`packages/pico-engine/public/docs/`) | Authoritative for install, config, security flags, and deployment. Versioned with the engine; what `npx pico-engine` and agents read. |
| **README** in the same package | Quick start, CLI overview, OAuth, containers — links here for config details. |
| **`MEMORY.md`** (engine repo) | Maintainer log: rationale, gotchas, env registry — not end-user docs. |
| **Confluence / wiki** | Optional mirror for Picolab internal use. **Do not treat Confluence as primary:** edit this file in git first, then update Confluence to match (or replace Confluence pages with a short blurb + link to [GitHub `public/docs/pico-engine.md`](https://github.com/Picolab/pico-engine/blob/main/packages/pico-engine/public/docs/pico-engine.md) on `main` or the release tag). |

If Confluence and this guide disagree, **trust the repo at the release you run** (`pico-engine --version`).

---

## Quick start

```sh
npm install -g pico-engine
pico-engine
```

Open `http://localhost:3000`. First visit registers a passkey and creates the root pico.

Copy the example config and adjust paths:

```sh
mkdir -p ~/.config/pico-engine
cp "$(npm root -g)/pico-engine/config.example.json ~/.config/pico-engine/config.json
# or from a git checkout: packages/pico-engine/config.example.json
pico-engine
```

Show which config file the process will use:

```sh
pico-engine config path
```

Alternate config file (one file **per engine process**):

```sh
pico-engine -c /path/to/engine-a.json
# or
PICO_ENGINE_CONFIG=/path/to/engine-a.json pico-engine
```

---

## Config file vs data directory

| | Config | Data (`home`) |
|---|--------|----------------|
| **Default path** | `$XDG_CONFIG_HOME/pico-engine/config.json` or `~/.config/pico-engine/config.json` | `~/.pico-engine/` |
| **Override** | `PICO_ENGINE_CONFIG`, `pico-engine -c` | config JSON `home`, or `PICO_ENGINE_HOME` |
| **Contains** | Port, public URL, WebAuthn, security flags, policy ceiling | LevelDB mesh (`db/`), ruleset cache, logs |
| **Delete to reset** | No — keeps operator settings | Yes — **fresh mesh** (picos, passkeys in DB gone) |

**Precedence:** defaults → **environment variables** → **config file** → programmatic overrides (tests). If both env and file set `port`, **the file wins**.

In **`NODE_ENV=test`**, the config file is ignored unless `PICO_ENGINE_CONFIG` is set (isolated tests).

---

## Config JSON fields

Example templates: [`config.example.json`](../../config.example.json), [`config.policy-ceiling.example.json`](../../config.policy-ceiling.example.json), [`config.instances.example/`](../../config.instances.example/).

| Field | Type | Description |
|-------|------|-------------|
| `home` | string | Data directory (supports `~/…`). Default `~/.pico-engine`. |
| `port` | number | HTTP listen port. Default `3000`. |
| `baseUrl` | string | Public origin (no trailing slash): WebAuthn, did:webvh, links. Default `http://localhost:3000`. |
| `allowSelfSignup` | boolean | Open registration after bootstrap. Default `false` (invite-only). |
| `allowLocalhostChannelBypass` | boolean | Allow `/c/*` from localhost without passkey (dev MCP, KRL HTTP loops). Default `true`. Set `false` in production behind TLS. |
| `wildcardSkyRequireBearer` | boolean | Require OAuth bearer on `/sky/*` for channels with unrestricted `*.*` allow rules. Default `false` (1.8 opt-in hardening). |
| `logToStdout` | boolean | Log to stdout instead of a file. Use on Fargate (set `logToStdout: true` in config). |
| `logFile` | string | Absolute log path when `logToStdout` is false. Values `stdout`, `-`, or `0` force stdout. |
| `defaultRootPolicyCeiling` | object | Max channel policy for new root picos (`eventPolicy` / `queryPolicy`). See policy example file. |
| `globalEventDeny` | array | Extra deny rules applied on **every** ECI before channel policy (e.g. block `engine:secret_ping`). |
| `globalQueryDeny` | array | Same for queries. |
| `webauthn.rpId` | string | WebAuthn RP ID (usually hostname without port). |
| `webauthn.origin` | string | Must match browser URL (scheme + host + port). |
| `webauthn.rpName` | string | Display name in passkey UI. |

Legacy top-level `rpID`, `rpName`, `origin` are still accepted if `webauthn` is omitted.

---

## Environment variables

These four env overrides cover config path, data dir, port, and public URL; everything else (WebAuthn, signup, localhost bypass, policy ceiling, logging, …) belongs in the **config file**. Maintainer registry of all env keys: engine repo `MEMORY.md` (Engine environment variables).

| Variable | Purpose |
|----------|---------|
| `PICO_ENGINE_CONFIG` | Path to config JSON |
| `PICO_ENGINE_HOME` | Data directory |
| `PORT` | Listen port (if not in file) |
| `PICO_ENGINE_BASE_URL` | Public URL |

---

## Multiple engines on one host

Give each process its own config with distinct **`home`**, **`port`**, **`baseUrl`**, and matching **`webauthn.origin`**.

```sh
pico-engine -c ~/.config/pico-engine/engine-a.json   # terminal 1
pico-engine -c ~/.config/pico-engine/engine-b.json   # terminal 2
```

Cursor MCP: separate `mcpServers` entries, each with its own `PICO_ENGINE_CONFIG` pointing at the engine you want.

Docker: mount **one config file per service** and **one data volume per service** — never share a `home` volume between two running tasks.

---

## Docker and AWS (summary)

Mesh state lives under `home`:

| Subdir | Purpose |
|--------|---------|
| `db/` | Picos, channels, auth, identity |
| `rulesets-db/` | Cached ruleset metadata (rebuildable) |
| `rulesets/` | Compiled ruleset JS |

- One writer per data directory (LevelDB).
- **Fargate:** mount EFS at e.g. `/var/pico-image`, set `home` accordingly, `baseUrl` to public **HTTPS**, `logToStdout: true` in config.
- Set `allowLocalhostChannelBypass` to **false** on public deployments.

Detailed checklists: package **README** § Containers / Fargate.

---

## Wrangler and bundled rulesets

**Wrangler** (`io.picolabs.wrangler`) is the pico **OS** — the **preferred layer** for operating on picos. It wraps engine primitives (persistence, channels, ruleset registry, policy) in stable **`wrangler:*` events and shared queries**: children, channels, ruleset install/flush, relationships, discovery, and schema (`picoSchema`, `rulesetSchema`, `channelSchema`). It is installed on every pico with **PDS**, **subscription**, and **pico-engine-ui**.

**Use wrangler, not engine escape hatches.** Application rulesets, integrators, and harnesses should raise **`wrangler` events** and call **`wrangler:*` functions** (or the UI / `/sky/*` / mesh MCP surfaces that send those operations). The engine also exposes lower-level **`ctx:*`** actions and owner-only tooling; those exist for wrangler and the platform rulesets to call, not as the everyday API.

If something you need **cannot be done through wrangler**:

1. **Red flag — you may be out of bounds.** Lifecycle and mesh structure belong in wrangler (or in a domain framework such as Manifold built *on* wrangler), not in ad hoc `ctx:` calls or custom engine hooks from app KRL.
2. **Possible bug or missing OS feature.** If the gap is real OS work (a new child type, channel operation, install path, …), [open an issue](https://github.com/Picolab/pico-engine/issues) on **pico-engine** and describe the wrangler-shaped event or query you expected — not a request to bless more direct `ctx` use.

**How to interact:** developer UI (Rulesets, Channels, About), **`wrangler:*` on `/sky/event`** where channel policy allows, **`wrangler:picoQuery`** on family channels, and the generated [wrangler API doc](rulesets/io.picolabs.wrangler.md).

**Optional** rulesets ship in the same `krl/` directory but are not auto-installed on every pico:

| Ruleset | When to install |
|---------|-----------------|
| [io.picolabs.oauth](rulesets/io.picolabs.oauth.md) | **Root pico only** — require OAuth bearer on most `/sky/*` traffic (mesh lock) |
| [io.picolabs.portable_subtree](rulesets/io.picolabs.portable_subtree.md) | Portable subtree export/import (e.g. identity-aware move) |

Install optional rulesets from the **Rulesets** tab (URL like `https://your-engine/krl/io.picolabs.oauth.krl`) or send `wrangler:install_ruleset_request`.

**Generated API docs** (events, queries, `@example` from KRL annotations) live under **[rulesets/](rulesets/README.md)** — notably [wrangler](rulesets/io.picolabs.wrangler.md). Refresh in a git checkout: `npm run check:krl-schema-samples` then **`npm run generate:llms`** (copies samples into `public/docs/rulesets/`).

---

## Manifold (mesh framework)

Above wrangler sits **[Manifold](https://github.com/Picolab/manifold-api)** — KRL rulesets that define a **personal mesh**: owner, Manifold hub, **things** (devices, vehicles, objects), **communities** (groups of things), tag and skills registries, and centralized notifications. Manifold uses **wrangler** for all lifecycle (`manifold:create_thing` delegates to `wrangler:new_child_request`, and so on); app code should call **`manifold:*` and domain events**, not `ctx:`.

Manifold is **not** one product. It is the shared platform for many meshes, for example:

- **Fuse-like connected car** networks (owners, vehicles, shared access)
- **Household / personal IoT** with things and communities
- **SafeAndMine**, **Home Assistant**, and other integrators shipped from manifold-api
- **Sensor or industrial monitoring** (separate repos install bootstrap rulesets on the Manifold pico)

Install **`io.picolabs.manifold_bootstrap`** on the engine root to stand up the graph; domain repos add their own rulesets on the Manifold child.

**Documentation (separate repo):**

- Overview: [docs/Manifold.md](https://github.com/Picolab/manifold-api/blob/main/docs/Manifold.md)
- Agent index: [docs/llms.txt](https://github.com/Picolab/manifold-api/blob/main/docs/llms.txt)
- Generated ruleset APIs: [docs/rulesets/](https://github.com/Picolab/manifold-api/tree/main/docs/rulesets) (e.g. [manifold_pico](https://github.com/Picolab/manifold-api/blob/main/docs/rulesets/io.picolabs.manifold_pico.md))

---

## Security and policy (1.8)

- **Deny overrides permit** on channel policies (pico-framework 0.8.2+).
- **Policy ceiling:** parent can cap child channel policies; optional `defaultRootPolicyCeiling` on the root.
- **Wildcard channels:** opt-in `wildcardSkyRequireBearer` so wide `/sky/*` access requires a validated bearer.
- **Channel policy audit:** [channel-policy-audit-2026-10.md](https://github.com/Picolab/pico-engine/blob/main/docs/design/channel-policy-audit-2026-10.md) (repo; summary in [1.8.0 release notes](https://github.com/Picolab/pico-engine/blob/main/docs/release/1.8.0.md)).

Owner UI uses the **UI channel** (passkey). Automation uses **OAuth** on `/sky/*` and narrow channels — see README § OAuth.

---

## HTTP surfaces

| Path | Auth | Use |
|------|------|-----|
| `/` | Browser | Developer UI |
| `/c/*` | Passkey session (localhost bypass optional) | Developer UI (browser). **Discouraged** for automation and third-party apps — use `/sky/*` or mesh MCP instead. |
| `/sky/*` | Channel policy ± OAuth bearer | Events, queries, integrators |
| `/mcp/:eci` | OAuth bearer | Mesh MCP (Streamable HTTP) |
| `/auth/*` | WebAuthn flows | Registration, login |

Local dev MCP: `pico-engine mcp --stdio` — not exposed on hosted load balancers; see [1.8 plan § MCP](https://github.com/Picolab/pico-engine/blob/main/docs/release/1.8.md) (deployment table).

---

## Agents and KRL authoring

- **`krl-check`** on ruleset files before install.
- **Dev MCP** (stdio): validate, install, flush, raise, query — same mesh as the UI when `PICO_ENGINE_HOME` / config match.
- **Docs for LLMs:** [`llms.txt`](llms.txt), [`llms-full.txt`](llms-full.txt), [`openapi.yaml`](openapi.yaml). Regenerate after doc edits: `npm run generate:llms` at repo root.

---

## Troubleshooting

| Symptom | Check |
|---------|--------|
| Passkey fails | `baseUrl` / `webauthn.origin` match browser URL; HTTPS in production |
| “Not allowed by channel policy” | Channel event/query policy; ceiling; global deny lists |
| Install/flush errors in UI | Event-wait returns `events` with `ruleset_install_failed` / `ruleset_flush_failed` and line/col in `errors` |
| LevelDB LOCK on startup | Unclean shutdown; stop all tasks using the volume; engine may remove stale LOCK |
| Empty mesh after deploy | Fargate EBS vs EFS — use persistent volume for `home` |

Logs: default `$home/pico-engine.log`, or stdout when configured. Engine logs **`txnError`** at error level for ruleset compile failures (includes line/col when available).

---

## Related docs

- [Pico overview / philosophy](pico-overview.md) · [Bundled rulesets (wrangler, PDS, …)](rulesets/README.md) · [Manifold mesh framework](https://github.com/Picolab/manifold-api/blob/main/docs/llms.txt) · [KRL manual](krl/README.md)
- Package [README](../../README.md) — OAuth, authentication, full container checklist
- Release [1.8.0 notes](https://github.com/Picolab/pico-engine/blob/main/docs/release/1.8.0.md) — what changed in this line
