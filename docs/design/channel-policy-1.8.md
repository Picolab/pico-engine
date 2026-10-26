# Channel policy fix — engine scope (1.8 §2)

**Status:** **engine complete** (2026-10-23). **Manifold-api** product wiring deferred (no release yet).

This doc closes the **pico-engine + pico-framework** policy thread for 1.8. Inventory and per-channel dispositions: [`channel-policy-audit-2026-10.md`](channel-policy-audit-2026-10.md).

---

## Shipped in engine / framework

| Capability | Where |
|------------|--------|
| Deny beats permit | `pico-framework` channel eval; `test/layer2ChannelPolicy.ts` |
| Pico **policy ceiling** on `newChannel` / `putChannel` | `pico-framework` 0.8.2; platform tag exemptions |
| Child ceiling via `ctx:newPico` / wrangler `@attr policyCeiling` | `pico-engine-core`, `io.picolabs.wrangler.krl` |
| **Default root ceiling** (optional; else permissive) | `PicoFramework.defaultRootPolicyCeiling`; operator **`defaultRootPolicyCeiling`** in config JSON |
| **Global deny lists** | `globalEventDeny` / `globalQueryDeny` on engine → every ECI |
| **Wildcard HTTP mitigation** (opt-in) | `wildcardSkyRequireBearer` in config/env; OAuth on `/sky/*`; tests in `wildcardChannelIdentity.ts` |
| Bundled KRL audit | No engine bundle changes required |

**Framework dependency:** `pico-framework@^0.8.2`.

---

## Operator configuration

In `~/.config/pico-engine/config.json` (see `packages/pico-engine/config.example.json` and `config.policy-ceiling.example.json`):

| Field | Purpose |
|-------|---------|
| `wildcardSkyRequireBearer` | `true` → bearer required on `/sky/*` for channels with unrestricted allow |
| `defaultRootPolicyCeiling` | Caps channel policies on **root** picos when the pico has no stored ceiling |
| `globalEventDeny` | `[{ "domain", "name" }, …]` denied on every ECI before channel policy |
| `globalQueryDeny` | `[{ "rid", "name" }, …]` denied on every ECI |

Precedence: defaults → env → config file → programmatic (`startEngine` / tests). Roots still default to **permissive** ceiling when unset (backward compatible).

**Parent-set ceilings** for app picos (things, communities) are expressed in KRL via `policyCeiling` on `new_child_request` — engine-ready; **Manifold-api** will pass values when that repo ships.

---

## Explicitly not in engine 1.8

| Item | Notes |
|------|--------|
| **Who may call `createChannel`** | Not a separate RS gate; **ceiling** limits width. UI/wrangler still create channels within ceiling. |
| **ECI union** | Holding two ECIs still unions capability; ceiling + narrow minting reduce risk. |
| **DID signature on `/sky`** | Wildcard lock uses OAuth bearer / passkey session only. |
| **Manifold channel KRL** | Narrowed in manifold-api tree; **flush/migrate** when Manifold releases. |
| **Manifold `policyCeiling` on `create_thing`** | Deferred with Manifold release. |

---

## Tests (run together)

```sh
cd packages/pico-engine
npm run test:policy
```

Covers deny-first, ceiling enforcement, wildcard identity, config-driven root ceiling.

---

## Exit criteria (1.8 §2 / plan #3)

| Check | Engine |
|-------|--------|
| Deny beats permit | Yes |
| `createChannel` above ceiling rejected | Yes |
| Wildcard channel without caller identity refused | Yes when `wildcardSkyRequireBearer` enabled (default off) |

---

## Deferred to Manifold release

1. Ship narrowed **tag registry** + **Manifold app** channel policies; flush rulesets or edit ECIs on existing meshes.
2. Pass **`policyCeiling`** on thing/community `new_child_request`.
3. Mention in Manifold release notes + link this doc and the audit.
