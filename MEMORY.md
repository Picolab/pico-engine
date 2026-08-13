# MEMORY: pico-engine

Working context for pico-engine improvements so we don't lose it across sessions.

> **Origin note:** this context was extracted from
> `/Users/pjw/Dropbox/prog/picolabs/manifold-api/MEMORY.md`, where pico-engine direction
> had been co-mingled with the Manifold ↔ sensor-network migration work. That file remains the
> source of truth for Manifold/sensor-network specifics; this file is the engine-focused view.
> Cross-repo consumers of the engine: **manifold-api**, **sensor-network**.

---

## FOUNDATIONAL: the three-layer stack (engine ← wrangler ← manifold)

**This is the lens for all design work below, especially identity.** There is a strict dependency
hierarchy:

```
engine       ← primitives (mechanism)
  ↑
wrangler     ← the "OS": makes primitives usable (functions, rules, conventions)
  ↑
manifold     ← FRAMEWORK for building pico meshes: consumes engine+wrangler capabilities
  ↑            AND abstracts them for app developers
mesh apps    ← Fuse, sensor-network, … (built ON Manifold by app devs)
```

- **Engine = primitives.** Low-level mechanism only. **Pico identity (DID/DIDComm — see §5) and the
  user-identity layer must exist as engine primitives** — DID key management (generate/rotate/verify),
  maintain + serve each pico's did:webvh log, sign/verify requests, DIDComm pack/unpack,
  verifiable-credential verification, the user-identity record + verification. **User identity
  (passkey registration) is CORE, not opt-in** — it is the only way to access the engine (see §9 +
  Layer 1). The engine knows nothing about Manifold.
- **Wrangler = the OS layer** that makes engine primitives *usable*. It wraps primitives in KRL
  functions/rules and higher-level constructs. Example: **subscriptions are mostly a wrangler
  construct built on top of engine ECIs.** Identity analog: wrangler exposes
  `wrangler:myDid()` / `callerDid()`, DID-based subscription formation (pairwise did:peer = crypto
  ECIs, as DIDComm connections), key rotation + DIDComm DID Rotation + location discovery, channel
  templates, the introduction pattern, and binds DIDs / user identity to the pico tree — all on top
  of engine primitives.
- **Manifold = a FRAMEWORK for building pico meshes (networks).** It is **both**:
  1. a **consumer** of engine+wrangler identity/policy capabilities, and
  2. an **abstraction layer** that makes those capabilities **easier for app developers** —
     hiding SPIFFE/identity/subscription plumbing behind mesh-oriented constructs so devs can build
     their own pico-mesh apps without wiring primitives by hand.
- **Mesh apps = what people build ON Manifold.** **Fuse** and the **sensor network** are both
  examples of pico meshes. The registry / skills / platform picos are *examples of consumers/mesh
  infrastructure*, not part of the primitive design.

### Design rule that follows
**Do NOT design the identity/mirror/policy primitives around Manifold (or mesh-app) specifics.**
Instead: design engine primitives + wrangler affordances so that Manifold **can** cleanly (a) use
them and (b) *re-expose* them as friendly mesh-building abstractions. Success test: could Manifold
wrap the primitive into a simple mesh construct that Fuse/sensor-network-style apps use without
touching DID/DIDComm/ECI internals? — exactly the spirit of the cross-mesh-adoption walkthrough
(registries-as-platform-tree-via-subscription is a *consumer scenario* that must be *possible*, not
a *requirement that shapes the primitive*).

### Implication for the primitives
Because Manifold's job is to **abstract identity for mesh-app devs**, the engine/wrangler primitives
should be **composable and ergonomic to wrap**: clear KRL-facing functions (wrangler), sensible
defaults, and feature flags — so Manifold can present, e.g., "add a controller to this mesh" or
"adopt a pico from this peer mesh" as one-liners over DID + subscription + policy underneath.

### Where each concern lives

| Concern | Engine (primitive) | Wrangler (OS) | Manifold (consumer) |
|---------|--------------------|--------------|--------------------|
| **Pico identity (DID/DIDComm, §5)** | DID key + did:webvh log mgmt, sign/verify, DIDComm, VC verify | `myDid`/`callerDid`, did:peer subscription formation, key rotation + DIDComm DID Rotation, channel templates | records peer DID on subscriptions; uses it |
| **User identity** (passkey → agent, §9) | WebAuthn ceremonies + credential store, session issuance, passkey-gated key unlock (**core, not opt-in**) | register/bind passkeys to a root, issue/verify sessions, expose to KRL | "sign in" / "add an admin"; root pico acts as the human's agent |
| **ECIs / channels** | ECI issuance, channel policy eval | subscriptions, tags, introduction pattern | subscribe/tag relationships |
| **Authorization** | channel policy engine; Cedar eval (future) | policy templates, tag→capability mapping | declares intent via tags/policy |
| **Control hierarchy** | parent/child tree, root picos (multi-root) | child creation, tree ops, admin rights | organizes its trees |

---

## SHIPPED: pico-engine 1.4.0 (released, npm published)

Commits `5878bdf4 … f18f9233`.

| Change | Notes |
|--------|-------|
| **PDS default-install** | Engine default-installs `io.picolabs.pds` on root and every child pico at creation — joins Wrangler at the engine-default layer (Phase F of the PDS plan). Manifold no longer installs PDS explicitly. |
| **UI deadlock fix** | [#493](https://github.com/Picolab/pico-engine/issues/493) |
| **Schedule cleanup on pico delete** | [#578](https://github.com/Picolab/pico-engine/issues/578) |
| **Module cycle rejection at flush** | [#577](https://github.com/Picolab/pico-engine/issues/577) |
| **CI Node pin (20/22)** | Node 24 broke krl-parser ava timeouts on GitHub Actions. CI runs a Node 20/22 matrix. |

**Recommended runtime:** Node **22 LTS** (project requires 18+; CI tests 20 and 22).
**Engine requirement for Manifold:** pico-engine **1.4+** (`npm install -g pico-engine@1.4.0` or Docker image).

---

## SHIPPED: pico-engine 1.5.0 + 1.5.1 (2026-07-14)

**Layer 1 (passkeys + multi-root) + Layer 3 (OAuth) shipped.** Layer 2 (DID/DIDComm interchange) still
deferred.

### Release status (2026-07-14)

| Artifact | Status | Notes |
|----------|--------|-------|
| **npm** | 1.5.0 published; **1.5.1** ready to publish | Use `npm run publish` from repo root (`lerna publish from-package --yes`). Do **not** publish from repo root or `pico-engine-ui` (both `"private": true`). Publish **pico-framework@0.8.0+** first if bumped. |
| **GitHub tags** | `v1.5.0`, `v1.5.1` local | **`git push` does not push tags.** Run `git push origin v1.5.0` (and `v1.5.1`) separately. GitHub **Releases** are created in the UI (or `gh release create`) *after* the tag is on origin. |
| **UI version string** | From `packages/pico-engine/package.json` | Shown via `/api/ui-context` → AuthGate + Picos page footer. Bumped to **1.5.1** in commit `d135b1d7`. |
| **pico-framework** | **0.8.1** — custom channel id, `eciIsTaken` | **Required** for pico-engine 1.6 (`^0.8.1` in package.json). Publish framework before engine. **`npm run link-framework`** is for co-development only, not deployment. |

**Tag ↔ commit mapping (local):**

- **`v1.5.0`** → `3470acd6` (passkey auth + OAuth external API)
- **`v1.5.1`** → current `master` head (channel editing + migration fix)

### 1.5.0 highlights

- Passkey auth (WebAuthn), sessions, AuthGate UI, multi-root (`pico-framework` 0.8.0)
- OAuth: Client Credentials (`oauth-webhook` channels), Authorization Code + PKCE (HA-style integrators)
- HTTP split: passkey session on **`/c/*`**; Bearer on **`/sky/*`** when mesh locked or webhook channel
- `io.picolabs.oauth` ruleset (optional mesh lock); Settings UI for OAuth apps
- Legacy claim migration + invite-gated registration
- Docs drafted for Confluence (Identity, Passkeys, CC, ACG, env vars)

### 1.5.1 highlights (channel editing — 2026-07-14)

**Motivation:** builders need to add `oauth-webhook` (and tighten policies) on **existing** channels,
not only at creation — e.g. before HA / webhook testing.

| Area | What shipped |
|------|----------------|
| **Developer UI** | Channels tab: expand a non-system channel → **Edit channel** (tags, event/query policy, Save). One-click **`oauth-webhook`** tag. Webhook OAuth panel when tag present. |
| **KRL (`engine_ui`)** | `update_channel` event → `ctx:putChannel` |
| **Wrangler** | `updateChannel` defaction; `channel_update_request` / `channel_updated` events |
| **`ctx:putChannel`** | Returns updated channel map (matches `newChannel`) |
| **Startup migration** | `refreshAllUiChannelPolicies()` in `provisionRoot.ts`: for **every loaded pico**, reinstall `io.picolabs.pico-engine-ui` + apply canonical UI channel policy via **`putChannel`** (not tree-walk + `setup` events). Policy constants in `src/uiChannelPolicies.ts` — keep in sync with KRL `uiChannelEventPolicy()` / `uiChannelQueryPolicy()`. |
| **Tests** | `test/uiChannelUpdate.ts`, `test/wranglerChannel.ts` |

**Migration gotcha (fixed in 1.5.1):** first migration attempt walked parent→child tree and fired
`engine_ui:setup` on each UI channel. Some picos were **missed** (not reachable from root walk);
others had stale UI channel policies blocking `update_channel` → **"Not allowed by channel policy"**
even after engine restart. **Fix:** iterate `pf.loadedPicos()` and `putChannel` directly (bypasses
event policy gate). After upgrade: **restart engine** once (migration runs in `provisionRoot`).

**Manual fallback (single pico):** Rulesets tab → flush **`io.picolabs.pico-engine-ui`**.

**Programmatic update (wrangler):**

```krl
wrangler:updateChannel(eci, tags, eventPolicy, queryPolicy) setting(channel)
// or
raise wrangler event "channel_update_request" attributes { "eci": ..., "tags": ..., ... }
```

Confluence: **Managing Channels** — add "Updating a Channel" section (UI + wrangler).

### HA / Manifold integration (2026-07-21 — hub + companions)

**POC scope:** Home Assistant as a **general front-end to a Manifold mesh**. Community-specific
behavior (sensor-network, etc.) ships as **optional HA companion integrations** beside KRL repos,
not baked into the hub.

**Source of truth:** [`manifold-home-assistant/MEMORY.md`](../manifold-home-assistant/MEMORY.md)

**Docker harness:** [`manifold-home-assistant`](../manifold-home-assistant) — `docker compose`
when Docker is available; mounts `pico_mesh` + `pico_mesh_sensor_network` (from sensor-network repo).

| Integrator | OAuth grant | Role |
|------------|-------------|------|
| **Home Assistant (hub)** | Authorization Code + PKCE | Manifold discovery + mesh-wide `/sky/query/` |
| **HA companions** | (none — use hub OAuth) | e.g. `pico_mesh_sensor_network` probes router rulesets |
| **Helium / webhooks** (optional) | Client Credentials | Thing channel ingress; not POC focus |

**Requires:** engine **1.5.2+**, pico-framework **0.8.0+**.

**Hub repo:** `manifold-home-assistant` — domain `pico_mesh`, public API `custom_components/pico_mesh/hub.py`.

**Discovery (Manifold-first):**

1. `io.picolabs.manifold_pico/getManifoldInfo` → thing & community devices
2. Per thing: **discovery channel** → `discovery capabilities` → `thing.apps` → entities/services
3. Companions: probe `wrangler:installedRIDs` on thing Tx for community rulesets (e.g. LHT65 router)

Redirect URI for local Docker: `http://localhost:8123/auth/external/callback`.

### Key commits (master, post-1.5.0 tag)

```
d135b1d7 Bump package versions to 1.5.1 to match CHANGELOG.
db04c0c8 Fix UI channel policy migration for all loaded picos.
16eacea4 Add channel editing in UI and wrangler with startup migration.
e505a1a2 Fix invite links to always show registration
```

**Engine requirement for Manifold / HA:** pico-engine **1.5.1+**, pico-framework **0.8.0+**.

---

## ROADMAP (deferred / future engine work)

### 1. Pico-level event schema (engine + wrangler)
An **event schema** per pico — the event (at the pico boundary) is the unit of record, NOT the
ruleset (multiple rules from different RSs may respond to one event).

- **Per `domain:type`:** attributes (required / optional / types); whether the event is **logged**
  for mirror/replay; optional flags (e.g. idempotent replay, `replaySafe: false` for external
  side effects).
- **Registration:** rulesets register events into the pico's schema (mechanism TBD: KRL meta,
  install-time wrangler hook, or explicit register API).
- **Validation:** engine warns (or rejects in strict mode) on events not in schema.
- **Logging:** schema marks which events are appended to the pico's replay log.

**Default logging policy:**

| Event source | Logged by default? | Rationale |
|--------------|--------------------|-----------|
| **Wrangler** | **Yes — all** | Captures tree, installs, subscriptions, channels — the relationship graph |
| **PDS write commands** | **Yes** (`pds updated_profile`, `new_data_available`, `add_settings`, …) | Canonical data plane; replay commands, not necessarily `pds data_added` notifications |
| **App/domain events** | **Opt-in** | Ruleset registers + sets `logged: true` only when a mirror needs them (e.g. sensor readings) |

### 2. Selective logging & replay (sketch)
- **Log commands, not effects** — prefer replaying `pds new_data_available` (idempotent write
  path) over internal `pds data_added` notifications.
- **Side effects on replay** — Twilio, Prowl, external HTTP must be suppressed or tagged
  `replaySafe: false`; mirror driver skips/stubs them.
- **Cross-pico events** — subscription delivers to another pico's bus: log at source, destination,
  or both? Network mirror may need a **forest-level log** keyed by pico DID / owner subtree.
- **Snapshots** — periodic PDS snapshot + event tail vs pure replay from genesis.
- **Engine vs RS** — schema registry + append-only store likely **engine**; registration API via
  wrangler + ruleset meta; replay driver TBD (`io.picolabs.mirror` RS or wrangler subsystem).
- **Literature:** event sourcing / CQRS (Greg Young, Fowler's event-sourcing essay); DDD domain
  events; snapshot + event tail for restore; causal ordering for graph structure (subscriptions
  before dependent actions).

### 3. Pico mirrors (overall goal)
| Mirror type | What it copies | Mechanism |
|-------------|----------------|-----------|
| **Simple mirror** | One pico's state | PDS snapshot (`profile`, `general`, `settings`) + installed RIDs |
| **Network mirror** | Tree + relationships | parent/child, subscriptions, channels, ruleset installs |
| **Living mirror** | Evolving replica | selective event-log replay, not full engine trace |

Simple mirror is easier now that every pico has PDS (one canonical data surface). Network mirror
needs relationship events (Wrangler/subscription lifecycle) + replayable state changes (PDS write
commands).

**Open design questions:**
1. Schema conflicts — two RS register same `domain:type` with different attrs?
2. Who may register — any installed RS, or platform RS only for platform events?
3. Mirror scope — single pico, owner subtree, subscription-connected component?
4. Cross-engine mirrors — witness-based DID/DIDComm trust, no federation needed (see §5); relates to
   pico migration/portability (§7).
5. PDS enhancements enabled by default install — `meta:callingRID()` write auth, validation,
   structured log records on persist, versioned profile merges.

### 4. Channel policy engine fix — permit-overrides-deny (MUST FIX)
Affects **all** pico security relying on channel event/query policies, not just Manifold/PDS.

**Current engine behavior (the flaw):**
- Within one channel's policy, **permit overrides deny** — an allow rule wins even when a deny
  rule also matches.
- Authorization is effectively the **union of all channels** on the pico. Each ECI is an
  independent capability; restrictive policies on channel A do not limit a caller who also holds
  channel B's ECI.
- Any installed RS can `wrangler:createChannel` with `allow: [{domain:"*", name:"*"}]`. Anyone
  who learns that ECI can send/query anything — bypassing narrow policies on all other channels.
  (Example in the wild: `io.picolabs.new_tag_registry.krl` legitimately creates an `allow: *`
  channel — illustrates that any RS can mint a universal capability.)

**Required changes (engine):**
| Change | Rationale |
|--------|-----------|
| **Deny overrides permit** | Explicit deny wins within one channel's policy (deny-by-default) |
| **Pico-level policy ceiling** | No channel may exceed a max policy for that pico type (owner/thing/community/registry) — channel templates enforced by engine/wrangler, not honor system |
| **Restrict who may create channels** | App RSs shouldn't mint arbitrary channels; platform/wrangler owns sensitive channel types |
| **Optional pico-wide deny list** | Engine-level denies applying to every ECI regardless of per-channel allow |

**Partial mitigation before full ceiling:** engine rule that any channel whose policy includes a
full wildcard (`*.*` or rid/fn equivalent) **must** require a validated caller identity (DID
signature; see §5) on every request. Shrinks blast radius of a leaked wide-open ECI.

### 5. Pico identity: DID/DIDComm — did:peer + did:webvh (SPIFFE reconsidered; KERI reconsidered — 2026-07-10)

**Turn (2026-07-10): a DID/DIDComm-native identity layer; drop SPIFFE as the backbone.**
Goal unchanged: cryptographic **pico-to-pico (workload) identity** + **authorization** that does
not depend on KRL rulesets behaving correctly. What changed: the **R1T cross-mesh adoption
scenario** (see "Worked scenario" below) showed identity must be **portable** and
**relationship-anchored**, which is where SPIFFE fails.
**Refinement (same day):** prefer **two DID methods that both speak DIDComm** over mixing a DID
method with KERI — **did:peer** (relationships) + **did:webvh** (public/portable) — for ecosystem
coherence and much lower operational weight than KERI. KERI kept as a considered alternative below.

#### Why SPIFFE can't be the ultimate ID
SPIFFE's foundational assumption is **identity = a location in a trust domain**
(`spiffe://<engine>/<path>`). Two of our requirements fight that:
1. **A relationship must be able to survive a move.** If a pico's identity is `spiffe://A/.../r1t`
   and becomes `spiffe://B/.../r1t` on migration, a surviving peer (e.g. a battery-health service)
   sees a *different entity*. The relationship wasn't preserved — it was replaced.
2. **Trust without prearranged federation.** Cross-engine SPIFFE needs O(n²) trust-bundle
   federation between independently-run engines — wrong shape for an open mesh of many owners.

**Conclusion:** SPIFFE ID can be a useful *local* handle, but **the ultimate identity must be a
DID** (self-owned, portable, host-independent).

#### The model: did:peer + did:webvh (both DIDComm-native)
- **did:peer = the cryptographic upgrade of ECIs.** A subscription is already a *pairwise
  relationship with a per-relationship channel id*. A pairwise DID per subscription fits perfectly:
  privacy-preserving (no cross-relationship correlation), no ledger/hosting, generated locally.
  This is where most pico↔pico traffic lives, as **DIDComm connections**.
- **did:webvh = the pico's public, portable identity** ("did:web + Verifiable History", DIF v1.0;
  formerly did:tdw). An append-only, hash-chained **DID log** (`did.jsonl`) hosted over HTTPS, with:
  - **SCID** (self-certifying id, first segment of the DID) derived from the inception entry —
    verifiers detect tampering; **the SCID never changes for the life of the DID**.
  - **Portability** (`portable: true`, *settable only at inception*): the DID's **host/path may
    move** (e.g. Phil's engine → Dave's engine) while the **SCID + full history are retained**.
  - **Pre-rotation** (`nextKeyHashes`) and **optional witnesses** (`did-witness.json`, threshold
    approval) for compromise-resistance + availability/duplicity detection.
  - **`/whois`** path returns a Verifiable Presentation of VCs about the DID — a built-in,
    decentralized **trust-registry / credential** surface (use for conferred-rights credentials).
- **Natural fit for picos:** picos are *already web-hosted on an engine*, so **the engine is the
  did:webvh host** for its picos' logs — no separate witness infrastructure required to start
  (witnesses optional later). Uses did:web's DID→HTTPS transformation.
- **DIDComm is the unifying messaging layer.** Both methods advertise **DIDComm service endpoints**
  in their DID docs, so pico↔pico event/query traffic can become **DIDComm messaging** regardless
  of which method identifies the pico — and can serve as the **cross-mesh transport** (augmenting
  the sky HTTP API).
- **SPIFFE: dropped as backbone.** Engine-boundary auth = pico **signs the request with its DID
  key**; verifier checks against the current DID doc / resolved key state (cache like a JWKS).

#### Existing engine support to build on (reviewed in full 2026-07-10)
Existing **did:peer (method 2) + DIDComm v2** support is structured as **exactly the two layers of
our model** — an engine module + a KRL/wrangler-level wrapper ruleset:

**Engine layer — `packages/pico-engine-core/src/modules/dido.ts`** (the `dido` built-in module,
"DIDO v1.0.0" by Rembrand Paul Pardo, Kekoapoaono Montalbo, Josh Mann; uses **`didcomm-node`**).
Called from KRL as `dido:*` (native module, no `use module` needed). Provides:
- `generateDID` (did:peer:2, x25519 key-agreement + ed25519 signing; DIDComm service endpoint = a
  `/sky/event/<eci>/…/dido/didcommv2_message` URL), `resolvePeer2Did`, `storeDidDoc`, key/secret
  storage in `ent`;
- `pack`/`unpack` (encrypted JWM), `generateMessage`, `route` (unpacks inbound + raises the mapped
  event/query), `send`, `sendQuery`, `prepareQuery`;
- **DIDComm DID Rotation** (`rotateDID`, `from_prior`, `pendingRotations`, `rotateInviteDID`),
  `mapDid`/`didMap`, OOB **invitations** (`createInviteUrl`).

**KRL/OS layer — `packages/pico-engine/krl/io.picolabs.did-o.krl`** (ruleset `io.picolabs.did-o`,
alias `didx`; a **separate installable ruleset**, `use module io.picolabs.wrangler`). Wraps the
`dido:` module and adds rules: `route_message` (on `dido didcommv2_message`), invitations,
Trust Ping (`send_trust_ping`/`receive_trust_ping`), route init on install + `engine_ui setup`,
and functions `sendEvent`/`sendQuery`/`generate_invitation`/etc.

**How wrangler wires in today** (`io.picolabs.wrangler.krl`):
- `picoQuery(eci, mod, func, params, …)` branches: `eci` matches `^did:` → **`dido:prepareQuery`**
  (DIDComm); same host → **`ctx:query()`** (local, family-channel-safe); else → **`http:get`**.
  So picoQuery calls the **engine `dido` module directly** (not via the did-o ruleset).
- Wrangler's install bootstrap knows a `did_o_url` sibling-ruleset URL (installs did-o alongside
  subscription + pds).
- **Transport note:** DIDComm currently rides **over HTTP POST to a sky endpoint** (encryption +
  identity on top of HTTP), and the DID path is only taken for **DID-addressed** queries.

#### Architecture decision (2026-07-10): DIDComm is primary → NO separate wrapper ruleset
Because DIDComm becomes the **primary** pico-to-pico method (not an optional bolt-on), we will
**not** keep a separate KRL wrapper ruleset like `io.picolabs.did-o`. Instead:
- **Engine layer** keeps + is expanded: modernize the `dido` module and **add did:webvh** (plus
  key management / DID doc log serving per §layering).
- **The wrapper's capabilities fold into wrangler core** (routing, send/sendEvent/sendQuery,
  DID management, invitations, rotation) — DIDComm is a first-class part of the OS layer, not an
  installable add-on. `picoQuery`/`event:send` route over DIDComm natively; subscriptions become
  DIDComm connections.
- **Consistency:** this preserves the engine←wrangler split (mechanism in `dido`/engine, ergonomics
  in wrangler) while removing the bolt-on layer. Consumers (Manifold, apps) never install a DID
  ruleset — they just use wrangler/DIDComm.
- **Migration:** the useful rules/functions in `io.picolabs.did-o.krl` are the reference for what to
  move into wrangler; the standalone ruleset (and its sibling-install wiring) is retired.

##### DID state becomes an engine primitive (not RS-scoped `ent:`)
**Decision (2026-07-10):** the DID/DIDComm state is a **primitive → engine-owned, per-pico storage**,
not ruleset entity vars.
- **Today it's RS-scoped:** `dido.ts` reads/writes via `this.rsCtx.getEnt/putEnt`, so `didSecrets`
  (private keys!), `didDocs`, `didMap`, `pendingRotations`, `routes` currently live in the
  **calling ruleset's** `ent` (i.e. the `io.picolabs.did-o` ruleset). Wrong home for a primitive.
- **Target:** move this to **engine-managed per-pico state** (like the pico's channels/identity
  record), owned by the engine, not any ruleset.
- **Keys must NOT be KRL-readable.** Private key material stays **engine-held**; KRL/wrangler get
  *capabilities* (sign, pack/unpack, resolve, rotate) — never the raw secrets. This directly serves
  the §9 posture (encryption at rest, **passkey-gated unlock** of the agent's key material, so a
  stolen DB alone is insufficient).
- **Note:** distinct from PDS — this is engine identity/crypto state, below the PDS data plane.
- **Migration detail:** existing picos with `io.picolabs.did-o` installed hold this state in that
  RS's `ent`; migrating to the engine primitive needs a one-time move of `didDocs`/`didMap`/
  `pendingRotations`/`routes` and (carefully) `didSecrets`.

#### Trust model (what we actually wanted)
- **SPIFFE trust** = per-engine CA + explicit federation; governance = trust-domain membership.
- **did:webvh trust** = anyone verifies the **hash-chained DID log from the SCID/inception**, plus
  optional **witness** proofs — **no prearranged inter-domain trust/federation**. Availability
  rests on web/TLS hosting (mitigated by witnesses + the fact engines are already web servers).
  Governance/authorization rides on **W3C Verifiable Credentials** (surfaced via `/whois` or
  presented in DIDComm), e.g. "Dave holds a title credential for R1T's DID" — not trust-domain
  membership. Aligns with the SSI direction (MyTerms, SEDI, "Fix Identity First").

#### Relationship survivability on a move (taxonomy)
Classify each edge by whether it is *to the mesh* (structural) or *to a peer* (portable):

| Edge | Nature | On move |
|------|--------|---------|
| **Parent–child** | structural / admin (which mesh hosts+controls it) | **severed necessarily** — pico gets a new parent in the destination mesh; never identity-bearing |
| **Mesh-membership subscription** (e.g. to a community) | mesh-scoped peer | **swapped** — delete old, create new in destination mesh |
| **Peer/service subscription** (e.g. battery-health) | peer, mesh-independent | **survives** — the DIDComm connection persists; continuity anchored by the **SCID** (unchanged), and the peer is updated via **DIDComm DID Rotation** + the new did:webvh location/endpoint |

Key reason it works: **continuity lives in the SCID (and the DIDComm connection), not the host.**
did:webvh portability keeps the SCID + history across a location move; DIDComm DID Rotation informs
peers of the new DID/endpoint. (Nuance vs KERI: the did:webvh *string's* host/path changes on move
— only the SCID is immutable — so peers are notified via rotation rather than seeing a byte-identical
identifier. Acceptable; simpler than KERI.) SPIFFE has no equivalent (move = new identity = every
surviving relationship broken).

> **Design note:** create picos with **`portable: true` at inception** (it can't be enabled later),
> so *any* pico can later move meshes.

#### Authorization
- **Deny-by-default policy at the engine door**, principals = **DIDs** (not SPIFFE IDs).
- **Capabilities via Verifiable Credentials + subscription tags** (conferred-rights model,
  §identity/8): a tag/VC is effectively a role/permission grant; the engine evaluates it before
  events reach KRL. (Cedar/OPA still a candidate as the evaluator; principals become DIDs.)
- KRL rulesets should **not** be the source of truth for security decisions.

#### Layering (engine ← wrangler ← manifold)
- **Engine (primitive):** DID key management (generate/rotate/verify) with **keys engine-held and
  NOT KRL-readable**; **engine-owned per-pico DID state** (DID docs, did map, pending rotations,
  routes, secrets — not RS `ent:`); **maintain each pico's did:webvh log** (`did.jsonl`, SCID,
  pre-rotation, optional witnesses) + serve it over HTTPS; sign/verify requests, DIDComm message
  pack/unpack, VC verification, feature flags.
- **Wrangler (OS):** DID-based **subscription formation** (pairwise did:peer exchange = crypto
  ECIs, as DIDComm connections), key rotation + **DIDComm DID Rotation**, endpoint/location
  discovery, KRL-facing `wrangler:myDid()` / `callerDid()`, VC presentation/verification helpers.
- **Manifold (framework):** "join/leave community", "adopt pico from another mesh", "portable
  service subscription" as one-liners over the primitives.

#### Downsides (honest)
- **Two methods, one ecosystem.** Still two systems (did:peer + did:webvh), but both are W3C DIDs
  and both speak DIDComm — far more coherent + lighter than DID + KERI.
- **Web/TLS hosting dependency (did:webvh).** Availability of a public DID depends on its host; a
  pico whose engine is offline is unresolvable until moved or until witnesses serve it. (did:peer
  relationships need no hosting.)
- **Identifier string changes on relocation** — only the SCID is immutable; peers learn the new
  location via DIDComm DID Rotation (vs KERI's fully immutable AID).
- **Per-request verification cost** > a JWT check (mitigate by caching resolved key state).

#### Node/JS libraries (DID/DIDComm)
| Package | Role | Notes |
|---------|------|-------|
| [`didwebvh-ts`](https://github.com/decentralized-identity/didwebvh-ts) | did:webvh create/update/resolve | TS reference implementation |
| did:peer libs (e.g. `@aviarytech/did-peer`) | Pairwise DID create/resolve | Lightweight; for subscription identity |
| DIDComm v2 libs (e.g. `didcomm` WASM, Veramo) | DIDComm messaging | Message pack/unpack, connections, DID Rotation |
| Veramo / Credo (`@credo-ts`) | DID + VC + DIDComm agent frameworks | Fuller-stack option if we want an off-the-shelf agent |

#### Phased path (revised)
1. **did:webvh per pico** (created `portable: true`) hosted by the engine; `wrangler:myDid()`; no
   verify yet.
2. **did:peer on subscriptions** — pairwise DID exchange at subscription formation (crypto ECIs),
   modeled as DIDComm connections.
3. **Sign+verify requests** at the engine door against resolved key state; key rotation supported.
4. **DIDComm DID Rotation + location discovery** in wrangler → surviving service subscriptions on move.
5. **VC-based credentials + policy** as the authorization layer (principals = DIDs); deny-by-default.
6. **Cross-mesh portability** (pico migration) via did:webvh location move (SCID retained); trust is
   log/witness-verifiable, no federation.

#### Considered alternative: KERI (stronger guarantees, heavier)
Kept as a fallback if we later need KERI's stronger properties:
- **Pros:** the AID is **fully location-independent** (identifier *never* changes on move, not just
  the SCID); strongest witness/duplicity-detection; no web/TLS hosting dependency for resolution.
- **Cons:** heavy & specialized — KELs, witnesses, watchers, receipts, CESR encoding, a KERIA agent
  to run; further from mainstream DID/DIDComm tooling.
- **Node tooling:** `signify-ts` + **KERIA** agent, `keripy` (Python reference). Surface as
  `did:keri` / `did:webs` if adopted.
- **Verdict:** revisit only if did:webvh's hosting-availability or identifier-changes-on-move
  properties prove insufficient for a real deployment.

#### Considered and set aside: SPIFFE (why we're not using it as backbone)
Kept for the reasoning trail. SPIFFE remains a reasonable choice for a *single operator's* fleet
of engines (one shared trust domain / shared CA) where portability across independent owners isn't
needed. The exploration we had recorded:
- **One SPIFFE ID per pico**; channels stay capabilities; engine mints/verifies SVIDs (engine =
  CA); wrangler attaches a path at child creation mirroring the tree
  (`spiffe://<td>/owner/<uuid>/community/…/thing/…`); within one engine trust is implicit; between
  engines trust needs **federation** (exchange trust bundles via bundle endpoints, `https_web` or
  `https_spiffe` bootstrap, periodic refresh); optional `authPolicy.requireSpiffe` + path prefixes
  on sensitive channels; wildcard `*.*` channels would *require* SPIFFE.
- **Enforcement layers:** verify JWT-SVID/mTLS → resolve ECI→channel policy → optional
  requireSpiffe + prefixes → optional Cedar → deliver.
- **Node libs:** `spiffe` npm (SPIRE workload-API client, not minting), `spiffile` (file-based +
  `provision`, engine-as-CA without SPIRE); or mint/verify with `node:crypto` + JWT-SVID spec.
- **Why set aside:** identity is domain-scoped → **re-minted on move** (breaks surviving
  relationships) and **cross-domain trust needs O(n²) federation** (wrong for open, multi-owner
  meshes). DID/DIDComm gives portability + relationship-anchoring + federation-free trust natively,
  collapsing the earlier two-layer "SPIFFE workload id + DID continuity" into one identity layer.

### 7. Pico migration / portability (cross-engine, cross-mesh)
**Design doc (2026-07-17):** [`docs/design/pico-move.md`](../docs/design/pico-move.md) — phased plan
for Bruce's export/move primitives ([#664](https://github.com/Picolab/pico-engine/issues/664),
[#665](https://github.com/Picolab/pico-engine/issues/665), [#659](https://github.com/Picolab/pico-engine/issues/659)):
ruleset+entity export first, subtree import with ECI remapping, channel clone+retire, then
DID-native move.

Surfaced by the R1T adoption scenario (see "Worked scenario" in the identity section). Moving a
pico from one engine/mesh to another so it **leaves** the source and **exists** in the destination.

- **= network-mirror machinery (§3) made federation-aware, + delete of the source.** Migration ≈
  "mirror the pico's structure/state to the destination engine, rewire relationships, then
  `child_deletion_request` on the source."
- **Identity is preserved, not re-minted** — with DID/DIDComm (§5) the pico keeps its **DID
  continuity** across the move: did:webvh moves host/path but retains the **SCID** + full history
  (needs `portable: true` at inception). (This is a key reason SPIFFE was set aside — it would
  re-mint the identity.)
- **ECIs are not portable** — interim subtree move mints new ECIs and supplies an old→new map;
  peers and external integrators must rewire or follow DID (Phase D in design doc). Do not reuse
  ECIs across engines to "simplify" move.
- **Parent coupling** — moving a subtree may break behavior if the parent provided rulesets,
  subscriptions, or platform services; export manifest + migration hooks required (see design doc).
- **Relationship rewiring follows the survivability taxonomy** (§5): parent–child severed;
  mesh-membership subscriptions swapped; peer/service subscriptions **survive** via **DIDComm DID
  Rotation** (SCID continuity, new location/endpoint).
- **Data is a separate problem** (PDS snapshot/replay) — deliberately out of scope for the
  identity/relationship design.
- **Open:** atomicity/rollback if the move half-completes; tombstone/forwarding on the source;
  ordering (structure before dependent subscriptions); consent gates on both meshes.

### 6. PDS enhancements (post default-install)
PDS is now engine-default (1.4.0). Enhancements that the stable contract enables:
- **`meta:callingRID()` on writes** — general: only RID matching namespace (or allowlist) may
  write that namespace; settings: only owning RID; profile: platform RIDs only.
- **Remove or admin-gate `clear_all_data`** — production picos shouldn't accept a wipe from any RS.
- Validation, structured audit-log records on persist, versioned profile merges.

> **Same-pico trust:** entity vars are RS-scoped, so other rulesets can't overwrite PDS `ent:*`
> by assigning their own. BUT same-pico PDS writes have **no caller authorization** today — any
> installed RS can raise `pds` events and PDS persists. `meta:callingRID()` fixes the same-pico
> forged-event vector; DID/DIDComm signatures + policy (§5) fix the cross-pico / engine-boundary
> vector. Both needed.

---

## FUTURE: Identity layer & multi-root engines (thoughts 2026-07-10)

Framing note: this is the broader identity design that the pico-identity work (§5 above, now
DID/DIDComm-native) sits inside. These are working thoughts, not decisions.

### Three-plane identity model (the core idea)
Three distinct kinds of identity, each with its own purpose and mechanism:

| Direction | Question | Mechanism |
|-----------|----------|-----------|
| **Human → their agent** (root pico) | Is this the right person for this root? | **Passkeys / WebAuthn** — each root = its own relying party (see §9) |
| **Agent → the world** (pico → pico/service) | Which agent/pico is acting? | **DID/DIDComm** (§5) — did:webvh + did:peer (was SPIFFE, reconsidered 2026-07-10) |
| **Agent → external apps** | Third-party access | **OAuth** (agent as client / token holder) |

Keep these orthogonal but composed: the human unlocks their **agent** (root pico) with a passkey;
the agent then acts in the DID/DIDComm world on the human's behalf. A person is not a pico; a pico
is not an OAuth client — but the root pico **is the human's agent** (see §9), which unifies them.
(Earlier framing said user identity → "OIDC/session"; superseded by passkeys — see §9.)

### 1. Control model — parent/child hierarchy is the default
- The **parent→child hierarchy is the default mechanism for control** of a pico.
- Assumption: **whoever controls a pico also controls its entire child subtree.**
- Therefore the **root pico is exactly that — root**: control of the root implies control of the
  whole tree beneath it.

### 2. Multiple root picos per engine? (open)
- **Today:** one child tree (one root) per engine instance.
- **Question:** is that right, or should the engine support **creating multiple root picos**?
- **Attraction of multi-root:** identity simplifies to **one root per user** — the user↔pico
  mapping becomes a clean 1:1 at the root, and "who controls this subtree" follows directly from
  the control model in (1).

### 3. Pico identity is independent of user identity (but the root pico is the human's agent)
- Pico identity ≠ user identity. Today the engine has **no built-in mechanism for user identity**.
- **Resolved direction (§9):** the two planes interact via the **root-pico-as-agent** model — the
  human authenticates to their root pico with a **passkey**, and the root pico (which has a DID) acts
  as their agent in the DID/DIDComm world. Passkey establishes **who**; the control hierarchy (1)
  establishes **what** the resulting session may drive.

### 4. Pico identity via DID/DIDComm (SPIFFE reconsidered)
- **DID/DIDComm is now the direction for pico identity** (§5, turn 2026-07-10) — **did:peer**
  (relationships) + **did:webvh** (public/portable), both DIDComm-native. Portable,
  relationship-anchored, federation-free trust. SPIFFE set aside as backbone; KERI kept as a
  considered alternative (see §5).
- Unlike a SPIFFE path (domain/hierarchy-scoped, re-minted on move), a pico's **did:webvh SCID is
  stable and portable** — the pico's *position* in a tree (and even its host) can change while its
  identity continuity is retained.
- did:peer per subscription = the crypto upgrade of ECIs; did:webvh = the pico's ultimate,
  resolvable ID.

### 5. User/person ID is CORE — NOT behind a feature flag (revised 2026-07-10)
- **Superseded earlier thought:** originally proposed putting user identity behind a feature flag
  (opt-in). **Reversed** — **passkey authn + root-pico-as-agent (§9) is the ONLY way to use the
  engine.** Anyone using the pico engine gets a **registration screen initially**, creates an
  **account/passkey**, and then sees **their root pico** in the UI.
- No anonymous/`uiECI`-as-admin mode remains. This isn't a deployment option; it's the model.

### 6. Bootstrapping an engine with identity (direction set 2026-07-10)
- **Bootstrapping model (decided — see Layer 1 DETAILED PLAN):** engine boots with **zero roots**;
  a root is **created on passkey registration** (root-per-*account*, 1:1). The **first registration
  is the bootstrap** — no separate first-run setup token needed. Auth state (WebAuthn/credential/
  session/challenge stores) is an **engine primitive** that exists before any root.
  - How are roots created for additional users (self-serve vs admin), each as its own WebAuthn RP?
    → `allowSelfSignup` flag; first registration always allowed, then invite-gated if off.
  - Where do the pico key material / witness config (DID/DIDComm, §5) live at first boot, and how is
    the agent's DID key material passkey-gated?
  - **No feature-flag toggle** — this IS the boot path (§5, revised). Existing single-root engines
    **migrate**: adopt the current root as account/tenant #1 and require initial passkey registration.

### 7. Purpose split (summary)
- **User identity → UI access** — via **passkey → root-pico-as-agent** (§9).
- **Pico identity (DID/DIDComm, §5) → event-query API.**
- **OAuth → external access.**

### 8. Two kinds of rights: admin (hierarchy) vs conferred (policy) — Fuse precedent
Refinement of the control model (1), prompted by the Fuse "two owners" experiment
([windley.com, 2014](https://www.windley.com/archives/2014/10/fuse_with_two_owners.shtml)):

- **"Owner" is a RELATIONSHIP, not a hardwired attribute.** In Fuse, ownership was a
  **subscription** (the `FleetOwner` relationship between an owner pico and the fleet pico), so a
  fleet could have **two owners** simply by having two owner subscriptions. Multiple controllers
  fall out naturally from modeling control as a relationship rather than a single stored channel.
- **Fuse ran on the OLD, multi-tenant pico engine.** Allowing **multiple root picos** on today's
  engine (§2) essentially **re-introduces multi-tenancy** — one tenant per root.
- **Proposed split of rights:**
  - **Admin rights = the pico child tree.** The parent→child hierarchy confers administrative
    control over a subtree (create/delete children, install rulesets, etc.). This is the "root is
    root" model in (1).
  - **Other rights = conferred through POLICY**, based on a **subscription relationship** and the
    **tags on that subscription**. Non-admin capabilities (read reports, drive certain events,
    view state) don't require being in the control hierarchy — they're granted via a tagged
    subscription + channel policy. This is how a second "owner" gets rights without owning the
    subtree.

**Introduction pattern (Fuse, reusable):** a prospective owner is introduced to a target pico by
an existing owner, reusing standard inter-pico subscription machinery:
1. prospective owner asks the current owner for an introduction to the fleet;
2. current owner asks the fleet for a **new channel + name** for the prospective owner;
3. prospective owner subscribes to the fleet with that channel/name.
The fleet only issues introductions to a pico it already has the right relationship with
(`FleetOwner`), and only honors a subscription it created with the matching name/channel. Same
pattern generalizes to ownership transfer (drop the old subscription on completion).

**Routing lesson (multi-controller correctness):** with >1 controller, **don't use
`subscriptionList(...).head()`** or rely on stored/specific channels to reach "the owner" — you'll
send everything to whichever is first. **Look the peer up** (e.g. match the subscription whose
`backChannel` equals `meta:eci()`, or look up by pico name). General principle: resolve peers by
lookup, since ECIs can change. (Modern KRL analog: `io.picolabs.subscription` + filter on the
inbound channel, not `.head()`.)

### 9. User authn: passkeys + root-pico-as-agent (decided 2026-07-10)

**Decision:** do **not** route human admin authn through the DID channel directly. Use
**passkeys (WebAuthn/FIDO2)** for human→root authn, and treat **the root pico as the human's
agent** in the DID/DIDComm world. This is the synthesis of the user-identity + pico-identity planes.

#### The model
```
human  --passkey/WebAuthn-->  root pico (their AGENT)  --DID/DIDComm-->  the mesh world
        (available today)      holds did:webvh, keys, VCs,               (peers, services,
                               DIDComm connections                        other agents)
```
- **Passkey = the human's key to their agent.** Available today (every major OS/browser), device
  biometric-backed, phishing-resistant, no shared secrets; solid Node story
  (`@simplewebauthn/server`).
- **Root pico = the human's cloud agent.** It already has a did:webvh identity and can do DIDComm,
  hold VCs, sign, act asynchronously — so the human gets full DID/SSI presence **without a separate
  wallet app or touching raw DID keys.** (This is the original personal-cloud/CloudOS vision made
  concrete: your pico is your agent; you authenticate to it; it represents you.)

#### Why not the DID channel for human authn (directly)
DID-based human authn (DID Auth / SSI login) requires the person to run a **DID wallet/edge agent**
— the *least* available piece of infrastructure today (behind even passkeys). Root-pico-as-agent
sidesteps this: **DID Auth is what the agent does _outward_ on the human's behalf; the human's
_inward_ authn stays passkey.** One mechanism per direction, each using best-available tech. (So
"DID Auth for humans" is no longer a separate future authenticator — it's mediated by the agent.)

#### Why passkeys fit picos especially well
- **Each root pico = its own WebAuthn relying party (RP).** No central user DB, no IdP to operate,
  no password resets. The "user account" *is* the root pico + its registered passkey public keys.
- **Multi-tenancy needs zero shared user-identity infrastructure** — each tenant's root holds its
  own admin credentials. Same self-contained/self-sovereign property that makes picos picos.
- Supersedes the earlier "user identity → likely OIDC/session" note (OIDC implies an external IdP =
  centralization + availability dependency). **Prefer passkeys**; keep OIDC/DID-Auth as optional
  pluggable authenticators later.

#### Authn → authz split
- Passkey ceremony establishes **who** (human) → yields a UI **session**.
- The **control hierarchy** (1) establishes **what** the session may drive: the root's subtree
  (admin rights) + conferred rights via tagged subscriptions/VCs (8).
- Binding, not merging: the root's **DID** is its workload identity; the **passkeys** authorize the
  human controller of that root ("these credentials may act as admin of this root's DID").

#### Layering (engine ← wrangler ← manifold)
- **Engine (primitive):** WebAuthn registration/authentication ceremonies + credential (public-key)
  store; session issuance; passkey-gated unlock of the agent's DID key material.
- **Wrangler (OS):** register/authenticate flows, bind credentials to a root, issue/verify sessions,
  expose to KRL.
- **Manifold (framework):** "sign in", "add an admin" one-liners for mesh-app devs.

#### Risks & required design (do not ship without)
- **Key concentration / custodial risk.** The agent holds the human's keys + VCs, so compromise of
  the root pico (or its host engine) is high-stakes → **encryption at rest**, hardened engine,
  passkey-derived unlock so a stolen DB alone is insufficient.
- **Edge vs cloud agent.** Human **runs their own engine** → truly self-sovereign agent. **Provider
  hosts** the engine → *custodial* cloud agent unless keys are protected from the operator. State
  this as an explicit deployment choice.
- **Recovery is existential.** Losing the passkey = losing the whole agent → require **multiple
  registered passkeys** + a recovery path; **social/guardianship recovery** (SSI pattern, other
  agents help recover yours) is attractive here.
- **Agent portability = root migration.** Leaving a provider = migrating the root-pico agent to
  another engine: did:webvh portability keeps the DID (SCID retained); the passkey side needs
  **re-registration on the new engine's RP domain** (WebAuthn RP IDs are domain-scoped). So agent
  portability is real but includes a human re-enrollment step.
- **Optional phone edge agent.** A user *may* additionally pair a phone wallet with their root-pico
  cloud agent over DIDComm for on-the-go signing — additive, not required.

### Implementation phasing (layered rollout — plan 2026-07-10, **revised 2026-07-11**)

Build in **three layers** that match the architecture (engine ← wrangler ← manifold) and the
identity model (human authn → agent, then agent↔world DID, then external OAuth).

**Release plan (2026-07-11, updated 2026-07-14):** defer **Layer 2** (DID/DIDComm interchange
modernization) in favor of **Layer 3** (OAuth). **v1.5.0 + v1.5.1 shipped** (Layer 1 + Layer 3).
Layer 2 remains a large, cross-cutting migration — ship OAuth external access on the current
HTTP/ECI + passkey foundation first (HA testing next).

| Release | Scope |
|---------|--------|
| **v1.5.0** | Layer 1 ✅ + Layer 3 (OAuth AS on root-pico-as-agent; scoped tokens for **`/sky/*`**) ✅ **shipped** |
| **v1.5.1** | Channel editing (UI + wrangler); UI channel policy migration fix ✅ **shipped** |
| **Later** | Layer 2 — did:webvh/did:peer + DIDComm as primary interchange |

**Why skip Layer 2 for now:** OAuth delivers immediate value (third-party apps, Manifold integrations,
machine clients) without blocking on DID state migration. ECI + channel policy remain the pico
access model; passkeys gate the admin UI. Layer 2 can land when we're ready to unify transport.

Build order (revised):

1. **Layer 1** — passkeys + multi-root ✅ (1a–1d)
2. **Layer 3** — OAuth for external API access ✅ **shipped (1.5.0)**
3. **1.5.1** — channel edit + UI channel policy migration ✅ **shipped**
4. **Layer 2** — DID/DIDComm interchange ✅ **shipped in 1.6** — see § Layer 2 below

#### Layer 1 — User/admin identity via passkeys + multi-root
- **Passkey (WebAuthn) admin authn to the root pico** (§9); each root = its own relying party.
- **Support multiple root picos per engine** (§2) as part of this — i.e. multi-tenancy lands here.
- **"A lot of sticky little details"** expected in this layer, e.g.:
  - WebAuthn RP ID / origin configuration; credential public keys stored as an **engine primitive**
    (per account/root, not RS `ent:` / PDS); session issuance + verification; CSRF/origin handling.
  - **Bootstrapping = no root at startup; first registration creates root #1** (the setup-token
    dance is removed — see the DETAILED PLAN below).
  - **Root creation flow** for additional users (self-serve vs admin), each as its own RP.
  - **Recovery** — multiple passkeys + social/guardianship path.
  - Binding passkeys ↔ root DID; session → hierarchy authorization (who → what).
  - **NO feature flag — this is the only mode** (§5, revised). **Migration for existing single-root
    engines:** adopt the current root as account/tenant #1 and require initial passkey registration.

##### Layer 1 — DETAILED PLAN (2026-07-10)

**Node module choice: `@simplewebauthn/server` (+ `@simplewebauthn/browser` for the UI).**
- The 2026 default: v13.3.0 (Mar 2026), ~1.6M weekly dl, TypeScript-first, MIT, **Node 20+**
  (matches our CI). Handles challenge generation + registration/authentication verification,
  discoverable credentials (passkeys), all attestation formats.
- **Caveat (record):** essentially a **single-maintainer** project (bus-factor risk noted in 2026
  comparisons). Mitigate: pin the version; be willing to vendor.
- **Alternatives** if needed: `@passwordless-id/webauthn` (zero-dep, browser+node, not
  FIDO-conformance-certified), `fido2-lib` (lower-level, enterprise TPM attestation / NIST PKITS),
  `@passkeykit/server` (stateless signed-token challenges, built *on* SimpleWebAuthn). **Avoid**
  framework-coupled options (Passport, Auth.js pins old SWA, Lucia is deprecated) — we want a
  primitive, not a framework.
- **Architecture rule (matches "state = engine primitive"):** use SimpleWebAuthn **purely as the
  ceremony/verification library**. The **challenge store, credential store, and session store are
  engine primitives** — do NOT adopt the library's or a framework's storage.

**Engine state today (grounding — reviewed 2026-07-10):**
- **Single root.** `startEngine()` (`packages/pico-engine/src/index.ts`) uses `pf.rootPico` — a
  **singleton** root from `pico-framework`. It installs base rulesets (`pico-engine-ui`, `wrangler`,
  `subscription`, `did-o`, `pds`) onto that root **at boot**, then creates a channel tagged
  `["engine","ui"]`, fires `engine_ui setup`, and hands that **`uiECI`** to the static UI via
  `/api/ui-context`. **Possession of `uiECI` = full admin** — this is what passkeys replace.
- **Express server** (`packages/pico-engine/src/server.ts`): CORS `*`, Helmet CSP; routes are all
  `/c/…`, `/sky/…`, `/api/…`. Auth endpoints are **new engine-level routes** here, in front of the
  KRL routes.

**Refined bootstrapping model (decided 2026-07-10): no root at startup; root created at registration.**
- **Engine boots with ZERO roots.** No privileged first root installed at boot — every root is born
  from a registration, symmetrically. Multi-tenant is native; the special first-run **setup-token
  dance is removed** (the *first registration IS the bootstrap*).
- **Auth state lives at the ENGINE level** (it exists before any root does): WebAuthn service +
  challenge store + credential store + session store are engine primitives. (Consistent with §5's
  "auth/DID state = engine primitive".)
- **Base rulesets move to root-creation time** — `wrangler`/`subscription`/`pds`/(did) are installed
  when a root is provisioned (per registration), not at boot.
- **UI must serve with zero roots** — a bare register/sign-in screen; `/api/ui-context` returns
  "unauthenticated" until a session exists.
- **`uiECI` becomes per-root, derived from the session** (not a global handed to everyone).

**Critical distinction: root-per-ACCOUNT, not root-per-credential.**
Adding a 2nd passkey (phone / recovery key) is *also* a WebAuthn registration ceremony — it must NOT
create a new root. Introduce an **account** layer between credentials and the root:
```
account (= WebAuthn user handle, shared across passkeys)  ──owns 1:1──▶  root pico
   ├─ passkey credential #1 (laptop)
   ├─ passkey credential #2 (phone)
   └─ passkey credential #3 (hardware recovery key)
```
- The WebAuthn **`user.id` (user handle) = the account id**, **shared across all of that account's
  passkeys** — this is what groups them on the authenticator and what usernameless login resolves to
  → account → root.
- **New-account registration** (unauthenticated / bootstrap / invited): mint account id, **create
  the root**, install base rulesets, bind credential #1. Still capture a `displayName`/`name` so the
  OS passkey UI shows something meaningful.
- **Add-passkey registration** (authenticated): reuse the existing account id as user handle, set
  `excludeCredentials` to current creds, bind another credential. **No new root.**
- **Phase 1 rule: account ↔ root is 1:1.** "One human, many roots with one passkey" is the
  conferred-rights / relationship model → Layer 2 (DID + subscriptions), NOT here.

**Passkey management — separate read (whoami) from write (mutations):**
| Endpoint | Auth | Purpose |
|----------|------|---------|
| `POST /auth/register/options` + `/auth/register/verify` | none¹ | **new-account** ceremony → create root + credential #1 |
| `POST /auth/login/options` + `/auth/login/verify` | none | usernameless auth (discoverable creds) → sets session cookie |
| `POST /auth/logout` | session | end session |
| `GET  /auth/session` | session | **whoami** (read-only): account/root + **list of this account's passkeys** for the UI to render |
| `POST /auth/credentials/options` + `/auth/credentials/verify` | session | **add** a passkey to the current account (reuse user handle + `excludeCredentials`) |
| `DELETE /auth/credentials/:id` | session | **remove** a passkey — **guard against removing the last one** / require step-up |
| `PATCH /auth/credentials/:id` | session | rename/relabel ("MacBook", "YubiKey") |

¹ subject to the self-signup policy below. `GET /auth/session` stays idempotent; all mutations are
their own authenticated endpoints (so step-up on destructive ops is easy).

**Engine primitives to build:**
- **Credential store** (engine-owned, per account/root): `{credentialID, publicKey, counter,
  transports, label, createdAt}`.
- **Challenge store** (short-lived, per ceremony).
- **Session store** (`session → {accountId, rootPicoId, credentialID, expiry}`).
- **WebAuthn service** wrapping SimpleWebAuthn: `generate/verifyRegistration`,
  `generate/verifyAuthentication`; config = `rpID`, `rpName`, `expectedOrigin(s)`.

**Decisions to lock first (the "sticky details"):**
1. **RP ID strategy for multi-root** — (a) one shared RP ID = the engine's domain, partition tenants
   in app logic (simplest, one cert) vs (b) subdomain-per-root for WebAuthn-level isolation (more
   hosting/cert work). **Start with (a)**, document (b).
2. **Origin/RP config** — engine needs `rpID`, `rpName`, `expectedOrigin(s)` (derive from
   `base_url`). localhost OK for dev; **production requires HTTPS + a real hostname** (WebAuthn
   constraint). **Tighten CORS from `*` on auth routes.**
3. **Passkeys = discoverable credentials** (`residentKey: required`, `userVerification:
   preferred→required`) → usernameless login.
4. **Session model** — httpOnly + Secure + SameSite cookie backed by the engine session store
   (revocable), over stateless tokens.
5. **Self-signup policy** — first registration always allowed (bootstrap); then a flag
   (`allowSelfSignup`: off = further roots need an invite token; on = public multi-tenant).
6. **Serialize root creation** to avoid a race between two "first" registrations.

**Biggest open risks / load-bearing unknowns:**
- **`pico-framework`'s singleton `rootPico`** must tolerate **zero roots at start** and **N roots
  created dynamically**. **Explored 2026-07-10 → far more contained than feared** (see "Multi-root
  exploration" below). Storage + routing are already multi-tree-capable; the single-root assumption
  is localized to ~4 spots in `PicoFramework`.
- RP-ID-per-tenant vs shared (decision 1).
- How the authenticated session authorizes use of a root's channels/ECIs (session → hierarchy authz,
  ties to the "UI→pico authorization" open question below).
- **No feature flag — this is the only mode** (no-root-at-startup + passkey + multi-root replaces the
  old single boot-time root + `uiECI`-as-admin). **Migration for existing single-root engines:**
  adopt the current root as account/tenant #1 and require initial passkey registration. (The one
  remaining toggle is `allowSelfSignup` for *additional* roots, not for auth itself.)

##### Multi-root (0–N root picos) exploration — `pico-framework` (2026-07-10)
**Where the source lives:** `pico-framework` is a **separate published dep** (`^0.7.0`, github
`Picolab/pico-framework`), **cloned as a sibling repo** at
`/Users/pjw/Dropbox/prog/picolabs/pico-framework` (master @ 0.7.0, TS source in `src/`). The engine
consumes the compiled copy under each package's `node_modules/pico-framework`.

**Key finding: 0–N roots is a small, contained change — NOT a rewrite.**
- **Storage is already flat / multi-tree.** Picos persist under `["pico", …]`, channels under
  `["pico-channel", …]` (keyed by `picoId`), rulesets under `["pico-ruleset", picoId, rid]`.
- **Routing is already root-agnostic.** `lookupChannel(eci)` / `getPico(eci)` scan **all** picos
  (`this.picos` flat array) by ECI — no tree-walking, no root dependency.
- **A root = a pico with `parent === null`.** `Pico` constructor sets `parent = null` by default;
  only `newPico` (children) sets a parent. **Nothing prevents multiple parentless picos.**
- **`PicoEngineCore` never references `rootPico`** — it wraps the framework with its own per-`picoId`
  `CorePico` registry (already N-pico). The **only** real `pf.rootPico` consumer is
  `packages/pico-engine/src/index.ts` (boot: install base rulesets on the root + mint the single
  `uiECI`).

**The single-root assumptions are localized to 4 spots, all in `src/PicoFramework.ts`:**
1. `private rootPico_?: Pico` + `get rootPico()` (throws if unset) — lines ~53-59.
2. Startup reads a **single** `["root-pico"]` DB key → sets `rootPico_` — lines ~148-162.
3. Startup **auto-creates a root when none exists** (must STOP for 0-roots) — lines ~163-171.
4. **No public API to create additional roots** — `Pico.newPico` only makes children (sets
   `child.parent`); `addPico(pico)` already exists and just registers a pico in the flat list.

**SPIKE DONE ✅ (2026-07-10) — all edits in the sibling `pico-framework` (`src/PicoFramework.ts`,
`src/index.ts`); all tests green.**
- **Auto-create made a config option, NOT removed.** Added `PicoFrameworkConf.autoCreateRootPico`
  (**default `true` = historical behavior**). Refinement over the original plan: rather than deleting
  the startup auto-create (which would break the framework's own suite + other consumers), gate it —
  startup only auto-creates a root when `["root-pico"]` is absent **and** the flag is on. **The engine
  will pass `autoCreateRootPico: false`** to boot with zero roots.
- `rootPicos(): Pico[]` returns all picos with `parent === null` (derivation, no extra marker key).
- `rootPico` getter kept as **deprecated "primary root" shim** (throws with a clear message when
  none); `createRootPico(conf?)` mints a parentless `Pico`, persists `toDbPut()`, `addPico()`,
  installs optional rulesets, and records the **first** root as the back-compat `["root-pico"]`
  primary. Startup's auto-create path now just calls `createRootPico()`.
- `NewPicoConfig` exported from the package index for typed engine callers.
- **Tests (`test/multiRoot.ts`, 6 new):** zero-root boot (`numberOfPicos()===0`, `rootPicos()===[]`,
  `rootPico` throws); default auto-creates one (back-compat); `createRootPico()` ×2 → independent,
  routable, **isolated** state; each root has its own child tree; roots persist across restart (first
  stays primary); existing primary root loads even with `autoCreateRootPico:false` (**migration**).
- **Results:** `pico-framework` **37 passed** (incl. 6 new). Back-compat verified by dropping the
  built dist into the engine's 3 (non-hoisted) `pico-framework` copies: **`pico-engine-core` 19
  passed, `pico-engine` 27 passed** — engine behavior unchanged (it doesn't set the flag → default
  auto-create). (Dist-copy was a spike shortcut; real wiring needs proper link / published version.)
- **Deferred (not needed for spike):** a **root-deletion API** — `Pico.delPico` only deletes
  children; deleting a whole root/tenant tree is a separate future capability.

**Then wire into the engine (`packages/pico-engine/src/index.ts`):** pass `autoCreateRootPico: false`;
stop installing base rulesets at boot; install them at **root-creation** time (called by the
registration flow); serve UI with zero roots; derive per-session `uiECI`. **Existing single-root
engines migrate for free** — their current root already has `parent === null` + a `["root-pico"]`
key, so it's picked up as root #1 (verified by the migration test).

##### Phase 1a IMPLEMENTED ✅ (backend, 2026-07-10) — passkey auth + multi-root provisioning
Backend landed and green **without** breaking existing boot/UI (zero-root flip + UI rewrite deferred
to Phase 1b). Added `@simplewebauthn/server` v13.
- **New files (`packages/pico-engine/src/`):** `provisionRoot.ts` (`provisionRoot(pf, core, {root?})`
  + `uiECIForRoot`); `auth/webauthn.ts` (injectable `WebAuthnAdapter` over `@simplewebauthn/server`);
  `auth/AuthService.ts` (stores + service + `AuthError`); `auth/index.ts`; `test/auth.ts` (7 cases).
- **Modified:** `index.ts` (boot refactored to `provisionRoot`; constructs `AuthService`; new config
  `rpID/rpName/origin/allowSelfSignup/webauthn`; exposes `auth` on the engine), `server.ts`
  (`/auth/*` routes, cookie helpers, `/auth`-scoped credentialed CORS, session-aware `/api/ui-context`).
- **Stores = engine primitives in the framework DB** (`core.picoFramework.db`) under prefixes
  `["auth-credential", id]`, `["auth-account", id]`, `["auth-session", token]`; challenge store is an
  in-memory Map (5-min TTL). **Only public keys persist.** Auth code lives in the `pico-engine`
  package (keeps `@simplewebauthn/server` out of `pico-engine-core`) while state stays an engine
  primitive (not RS `ent:`).
- **account ↔ root:** WebAuthn `user.id` (user handle) **is** the `accountId`, shared across an
  account's passkeys; new-account `register/verify` provisions a **new root** (1:1); add-passkey
  reuses the handle with `excludeCredentials`, **no** new root (test-verified).
- **Cookies/session:** `pico-session` httpOnly+SameSite=Lax+Secure(when https), revocable DB store
  (30-day TTL); short-lived `pico-ceremony` cookie correlates options→verify. Discoverable creds
  (`residentKey: required`, `userVerification: preferred`); usernameless login resolves credential →
  account → root. rpID/origin derived lazily from `core.base_url` (overridable).
- **Self-signup:** `allowSelfSignup` (default true); first registration always allowed (bootstrap).
- **Tests:** `pico-engine` **34 passed** (7 new), `pico-engine-core` **19 passed**.

**Open review items (carry into cleanup):**
- ~~**Install shortcut:** `@simplewebauthn/server` copied into node_modules~~ **FIXED 2026-07-10:**
  restored root `package.json` (a botched `lerna bootstrap --hoist` had hoisted all deps into it
  and removed scripts); added `--nohoist=@simplewebauthn/*` to the bootstrap script (same pattern as
  `pico-framework`); `npm run bootstrap` now installs `@simplewebauthn/server` v13.3.2 canonically
  in `packages/pico-engine/node_modules`. Fresh setup: `npm run setup` (or `npm run bootstrap`).
- **Local pico-framework co-dev:** added `npm run link-framework` — builds the sibling repo and
  symlinks it into all three packages' `node_modules/pico-framework` (avoids `npm link` lifecycle
  issues). Run after bootstrap when working on multi-root changes before publishing framework.
- **Root-creation race:** no serialization/lock yet for two concurrent "first" registrations (MEMORY
  §decisions flagged this) — add a lock.
- **Confirm:** session persistence in the framework DB (chosen: revocable, survives restart) — OK.
- **Minor:** `add-credential` sends `label` in the same JSON body as the WebAuthn response; consider a
  nested shape.

##### Phase 1b IMPLEMENTED ✅ (zero-root boot + auth UI, 2026-07-10)
Fresh engines boot with **zero roots**; the browser auth gate is the only path to the mesh UI.
No anonymous/`uiECI`-as-admin access.

**Engine changes:**
- `autoCreateRootPico` defaults to **false** (`PicoEngineCoreConfiguration` → `PicoFramework`);
  boot does **not** call `provisionRoot` unless roots already exist (migration / tests opt in via
  `autoCreateRootPico: true` in `startTestEngine`).
- `uiECI` on the engine is `string | null`; `engine:started` fires only when a provisioned UI channel
  exists.
- `/api/ui-context` returns `{ version, hasRoots, allowSelfSignup, session, eci? }` — `eci` only when
  authenticated.
- Session middleware (`requireAuthSession`) on `/api/flush` and all **`/c/*`** (localhost exempt).
  **`/sky/*`** open to external callers (channel policy; `oauth-webhook` requires Bearer).
- `AuthService.allowSelfSignup()` exposed for the UI gate.

**UI changes (`packages/pico-engine-ui`, rebuild → `packages/pico-engine/public/`):**
- New: `App.tsx`, `AuthGate.tsx`, `authApi.ts`; `@simplewebauthn/browser` for ceremonies.
- **Zero roots → register ONLY** (no login toggle).
- **Has roots, not authenticated → login** (+ register when `allowSelfSignup`).
- **Authenticated → PicosPage** scoped to session root; **Logout** button calls `POST /auth/logout`.
- All API calls use `credentials: "include"`; Vite dev proxy forwards `/auth`.

**Tests:** `pico-engine` **35 passed** (incl. "fresh engine boots with zero roots until registration"),
`pico-engine-core` **19 passed**.

**Success test:** fresh `~/.pico-engine` (or empty DB) → start engine → browser → register screen
(no login) → passkey ceremony → see root pico → logout → back to login gate.

**Known gap (migration):** ~~existing DB with a root but zero auth accounts~~ **FIXED (Phase 1c,
2026-07-11):** `needsAuthMigration` + `/auth/claim/*` + UI "Claim with passkey" — links the primary
root (`["root-pico"]`) to the first account without minting a new root. Normal register is blocked
while migration is pending.

##### Phase 1c IMPLEMENTED ✅ (legacy auth migration, 2026-07-11)
Legacy single-root engines (root in DB, zero auth accounts) show a **claim** gate instead of login.
First passkey links to the existing primary root; mesh data is preserved.

- `AuthService.needsAuthMigration()`, `claimPrimaryRootOptions/Verify`
- `POST /auth/claim/options`, `POST /auth/claim/verify`
- `/api/ui-context.needsAuthMigration`
- Register blocked while migration pending (403)
- UI: "Claim with passkey" in `AuthGate`
- Optional `onAccountClaimed` sets root display name via `engine_ui box`

**Not in scope:** orphan second roots from mistaken pre-migration register; migration token hardening.

##### Phase 1d IMPLEMENTED ✅ (registration invites, 2026-07-11)
When `allowSelfSignup` is off (default), additional accounts require a **single-use invite link**
from a signed-in user.

- `AuthService.createInvite()`, `peekInvite()`; stored at `["auth-invite", token]` (7-day TTL default)
- `POST /auth/invites` (session-gated) — create invite; `GET /auth/invites/:token` — public peek
- Register accepts optional `{ invite: token }` when self-signup disabled and accounts exist
- Invite consumed on successful `registerNewAccountVerify`
- UI: `?invite=TOKEN` on auth gate shows register form; Settings → "Create invite link"
- `allowSelfSignup` default **false**; bootstrap (zero accounts) and legacy claim still work

#### Layer 3 — OAuth for external API access ✅ **shipped in 1.5.0** (+ channel edit in **1.5.1**)

**Goal:** third-party and machine access to **`/sky/*`** without passkey sessions or bare-ECI
capability URLs — while keeping ECI + channel policy as the authorization model.

**HTTP surface split (decided 2026-07-12):**

| Prefix | Role | External access |
|--------|------|-----------------|
| **`/sky/*`** | Public Sky interchange API (queries, events) | Yes — OAuth when mesh locked; channel policy |
| **`/c/*`** | Engine-internal channel HTTP binding | **No** — not part of the external API contract |

`/c/…` routes are engine primitives (same `core.event` / `core.query` as Sky, but the direct channel
path). They exist for in-engine use: KRL `ctx:event`/`event` with `host`, same-process round trips,
and the **session-authenticated UI** served by the engine. Third parties (HA, webhooks, Manifold apps)
must use **`/sky/*` only** — never `/c/*`.

**Today (gap — 3b.0 ✅ 2026-07-12):** `/c/*` requires passkey session (localhost exempt for in-engine
loops). OAuth bearer enforcement is on **`/sky/*` only** (webhook channels). **Planned 3b.1:** mesh
lock when root has OAuth ruleset.

**Two use cases, two grants (both may coexist in the same mesh):**

| Use case | Grant | Scope | Owner UI |
|----------|-------|-------|----------|
| **Webhooks** (M2M) | Client Credentials | **One channel / ECI** | Channels tab |
| **Apps** (HA, Manifold, etc.) | Authorization Code (+ PKCE) | **Root pico + descendants** | Settings → Connected apps (later) |

**Example — same sensor mesh, both grants:**

- **Home Assistant** (ACG): user redirects to engine for passkey consent; HA gets a token to query
  and control sensors across the whole mesh (`/sky/query/{any-eci}/…`, events on descendant channels).
- **Temperature notifier** (Client Credentials): dedicated `oauth-webhook` channel on a sensor pico;
  notifier mints a CC token and POSTs events to `/sky/event/{that-eci}/…` only. Channel policy can
  be events-only while HA has broader read/control via ACG.

**Not OAuth-eligible (engine hard block):** family channels (`familyChannelPicoID`), subscription
channels (tags like `wellknown_rx`, `tx_rx`, etc.), `system` channels.

##### Mesh-level OAuth gate (decided 2026-07-12)

**Rejected:** engine-wide flag (“all roots under OAuth or none”). Multi-root engines need per-mesh
policy.

**Decided:** **presence of an optional OAuth ruleset on the root pico** is the mesh OAuth switch.
Wrangler-adjacent KRL (**`io.picolabs.oauth`**), **not** installed by default — omitted from
`provisionRoot` `BASE_KRL_FILES`. Owner installs when they want OAuth for that mesh.

**Per-mesh configuration (decided 2026-07-12):** the OAuth ruleset is the **right place for mesh
OAuth configuration** — not engine env vars, not engine-wide settings. Configuration is **per mesh**
because it only applies when that ruleset is installed on the root (OAuth enablement and config
are the same opt-in). Examples of what belongs on the ruleset side (policy / UX / defaults):

- App registration metadata and consent policy (which apps, redirect URI rules, default scopes)
- Grant-root / mesh identity hints for ACG (`meta.oauth` or ruleset `config`)
- Mesh-local OAuth behavior toggles exposed via ruleset queries (wrangler shares)

**Engine still owns** ceremony, token/code/secret **storage** (framework DB), HTTP routes
(`/oauth/token`, `/oauth/authorize`), and bearer middleware — same split as passkeys (library +
engine primitives, not ruleset `ent:` for secrets). The ruleset **configures**; the engine **enforces**.

**When the OAuth ruleset is installed on a root:**

- **External** requests to **`/sky/*`** for ECIs in that root’s tree require a valid Bearer
  token — **no bare ECI access**.
- **UI exception:** passkey session cookie + ECI in session’s root tree → allow on **`/c/*`**
  (in-engine UI path; same `isEciInRootTree` pattern as `/api` routes).
- **Multi-root:** Root A with OAuth ruleset → locked subtree on `/sky/*`; Root B without → open
  (channel policy only), except per-channel `oauth-webhook` tags as today.

**Routing (not hard):** on each request, `lookupChannel(eci)` → walk to root pico → check
`root.rulesets[oauthRid]`. Same cost as existing session scoping. Optional cache
`rootPicoId → oauthEnabled`.

**Uninstall:** removing the OAuth ruleset re-opens the mesh to bare ECI (channel policy only);
revoke outstanding ACG tokens for that root.

##### Coexistence — ACG + webhooks in one OAuth mesh (decided 2026-07-12)

Both grant types share one token store and one bearer middleware; validation **branches on grant
type**:

| Token grant | Validation |
|-------------|------------|
| `client_credentials` | Token **bound to ECI in URL** (`token.channelEci === eci`); then channel policy |
| `authorization_code` | Token grant covers **pico subtree** under registered root; scopes + channel policy |

Token store: `["oauth-token", tokenId]` → `{ grant, channelEci?, rootPicoId, appId?, scopes?, expiresAt, … }`.

- Leaked webhook URL + CC token → one channel only; HA’s ACG token is a separate credential.
- Revoking HA app credentials vs webhook channel credentials is independent.
- Webhook senders that can call `/oauth/token` use CC; senders that cannot (Stripe-style) remain a
  separate concern (HMAC, etc.).

##### Node library choice (decided 2026-07-11)

**Target:** `@node-oauth/oauth2-server` (+ `@node-oauth/express-oauth-server` for Express).

Same architecture rule as passkeys (`@simplewebauthn/server`):

- Library handles **OAuth ceremony only** — grant parsing/validation, Client Credentials,
  Authorization Code, PKCE, standard error shapes.
- **Engine owns all state** via a custom **model adapter** (`PicoOAuthModel`): clients, secrets,
  tokens, codes, consent — stored in framework DB, not ruleset `ent:`.

**Implemented (2026-07-11):** v1.5 webhook slice uses a hand-rolled Client Credentials handler in
`OAuthService` (RFC-shaped `/oauth/token`); swap in `@node-oauth/oauth2-server` model adapter when
deps are wired. Dependencies listed in `package.json` but optional until integrated.

##### Layer 3a IMPLEMENTED ✅ (webhook Client Credentials, 2026-07-11)

- `OAuthService` — channel secrets (hashed), opaque `oat_…` bearer tokens, ECI binding
- `oauth:` KRL module (engine) + **`io.picolabs.oauth`** ruleset queries (`channelStatus`, `createChannelSecret`, …)
- `POST /oauth/token` (client_credentials); session-gated `/oauth/channels/:eci/*`
- Bearer middleware on **`/sky/*`** (external):
  - **Today (3a/3b.0/3b.1):** when channel has `oauth-webhook` tag **or** root has `io.picolabs.oauth` ruleset.
  - Validates CC token (ECI-bound) or ACG token (subtree).
- **`/c/*`:** session gate ✅ (3b.0); not OAuth bearer surface for third parties.
- Channels tab UI: create/rotate/revoke credentials; mint test tokens (secret → bearer)
- Eligibility: `oauth-webhook` tag; excludes family, subscription, system channels
- Tests: `npm run test:oauth`, `npm run test:http`

**Not yet:** `@node-oauth/oauth2-server` adapter integration.

##### Layer 3b.2 IMPLEMENTED ✅ (Authorization Code + PKCE, 2026-07-12)

- **App registry** — opaque `app_…` client IDs in DB; register/list/revoke via session-gated
  `GET/POST/DELETE /oauth/apps` (requires `io.picolabs.oauth` on root)
- **`GET /oauth/authorize`** — PKCE auth-code flow; passkey session + consent HTML; unauthenticated
  users redirect to `/?oauth_return=…` (UI resumes after login)
- **`POST /oauth/approve`** — session-gated consent form handler; redirects with `code` or `error`
- **`POST /oauth/token`** — dispatches `client_credentials`, `authorization_code`, `refresh_token`
- **ACG tokens** — grant type `authorization_code`; `validateSkyBearerToken` accepts any channel ECI
  under the app’s root mesh (subtree access for HA-style integrators)
- **Refresh tokens** — `ort_…`, 90-day TTL; rotation on refresh
- **Settings UI** — OAuth apps section (name, redirect URIs, public/confidential client)
- Tests: `npm run test:acg`, `npm run test:http`

##### Layer 3b.0 IMPLEMENTED ✅ (HTTP surface split, 2026-07-12)

- **`/c/*`** — passkey session required (localhost bypass default; `PICO_ENGINE_ALLOW_LOCALHOST_C=0` to disable)
- **`/sky/*`** — OAuth bearer when `oauth-webhook` tag or mesh OAuth ruleset (3b.1)
- `meshRequiresOAuth(eci)` helper + `OAUTH_MESH_RULESET_RID`
- Tests: `npm run test:http`

##### Layer 3b.1 IMPLEMENTED ✅ (mesh OAuth gate, 2026-07-12)

- **`io.picolabs.oauth.krl`** — optional ruleset (not in default provision); install on root to lock mesh; **home for per-mesh OAuth config** (app registry lives in engine DB; ruleset is the mesh lock marker)
- **`skyRequiresBearer(eci)`** — true when `oauth-webhook` tag **or** root has `io.picolabs.oauth`
- **`validateSkyBearerToken`** — CC tokens ECI-bound; ACG tokens validate subtree (3b.2 ✅)
- **`io.picolabs.oauth`:** `meshEnabled()`, `meshRequiresOAuth(eci)`, webhook credential queries; engine `oauth:meshRequiresOAuth`
- Token records include `grant` (`client_credentials` | `authorization_code`)

**Not yet:** `@node-oauth/oauth2-server` adapter integration.

##### Tokens (decided 2026-07-11 — real tokens, not ECI)

**Do not** return the ECI as `access_token` (legacy `io.picolabs.oauth_server` did this).

- **`access_token`:** opaque bearer, e.g. `oat_` + base64url; minted by engine on successful grant.
- **ECI stays in the URL** (`/c/{eci}/…`, `/sky/query/{eci}/…`) — required for routing and fixed
  webhook URLs.
- **Bearer middleware (webhook channels today):** on **`/sky/*` only**, when a channel has the
  `oauth-webhook` tag, require
  `Authorization: Bearer <token>` on every request (locked even before credentials exist);
  verify token is valid, unexpired, unrevoked, and **bound to the ECI in the URL**; then apply
  channel policy as today.
- **Bearer middleware (OAuth mesh, planned):** when root has OAuth ruleset, require Bearer on
  **`/sky/*`** for external callers; accept CC (ECI-bound) or ACG (subtree) tokens.
- Token store: `["oauth-token", tokenId]` → `{ channelEci?, rootPicoId, grant, appId?, scopes?, expiresAt, … }`.
- TTL chosen at mint time (`expires_in` on `/oauth/token`, including `0` = never); revoke/rotate from
  Channels tab or Connected apps.

##### Webhooks — Client Credentials (per channel)

**Programmer specifies** at channel creation (KRL):

```krl
wrangler:createChannel(
  ["oauth-webhook", "stripe"],
  { allow: [{domain: "stripe", name: "*"}], deny: [] },
  { allow: [], deny: [{rid: "*", name: "*"}] }   // events only, typical for inbound webhooks
)
```

**Credentials:**

| Field | Source |
|-------|--------|
| `client_id` | **The channel ECI** (one OAuth client per webhook channel) |
| `client_secret` | Owner clicks **Create credentials** in Channels tab; shown once; stored **hashed** |
| `access_token` | Minted at `POST /oauth/token` (`grant_type=client_credentials`) |

Channel credential store: `["oauth-channel", eci]` → `{ secretHash, rootPicoId, createdAt, … }`.

Secrets are **not** auto-created when the channel is created — explicit owner action.

**Updating existing channels (1.5.1):** use Channels tab **Edit channel** or
`wrangler:updateChannel` / `channel_update_request` to add `oauth-webhook` (or change policies)
without rotating the ECI.

**Management UI:** extend **Channels tab** (not Settings) for eligible channels: create credentials,
copy client_id/secret, revoke secret, revoke active tokens.

**Programmatic API:** engine **`oauth`** module + **`io.picolabs.oauth`** ruleset shared queries
(ruleset on root; admin subtree check; engine enforces eligibility):

- `channelStatus(eci)` — `{ eligible, enabled, clientId, hasSecret, … }`
- `createChannelSecret(eci)` — returns `{ client_id, client_secret }` once
- `revokeChannelSecret(eci)` / `revokeTokens(eci)`
- `meshEnabled()` / `meshRequiresOAuth(eci)`

Channels tab uses HTTP routes; rulesets use `io.picolabs.oauth`; external integrators call `POST /oauth/token` only.

**Inbound webhook note:** many senders (GitHub, Stripe) POST to a fixed URL and won't call
`/oauth/token`. OAuth Bearer protects against **URL/ECI leakage**; integrators that can send
`Authorization` use the token flow. HMAC verification (Stripe-style) is a separate optional concern.

##### Apps — Authorization Code (root pico + descendants)

**Primary motivating app:** Home Assistant as front-end to a Manifold pico mesh — HA holds engine
URL, redirects user to `/oauth/authorize`, passkey authn + consent, redirect back with code; HA
exchanges at `POST /oauth/token` and uses Bearer on **`/sky/*`** across the mesh (not `/c/*`).

**Design (decided 2026-07-12):**

- App registration: `client_id` = opaque app id (`app_…`), not the ECI; stored per root mesh.
- User consent (passkey session) scopes grant to **root pico + descendants**.
- Optional OAuth ruleset on root enables mesh lock + **hosts mesh OAuth configuration** (wrangler-adjacent,
  not in default provision).
- `/oauth/authorize` routing: resolve mesh via **app registration** (`client_id` → `rootPicoId`), not
  ECI in API calls.
- Token binds to app grant metadata (subtree + scopes), not a single channel ECI.
- Ruleset `meta.oauth.grantRoot: true` may mark alternate grant roots within a mesh (TBD; likely
  ruleset config under `io.picolabs.oauth`).

**Open channels (no OAuth ruleset on root):** bare ECI in URL works as today (channel policy only),
except channels tagged `oauth-webhook` (always require Bearer).

Details TBD when implementing; webhook Client Credentials shipped first (Layer 3a ✅).

##### HTTP surface

- `POST /oauth/token` — public; Client Credentials, Authorization Code, Refresh Token
- `GET /oauth/authorize` — Auth Code + PKCE redirect flow ✅
- `GET/POST/DELETE /oauth/apps` — session-gated app registry ✅
- Bearer middleware on **`/sky/*`** — see mesh gate + coexistence sections above
- **`/c/*`** — session-gated ✅ (3b.0); internal/UI only
- `/api/flush` and mesh UI remain passkey-session-gated (Phase 1)
- Legacy reference: `packages/pico-engine/legacy/oauth_server.js` + `io.picolabs.oauth_server.krl`
  (single-root, ECI-as-token — do not copy verbatim)

##### Sky path note (2026-07-11)

Canonical Sky query path is **`/sky/query/`** (docs); **`/sky/cloud/`** kept as legacy alias.
Wrangler `picoQuery`/`skyQuery` default path updated to `/sky/query/`.

#### Layer 2 — did:webvh / did:peer + DIDComm as the interchange ✅ **shipped in 1.6**
- **Build on the existing engine `dido` module** (did:peer:2 + DIDComm v2 already present — see
  "Existing engine support" in §5). **Update/modernize** it and **add did:webvh**.
- **NO separate wrapper ruleset.** Fold `io.picolabs.did-o`'s capabilities (routing, send/query,
  DID management, invitations, rotation) **into wrangler core** — DIDComm is primary, not a
  bolt-on. Retire the standalone `io.picolabs.did-o` ruleset + its sibling-install wiring.
- **DID state → engine primitive.** Move DID material (keys/secrets, DID docs, did map, pending
  rotations, routes) out of RS-scoped `ent:` into **engine-owned per-pico state**; **private keys
  engine-held, never returned to KRL** (KRL gets sign/pack/unpack/resolve/rotate capabilities).
  Migrate existing did-o `ent` state on upgrade.
- **Use DIDComm for ALL pico-to-pico interchange** instead of raw HTTP/S — notably **update
  `picoQuery()`** (and event:send paths) to go over DIDComm. (Today DIDComm rides over HTTP to sky
  endpoints and the DID path is only for DID-addressed queries; picoQuery also has a local
  `ctx:query` path for family channels — unify on DIDComm.)

**Original dependency order (2026-07-10):** Layer 1 → Layer 2 → Layer 3. **Revised (2026-07-11):**
Layer 1 → Layer 3 (v1.5) → Layer 2.

### Open questions raised by this framing
- **Multi-root = multi-tenant:** multiple roots re-introduce the old engine's multi-tenancy (one
  tenant per root). Shared registries (tag/skills) are handled by a separate **Manifold platform
  tree** that tenants use via subscription — see "Shared infra" below (resolves the earlier
  "layer above root" tension).
- **Admin vs conferred rights (8):** confirm the split — hierarchy grants **admin** rights;
  everything else is granted by **tagged subscription + policy**. What is the minimal set of
  "admin-only" operations reserved to the hierarchy vs delegable via policy?
- **How conferred-rights policy is expressed:** subscription **tags** drive capability today
  (informally). Formalize tag→capability mapping — and how it maps onto the channel-policy fix
  (§4) and Cedar (§5). Is a subscription tag effectively a role/permission grant?
- **Co-controlled roots vs one-root-per-user:** "owner is a relationship" (8) means a subtree can
  have multiple controllers even under one root — so strict 1:1 user↔root may be unnecessary.
  Decide: is multi-root for *tenancy isolation*, while multi-controller (subscriptions) handles
  *shared control* within a tenant?
- **UI→pico authorization:** once a user is authenticated (passkey → agent, §9), how does the engine
  decide which picos/events the UI session may drive? Two sources: (a) hierarchy from the user's root
  (admin), (b) conferred rights via subscriptions/VCs the user's agent holds (8).
- **Introduction/onboarding of additional controllers:** adopt the Fuse introduction pattern
  (existing owner brokers a new channel+name to the newcomer) as the standard way to add a
  second controller to a pico/subtree; for humans, register an additional passkey (§9).
- **Where user identity lives:** resolved toward **root-pico-as-agent** (§9) — credentials live on
  the root pico (each root = its own WebAuthn RP), not a central table or external IdP. Legacy
  google/github signin rulesets were moved to `OLD/` in manifold-api.
- **Recovery model (§9):** multiple passkeys + social/guardianship recovery — needs a concrete design.
- **Migration for existing single-root engines:** passkey authn is **not** flag-gated (§5, revised)
  — it's the only mode. Concrete migration = adopt the current boot-time root as account/tenant #1,
  then require the operator to register the first passkey (bootstrap) before regaining UI access.

### Shared infra: a "Manifold platform" tree, used via subscription (direction 2026-07-10)
> **Layer note:** this is a **Manifold-consumer scenario** (see "FOUNDATIONAL: the three-layer
> stack"), not part of the engine/wrangler primitive design. It's recorded to confirm the
> primitives + wrangler affordances make it *possible* — not to shape them.

Resolves the earlier "layer above root" tension. **Decision/direction:** do NOT put shared infra
in an engine-owned layer above roots. Instead:

- **A Manifold *platform* runs the shared registries (tag / skills) in its OWN tree** (its own
  root, its own child hierarchy — just another tenant, architecturally).
- **Other Manifold instances (tenant roots) USE those registries via SUBSCRIPTIONS** — i.e. via
  the **conferred-rights** path (8), tagged subscriptions + policy, not via a common parent.

Consequences / why this is nice:
- **Keeps "root is root" intact** (1) — no engine-owned namespace above roots; roots stay peers.
- **Multi-root stays pure tenancy isolation**; cross-tenant sharing is *always* a subscription
  relationship (consistent with "owner is a relationship" and the introduction pattern).
- **Uniform mechanism** — platform services and peer picos are reached the same way (subscription
  + tags + policy); nothing special-cased for "system" infra.
- The Manifold platform tree could itself be **on the same engine** (another root) or a **remote
  engine** — the latter is handled by cross-mesh DID/DIDComm trust (§5), no federation needed.

Open sub-questions:
- **Bootstrapping the dependency:** how does a fresh tenant root discover + subscribe to the
  platform's registries at creation (introduction via the platform, or a well-known
  platform ECI/URL in engine/tenant config)?
- **Trust:** the platform must only honor registry subscriptions from legitimate tenants — the
  Fuse rule "only introduce/subscribe peers you already have the right relationship with" applies;
  DID verification (did:webvh log/witnesses) + Verifiable Credentials (§5) are the natural
  cross-mesh enforcement (no federation needed).
- **Availability/coupling:** tenants now depend on the platform tree for registry lookups —
  consider caching / degraded-mode behavior if the platform (esp. remote) is unreachable.

### Worked scenario: cross-mesh pico adoption (the "R1T" transfer, 2026-07-10)
**Setup:** Phil runs a Manifold mesh on engine A; under his vehicle *community* pico is a pico for
his **Rivian R1T**. Phil sells the R1T to Dave, who runs his own Manifold mesh on **engine B**.
Dave wants to **adopt the R1T pico into his mesh** — it should *leave* Phil's mesh and *end up in*
Dave's. (Data migration is explicitly a **separate problem**.)

**Decompose "adopt" into three problems:**

| Sub-problem | Question | Status |
|-------------|----------|--------|
| **Cross-mesh trust** | Can B believe a request truly comes from Phil's R1T/owner on A (and vice versa)? | ✅ **DID/DIDComm native** — verify the did:webvh log from the SCID (+ optional witnesses) and DIDComm-signed messages; **no federation needed** (why we dropped SPIFFE, §5) |
| **Authorization + consent** | May Phil release? May Dave adopt? | ✅ control model + conferred-rights/policy + Fuse introduction pattern; two-sided human consent via user-identity layer |
| **The actual move** | Pico leaves engine A, exists on engine B | ⚠️ **pico migration/portability** — new capability = network-mirror machinery made federation-aware (mirror → rewire → delete). See roadmap §7 |

**Identity continuity:** with DID/DIDComm the pico **keeps its did:webvh SCID + history** across
the move (portability moves host/path only; requires `portable: true` at inception). Its
*hosting/admin position* changes (new parent in Dave's mesh) but its **identity continuity does
not** — so provable "same R1T". (Under the abandoned SPIFFE model the ID would have been re-minted,
breaking continuity.) If the physical vehicle also carries an object DID/tag (SafeAndMine), it
re-binds to the pico's DID.

**What happens to R1T's relationships** (applies the survivability taxonomy in §5):
- **Parent–child** to Phil's vehicle community → **severed**; new parent = Dave's vehicle community.
- **Community-membership subscription** (Phil's community) → **swapped**: delete it, create a new
  subscription to Dave's community.
- **Battery-health service subscription** → **survives**: the DIDComm connection persists (SCID
  continuity); R1T sends a **DIDComm DID Rotation** so the service reaches it at its new location.

**End-to-end flow:**
1. **Handshake** — Dave's mesh requests adoption (or Phil offers release); event authenticated via
   DIDComm-signed messages (did:webvh log-verifiable, no prearranged trust).
2. **Consent** — Phil (UI admin) approves release; Dave (UI admin) approves adoption.
3. **Introduce/authorize** — Phil's owner pico brokers a transfer relationship to Dave's mesh
   (Fuse introduction pattern); policy scoped to Dave's mesh DID.
4. **Move** — engine B instantiates the R1T pico under Dave's vehicle community (rulesets,
   channels), relocating its did:webvh log (SCID retained) + keys. *(Data separate.)*
5. **Rewire** — establish Dave's community↔thing subscription; tear down Phil's; endpoint-rotate
   the surviving service subscriptions.
6. **Finalize** — engine A deletes the old R1T (`child_deletion_request`); it leaves Phil's mesh.

**Verdict:** the model accommodates it, and it validates the layering — trust + authz drop in, and
"adopt a pico from another mesh" is exactly a Manifold-framework one-liner over the primitives.
It surfaced two engine capabilities to make explicit: **pico migration/portability** (roadmap §7)
and **SCID-anchored surviving relationships via DIDComm DID Rotation** (§5).

---

## KRL conventions & gotchas (engine-behavior reference)

Reference: [Postlude](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189919/Postlude)
(Picolabs KRL Manual).

### Rule structure
```
select when ...
pre { ... }            // prelude: NAME DECLARATIONS (not assignment)
if ... then every { }  // action block (ONE only; no action-level else)
fired { ... }          // postlude — ONE postlude only
```
A rule **fires** when selected AND the action condition is true. Side effects (persistent vars,
raises, logging) run in the postlude, not the action block.

### Postlude
- **One postlude only** per rule: pick one of `always` / `fired` / `notfired`
  (with optional `else`, and optional trailing `finally`). You cannot write `fired { }` followed
  by a separate `notfired { }`.
- **`if X then noop(); fired { }` runs `fired` when X is TRUE** (not when false).
- `event:send` belongs in the **action block**, not inside `fired`.
- Forms: `always {}`, `fired {}`, `notfired {}`, `fired {} else {}` (else = did NOT fire),
  `notfired {} else {}` (else = DID fire), optional `finally {}`.

### Prelude = name declarations, not assignment
- `name = expr` binds for the rule; re-declaring does NOT imperatively update.
- Do NOT "reassign" to refine: `pending = ...; pending = pending || fallback` is wrong.
- Prefer direct path access: `name = ent:pending{rcn}{"name"} || event:attr("name")`.
- Postlude `:=` on entity vars **is** assignment.

### Entity variable updates — composite paths
```krl
ent:things := ent:things.defaultsTo({});
ent:things{picoID} := obj_structure;
ent:things{[picoID, "name"]} := changedName;      // composite path for nested keys
ent:things{picoID}{"name"} := changedName;        // PARSE ERROR — chained paths
```
Prefer path assignment over `.put()`.

### Wrangler 1.0 child deletion
```krl
raise wrangler event "child_deletion_request" attributes { "eci": picoID }
```
NOT legacy `wrangler child_deletion` with `{ "id": picoID }` — unhandled in pico-engine 1.0
wrangler (event sits on the schedule and never runs).

### `picoQuery` vs `skyQuery`
- `wrangler:skyQuery` is **deprecated** and only does HTTP; pico-engine v1.x **blocks HTTP on
  FAMILY channels** (parent↔child).
- `wrangler:picoQuery` (same params/order, drop-in) uses `ctx:query()` locally on the same host,
  so it works over family channels. Error-map key changed: `skyQueryError` → `picoQueryError`.

---

## Engine environment variables (doc registry)

> **Purpose:** canonical list for future user-facing docs (`README`, operator guide). Update this
> table when adding new `process.env` knobs. Also mirrored in `packages/pico-engine/src/cli.ts`
> (`--help`) and `packages/pico-engine/README.md` (Configuration).

| Variable | Default | Since | Purpose |
|----------|---------|-------|---------|
| `PORT` | `3000` | 1.x | HTTP listen port. |
| `PICO_ENGINE_HOME` | `~/.pico-engine/` | 1.x | Database, logs, ruleset cache directory. |
| `PICO_ENGINE_BASE_URL` | `http://localhost:$PORT` | 1.x | Public URL prefix (WebAuthn RP origin, did:webvh, links). |
| `PICO_ENGINE_ALLOW_SELF_SIGNUP` | off (`false`) | Phase 1 | `"true"` / `"1"` = open registration after bootstrap; default invite-only. |
| `PICO_ENGINE_ALLOW_LOCALHOST_C` | on (any value except `"0"`) | 3b.0 (2026-07-12) | Set to `"0"` to require passkey session on **`/c/*`** even from localhost. Default allows localhost without session so KRL `ctx:event` / `event` loops that POST to `host/c/…` keep working. Tests set `"0"` to simulate external callers. **Security note:** with default, any local process can hit `/c/*` without login; tighter internal token TBD. |

**Not operator-facing:** `NODE_ENV=test` affects log formatting in tests only.

**Testing / demo `PICO_ENGINE_HOME`:** always under **`/tmp`** — e.g. `/tmp/pico-engine-a` and `/tmp/pico-engine-b` for manual cross-engine demos, `/tmp/pico-engine/{cuid}` for automated tests (`packages/pico-engine/test/helpers/tmpHome.ts`). Do not use `~/.pico-engine` for tests or throwaway demos.

---

## Layer 2 (1.6) — engine progress

**Work plan:** [`docs/design/pico-identity-layer2-work.md`](docs/design/pico-identity-layer2-work.md)

| Epic | Status |
|------|--------|
| 3–4 Identity + DIDComm ingress | ✅ |
| 5 Subscription ruleset (layer2) | ✅ same-engine + cross-engine |
| 6 Wrangler / event:send / did-o retired | ✅ |
| 7 Channel policy on DIDComm delivery | ✅ |
| 7b Subscriptions UI | ✅ — layer2 create, identity panel, inline Rx policy, forest view |
| 8 Cross-engine subscriptions | ✅ |
| 9 Testing & CI | ✅ `test:epic9`, `test:cross-engine`, layer2/identity suites |
| 10 Documentation & release | ✅ drafts in repo; version bump + npm publish pending |

**Identity model (1.6):** **did:webvh** for intros and portable pico identity; **did:peer** for established subscription pairwise traffic. SKY over DIDComm cross-engine; verified local dispatch intra-mesh.

**pico-framework 0.8.1:** optional custom channel ECI at creation (UI New Channel); engine-wide uniqueness via `eciIsTaken`.

**Epic 9 (`npm run test:epic9`):** legacy ECI sub, family picoQuery, public intro, SCID tamper, DIDComm pack/unpack, layer2 E2E, OAuth eligibility. **Deferred post-1.6:** did:peer:4, cross-mesh move (1.7+).

**Subscriptions UI:** `Subscriptions.tsx` — layer2 create, `myDid`/`publicIntro`, off-engine forest sink, cancel outbound, copy myDid. Rebuild UI after changes: `cd packages/pico-engine-ui && npm run build`.

---

## Subscriptions → relationships (nomenclature + rename)

- **Design guide:** [`docs/design/pico-relationships.md`](docs/design/pico-relationships.md) —
  correct mental model (pairwise, bidirectional, introduced, policy-gated, long-lived, typed),
  family vs graph edges, ReBAC direction, combined **UI + wrangler alias** rename plan (~1 day,
  ruleset RID `io.picolabs.subscription` unchanged). Windley 2020 SSIoT truck essay is the narrative
  precedent. **ReBAC:** community/Manifold layer (Fleet RS sketch in design guide), not engine
  enums. **Default wrangler type `peer`:** baseline Rx policy on every relationship —
  [`pico-relationships.md` § peer](docs/design/pico-relationships.md#default-relationship-type-peer).
  **Graph + policy in RS:** relationship record is the ReBAC graph; enrich KRL policy in rulesets
  (not external Cedar/SpiceDB files) — see design guide § relationship record as the graph.
  **DIDComm Discover Features** (pre-intro): planned —
  [`sky-didcomm-protocol.md` §17](docs/design/sky-didcomm-protocol.md#17-didcomm-discover-features-planned)
  (distinct from integrator discovery channel).

---

## Cross-references
- **Pico relationships (nomenclature + rename plan, 2026-08-12):**
  [`docs/design/pico-relationships.md`](docs/design/pico-relationships.md)
- **Pico move / export-import design (2026-07-17):**
  [`docs/design/pico-move.md`](../docs/design/pico-move.md) · GitHub
  [#659](https://github.com/Picolab/pico-engine/issues/659)
  [#664](https://github.com/Picolab/pico-engine/issues/664)
  [#665](https://github.com/Picolab/pico-engine/issues/665)
- **Manifold / sensor-network context (source of truth):**
  `/Users/pjw/Dropbox/prog/picolabs/manifold-api/MEMORY.md`
- **Home Assistant / Manifold POC:**
  [`manifold-home-assistant`](../manifold-home-assistant) ·
  [`manifold-home-assistant/MEMORY.md`](../manifold-home-assistant/MEMORY.md) ·
  `docker-compose.yml` (engine + HA, `/var/picolabs` mount) · hub `custom_components/pico_mesh` ·
  companion `pico_mesh_sensor_network` in [`sensor-network`](../sensor-network)
- **PDS source:** [`PDS.krl`](https://github.com/Picolab/wrangler/blob/master/PDS.krl) in
  [Picolab/wrangler](https://github.com/Picolab/wrangler).
- **Fuse PDS-as-platform precedent:** `/Users/pjw/prog/kynetx/Fuse-API/api`
  (`fuse_bootstrap.krl`, `fuse_init.krl`, `fuse_fleet.krl`, `fuse_vehicle.krl`, `fuse_common.krl`).
- **CloudOS PDS (three-layer model):**
  `/Users/pjw/prog/kynetx/cloudos/PDSService/a169x676.krl`.
- **Identity (DID/DIDComm, §5):**
  [did:webvh spec (DIF v1.0)](https://identity.foundation/didwebvh/v1.0/) ·
  [did:webvh info](https://didwebvh.info/) ·
  [`didwebvh-ts`](https://github.com/decentralized-identity/didwebvh-ts);
  did:peer + [DIDComm v2](https://identity.foundation/didcomm-messaging/spec/v2.1/); W3C Verifiable
  Credentials. **Considered alternative:** [KERI / WebOfTrust](https://github.com/WebOfTrust)
  (`signify-ts`, KERIA, `keripy`) — see §5.
- **User authn (passkeys, §9 of identity):** [WebAuthn](https://www.w3.org/TR/webauthn-3/) /
  [passkeys](https://passkeys.dev/) · [`@simplewebauthn/server`](https://simplewebauthn.dev/) —
  each root pico is its own relying party; root-pico-as-agent for DID/DIDComm.
- **Existing engine DID/DIDComm support (Layer 2 starting point):**
  `packages/pico-engine-core/src/modules/dido.ts` (`dido` module, uses `didcomm-node`),
  `packages/pico-engine/krl/io.picolabs.did-o.krl` (alias `didx`); did:peer:2 + DIDComm v2 +
  DID Rotation + OOB invites; `wrangler:picoQuery` already has a DID path.
