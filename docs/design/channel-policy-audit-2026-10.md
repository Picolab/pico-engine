# Channel policy audit (1.8 §2)

**Date:** 2026-10-23  
**Scope:** Bundled engine KRL, engine identity/bootstrap TypeScript, and **manifold-api** rulesets that mint or assume wide channels. Test harnesses and demos are out of scope unless they ship by default.

**Goal:** Inventory channels whose policies include **unrestricted allow** (`domain/name *.*` or `rid/name *.*`), **implicit allow-all** (null policies → framework defaults), or **domain/rid-scoped wildcards** (`pds/*`, `profile/*`). For each entry: who holds the ECI, what mitigations apply in 1.8, and whether to **keep**, **narrow**, or **defer**.

**Related:** [`docs/release/1.8.md`](../release/1.8.md) §2 · `MEMORY.md` §4 · `pico-framework` 0.8.2 policy ceiling · opt-in `wildcardSkyRequireBearer` in operator config.

---

## How to read this audit

| Symbol | Meaning |
|--------|---------|
| **Unrestricted** | `allow: [{ domain: "*", name: "*" }]` and/or `allow: [{ rid: "*", name: "*" }]` |
| **Implicit unrestricted** | `createChannel(..., null, null)` or omitted policies → `Channel` class defaults are `*.*` ([`pico-framework` `Channel.ts`](https://github.com/Picolab/pico-framework/blob/master/src/Channel.ts)) |
| **Scoped wildcard** | e.g. `domain: "pds", name: "*"` — wide within one domain/RID, not full `*.*` |
| **Ceiling exempt** | Tags `system`, `engine`+`ui`, `didcomm`/`ingress`, `discovery` skip ceiling enforcement |
| **Family channel** | Parent–child channel; ceiling check skipped; policies often unused for family send path |

**Mitigations (1.8):**

1. **Pico policy ceiling** — app channels cannot exceed the pico’s stored ceiling (inherit from parent or `policyCeiling` on `new_child_request`). **Roots default to permissive ceiling** until operator or parent sets one (`PERMISSIVE_POLICY_CEILING`).
2. **Wildcard HTTP lock** — when `wildcardSkyRequireBearer: true`, unrestricted-allow channels require OAuth bearer on `/sky/*` (and passkey on `/c/*` when auth is on). **Default off** for backward compatibility.
3. **DIDComm ingress** — JWE + routing; not Sky bearer.
4. **ECI union** — unchanged: any caller with **any** wide ECI on the pico can use that capability; ceiling limits **new** channels, not leakage of an existing wide ECI.

---

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| **Critical (full `*.*` in production paths)** | 4 patterns | See table below; one Manifold RS needs product decision |
| **High (implicit `*.*` via null policies)** | 1 | Manifold app channel |
| **Medium (scoped `domain/rid *`)** | 4 | Justified service channels; narrow when ceiling lands on thing picos |
| **Low / platform** | UI, discovery, ingress | Exempt or intentionally narrow |

---

## Engine — bundled KRL (`packages/pico-engine/krl/`)

| Ruleset | Channel / mechanism | Policy | Disposition | Notes |
|---------|---------------------|--------|-------------|-------|
| `io.picolabs.wrangler` | `discovery` (every pico) | Events: `discovery/capabilities` only; queries: **deny all** | **Keep** | Ceiling-exempt tag `discovery`. |
| `io.picolabs.pico-engine-ui` | UI (`engine` + `ui` tags) | Long allow-list of `engine_ui/*`, `wrangler/*`, `engine/*`; queries include `rid: *, name: __testing` and `__consoleEval` only | **Keep** | Ceiling-exempt. Owner passkey (or localhost bypass). Not unrestricted event allow. |
| `io.picolabs.pds` | `pds` | `pds/*` events; `io.picolabs.pds/*` queries | **Keep (scoped)** | Service channel for PDS writes. Holders should be trusted integrators; thing picos should get a **narrow ceiling** so apps cannot clone this width. |
| `io.picolabs.subscription` | Rx bus (`createRxBus`, `createRxBusLayer2`, etc.) | **`allow_all_*` (`*.*`)** via `ctx:newChannel` | **Keep (justify)** | Internal subscription receive path; peer traffic is DIDComm/Layer 2 + subscription wiring, not public Sky for arbitrary callers. **Recommend:** tag includes `subscription`; document that leaked Rx ECI is high impact; optional future narrow-by-domain. |
| `io.picolabs.oauth` | (no channel mint) | — | — | Documents `oauth-webhook` / mesh lock; channels created elsewhere. |
| `io.picolabs.wrangler` | `@example` on `new_channel_request` | Shows app-scoped webhook pattern | **Keep** | Documentation only. |

---

## Engine — TypeScript bootstrap

| Location | Channel | Policy | Disposition | Notes |
|----------|---------|--------|-------------|-------|
| `src/identity/webvh.ts` | DIDComm ingress | `dido/didcomm_message`; queries denied | **Keep** | Tags `didcomm`, `ingress`; ceiling-exempt; crypto gate on HTTP. |
| `src/identity/establishSubscription.ts` | Layer 2 Rx (`DEFAULT_RX_CHANNEL`) | **Unrestricted `*.*`** | **Keep (justify)** | Same role as subscription KRL Rx; created when establishing peer subscription. Wildcard Sky lock applies if enabled. |
| `src/uiChannelPolicies.ts` | UI channel (migration) | Mirrors `io.picolabs.pico-engine-ui` | **Keep** | Sync with KRL. |
| Framework default | Any channel with missing/null policies | **Implicit `*.*`** | **Document** | Manifold `createChannel(..., null, null)` and careless UI edits inherit this. |

---

## Manifold-api (sibling repo)

| Ruleset | Channel name / tag | Policy | Disposition | Notes |
|---------|-------------------|--------|-------------|-------|
| **`io.picolabs.new_tag_registry`** | `registration` | **`safeandmine/register_tag`, `deregister_tag`, `redirect`**; queries `get_tag_store`, `scan_tag` | **Done (manifold-api)** | Existing meshes: **flush** this RS or **update_channel** on the registration ECI to pick up policies. |
| **`io.picolabs.manifold_pico`** | App channel (`Manifold` + `App` tags) | **`manifold/*` events**; queries **`io.picolabs.manifold_pico/*`** | **Done (manifold-api)** | Replaces `null, null`. Existing meshes: flush `manifold_pico` or edit channel policies in UI. |
| `io.picolabs.manifold_bootstrap` | `bootstrap` | Events: none; query: `getBootstrapStatus` only | **Keep** | Minimal surface. |
| ~~`io.picolabs.manifold.skills_registry`~~ | ~~`skills_registry`~~ | — | **Removed** | **Retired 2026-10:** dropped from bootstrap; ruleset in `manifold-api/archive/`. Agent tool exposure → engine **`channelSchema`** + 1.8 MCP, not a skill-list pico. |
| `io.picolabs.manifold_owner` | `initialization` | `manifold/new_tag_server` + listed queries | **Keep** | Narrow. |
| `io.picolabs.manifold_owner` | `updates` | `manifold/updated_context`, `profile/*` events; listed queries | **Keep (scoped)** | `profile/*` is wildcard within profile domain. |
| `io.picolabs.pds` (manifold copy) | `pds` | Same as engine bundled PDS | **Keep (scoped)** | Prefer single source in engine bundle over time. |
| `io.picolabs.homeassistant` | `homeassistant` | HA notification + two queries | **Keep** | Narrow integration channel. |
| `io.picolabs.safeandmine` | (comment only) | Example in comment | — | No runtime mint in audit path. |

---

## Operator / user-created channels

| Source | Policy | Disposition |
|--------|--------|-------------|
| UI **New channel** (`engine_ui/new_channel`) | User-supplied JSON policies | **Ceiling-bound** when pico has non-permissive ceiling; otherwise can mint `*.*`. |
| UI **Edit channel** | User edits | Same; `putChannel` enforced. |
| **`oauth-webhook` tag** | Often paired with wide allow for webhooks | **Keep pattern**; require bearer on `/sky/*` (always for webhook tag when mesh OAuth ruleset present; plus wildcard lock when `*.*`). |
| **`mesh-oauth-exempt` tag** | Operator override for mesh OAuth ruleset lock | **Keep**; does **not** bypass wildcard Sky lock when opt-in flag is on. |

---

## Framework defaults (no stored ceiling)

| Pico | Effective ceiling | Implication |
|------|-------------------|-------------|
| Root (no `policyCeiling`, no engine `defaultRootPolicyCeiling`) | **`PERMISSIVE_POLICY_CEILING` (`*.*`)** | Legacy behavior; any app channel within `*.*` is allowed. |
| Child (no explicit `policyCeiling` on create) | **Inherits parent ceiling** | Narrow parent → child cannot widen. |
| Child with `policyCeiling` attr | Must be ⊆ parent | Wrangler `new_child_request` / `ctx:newPico`. |

---

## Recommended follow-ups (post-audit)

1. **Manifold-api (deferred release):** `policyCeiling` on `create_thing`; flush narrowed channel policies on existing meshes.
2. ~~**Manifold-api:** Narrow tag registry + app channels~~ **KRL done** — migrate on release.
3. ~~**Engine config:** `defaultRootPolicyCeiling`, global denies~~ **Done** — `config.policy-ceiling.example.json`, [`channel-policy-1.8.md`](channel-policy-1.8.md).
4. **Production:** set `wildcardSkyRequireBearer: true` when ready (see example config).
5. **1.8.0 release notes:** link audit + [`channel-policy-1.8.md`](channel-policy-1.8.md).

---

## Re-audit

When adding a ruleset that calls `wrangler:createChannel` or `ctx:newChannel`, add a row here or in the ruleset’s `@example` / schema docs. CI grep (future): fail PRs that introduce `"domain": "*", "name": "*"` in `packages/pico-engine/krl` or documented manifold paths without an audit row.
