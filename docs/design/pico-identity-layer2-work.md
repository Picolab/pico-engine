# Layer 2 identity — work plan (1.6)

**Status:** draft (2026-08-01)  
**Context:** Implement DID/DIDComm inter-pico identity and communication for pico-engine **1.6**, replacing ECI-as-identity for **new subscriptions** while preserving the existing channel permission model. Based on [pico-identity-libraries.md](./pico-identity-libraries.md), [MEMORY.md §5](../../MEMORY.md), and scoping interview (2026-08-01).

**Related:** [pico-move.md](./pico-move.md) · [one-summit-japan-2026-cfp.md](./one-summit-japan-2026-cfp.md)

---

## Decisions (from scoping interview)

| Topic | Decision |
|-------|----------|
| **Inter-pico address (new subs)** | **did:peer:4** replaces Tx/Rx ECIs as the subscription address; DIDComm carries events and queries |
| **Portable pico identity** | **did:webvh** per pico (`portable: true` at inception) |
| **Legacy subscriptions** | **New subs only** — existing ECI-only subscriptions unchanged; no migration required (few/no production subs) |
| **Family channels** | **Unchanged for 1.6** — `familyChannelPicoID` + engine-internal `fromPicoID` gate; no DIDComm, no door verify |
| **System / engine UI channels** | **Unchanged for 1.6** — tags `system`, `engine,ui`; no DIDComm |
| **Regular policy channels** | Existing event/query policy **unchanged**; caller DID recorded when present on DIDComm ingress |
| **Engine-door verify (1.6)** | **DIDComm** (cross-mesh / cross-engine); **verified local dispatch** (intra-mesh only) |
| **Intra-mesh subscriptions** | **No DIDComm** — keep `ctx:query` / local event when caller + recipient share **mesh root**; engine verifies caller + sub binding |
| **Cross-mesh subscriptions** | **Always DIDComm** — even if two meshes share one engine process (multi-tenant) |
| **DIDComm ingress** | **One per pico** (not per subscription) — route inbound by sender peer DID |
| **Libraries** | Greenfield module per [pico-identity-libraries.md](./pico-identity-libraries.md) — do not extend `dido.ts` |
| **Milestone** | **Release 1.6** — production Layer 2 for new subscriptions + webvh provisioning |
| **webvh provisioning** | **Every pico** at create — uniform; no second-class picos |
| **Public intro** | **Opt-in** via wrangler (`publicIntro`); **on by default for root only**; any pico may enable (e.g. tag registry) |

---

## Usage model: webvh vs peer vs OAuth

Three mechanisms, three audiences — **Layer 3 is not replaced by DIDs.**

| Mechanism | Role | Audience | Typical traffic |
|-----------|------|----------|-----------------|
| **did:peer:4** | Pairwise relationship identity | Picos with an established subscription | **Workhorse** — events, queries between subscribed picos |
| **did:webvh** | Portable public identity record (SCID + log) | Anyone who needs to resolve "who is this pico?" | Low volume, high importance — intro, move, credentials, stable references |
| **OAuth + ECI** | Integrator authorization + channel capability | HA, webhooks, MCP, external HTTP clients | **How most of the world integrates** — unchanged in 1.6 |

**Mental model:**

- **did:webvh** = the actor's **passport** (exists for every pico; public *introduction* is opt-in)
- **did:peer** = the **phone number for one relationship** (private, per subscription)
- **OAuth + ECI** = **API key to a specific door** (integrator, not pico)

### What did:peer is for (daily traffic)

- All **ongoing** inter-pico communication on a subscription
- Established at introduction: exchange long-form did:peer:4 → use short-form thereafter
- Private — no cross-subscription correlation

### What did:webvh is for

| Use | 1.6 priority |
|-----|--------------|
| **Portable SCID** — identity survives move/export (peer rotation follows) | Provision always; move in 1.7+ |
| **Public introduction** — strangers resolve DID → DIDComm intro → peer exchange | Opt-in (`publicIntro`) |
| **Stable reference** — QR, docs, mesh-context, "subscribe to this community" | Opt-in picos + root |
| **Credential subject** — VCs, `/whois` | **did:webvh only** — never did:peer as `iss`/`sub` (see § Dual-DID design rationale) | Deferred |
| **Engine-door signing identity** (future broad verify) | Deferred |

### What OAuth + ECI remain for

- Home Assistant, webhook notifiers, MCP — `Bearer` + `/sky/event/{eci}` / `/sky/query/{eci}`
- No DIDComm required for integrators
- Optional: `/api/mesh-context` may expose root `did:webvh` as **metadata** (labeling), not routing

---

## Dual-DID design rationale

**Decision:** Pico-engine Layer 2 uses **two DID methods**, not one. They answer different questions and justify different infrastructure. This section is the design reference for architecture reviews, talks, and build-vs-defer decisions.

### Two questions, two identifiers

| Question | Identifier | Cardinality |
|----------|------------|-------------|
| **Who is this pico as an actor?** | **did:webvh** | **One per pico** — portable, log-backed, SCID-stable |
| **What is this subscription relationship?** | **did:peer:4** | **One per subscription** — pairwise, unhosted, private |

A pico is a **persistent actor** (webvh). Each subscription to another pico is a **separate relationship** (peer). Conflating them — e.g. using only webvh for everything — treats every relationship as the public face of the actor and loses per-subscription isolation, rotation, and privacy.

### Why not did:webvh alone?

`did:webvh` *could* carry all DIDComm traffic in a minimal demo (`from`/`to` always the pico's webvh). We reject that for production meshes because:

| Concern | webvh-only problem | did:peer addition |
|---------|-------------------|-------------------|
| **Pairwise relationships** | One DID for all correspondents | Each sub gets its own peer DID → clean **sender peer DID → subscription → Rx** routing |
| **Privacy / correlation** | All traffic tied to one public actor DID | Relationship DIDs are not a global profile |
| **Scale** | N subscriptions ≠ N hosted logs | One webvh log per pico; N lightweight peer DIDs (no hosting) |
| **Revocation / rotation** | Rotating the actor DID affects everyone | Rotate or drop **one** peer relationship without global blast radius |
| **Intro vs ongoing** | Same identifier for strangers and established peers | webvh = billboard (opt-in); peer = established line |
| **Hosting** | Every crypto path depends on log resolution | Long-form peer exchanged once at intro; cached thereafter |

**Bottom line:** did:webvh is the wrong granularity for subscription-scoped workhorse traffic. did:peer is the wrong granularity for portable actor identity, credentials, and public resolution.

### Decision matrix — which DID for what?

Use this when designing features, APIs, or infrastructure.

| Capability | **did:webvh** | **did:peer:4** | **Neither (ECI/OAuth)** |
|------------|---------------|----------------|-------------------------|
| Ongoing events/queries on a subscription | | ✓ authcrypt `from`/`to` | Intra-mesh local dispatch |
| Public / unsolicited introduction | ✓ `to` recipient webvh | Exchange long-forms during handshake | |
| Mesh-internal introduction (private pico) | | ✓ via existing path / parent | wrangler-mediated |
| **`wrangler:myDid()` / stable reference** | ✓ always | | |
| **`callerDid` metadata** (who acted) | ✓ pico's webvh | | |
| Portable identity / mesh move (SCID) | ✓ log update | Endpoint via rotation on **peer** subs | |
| DIDComm service endpoint in DID doc | ✓ one ingress URL per pico | MAY copy same URI in peer doc | |
| **Verifiable Credentials — subject (`iss`, `sub`)** | ✓ **always webvh** | ✗ never | |
| **Verifiable Credentials — issuance authority** | ✓ issuer's webvh | ✗ | |
| VC presentation over a subscription | Holder **webvh**; transport **peer** | Carries proof; subject stays webvh | |
| `/whois`, public attestation, QR, registry | ✓ | | |
| Home Assistant, webhooks, MCP | | | ✓ OAuth + ECI |
| Family parent ↔ child | | | ✓ local + `familyChannelPicoID` |

**Credentials rule (important):** Issue and hold VCs against **did:webvh**, not did:peer. A peer DID names a **relationship**, not the actor. "Temperature Network attests that **this pico** (webvh) is a member" is meaningful; "attests that **this subscription pairwise ID** …" is not a stable public statement about the actor. Presentation may still travel over DIDComm to a **did:peer** (encrypted channel); the **subject and issuer** in the VC remain webvh DIDs.

### Anti-patterns

| Do not | Why |
|--------|-----|
| Issue a VC with `sub: did:peer:…` | Peer is relationship-scoped, ephemeral to one sub, not the actor |
| Use did:peer as `wrangler:myDid()` | Callers need the portable actor identity |
| Host a did.jsonl per subscription | Defeats peer's purpose; explodes operations |
| Route ongoing sub traffic to did:webvh `to` | Loses pairwise routing and privacy; use peer short-form |
| Skip peer exchange after webvh intro | Intro establishes relationship; ongoing traffic needs peer DIDs |
| Treat OAuth ECI as crypto identity | Integrator capability, not pico actor identity |

### Infrastructure justified by the split

| Infrastructure | Driven by | Notes |
|----------------|-----------|-------|
| **HTTPS `did.jsonl` hosting** per pico | did:webvh | Required for resolution, move, public intro |
| **Engine resolver** (`/identity/resolve`, log routes) | did:webvh | Local + remote log fetch |
| **One DIDComm ingress channel per pico** | webvh doc service endpoint | Shared by all peer relationships on that pico |
| **Identity store** (log, keys, peer sub records) | Both | webvh material per pico; peer DIDs per subscription id |
| **No log hosting for peer** | did:peer | Long-form cached at subscription formation only |
| **Witness / watcher picos** (future) | did:webvh availability | Communities mirror **logs**, not pairwise peers |
| **DIDComm rotation on move** | Both | webvh log update (new URL); **peer** `from_prior` to active subs |

Provisioning **every** pico with did:webvh (Epic 3) is cheap and uniform — no second-class picos. Peer DIDs are minted **only when a subscription forms** — no overhead for leaf picos with no cross-pico relationships.

### Lifecycle (how they work together)

```
  PROVISION                    INTRO                         ONGOING              MOVE (1.7+)
  ─────────                    ─────                         ───────              ──────────

  every pico                   stranger OR parent            established sub      log update +
  gets did:webvh               introduces                    traffic              peer rotation
  (portable: true)                   │                            │                    │
       │                             ▼                            ▼                    ▼
       │                    resolve webvh (if public)      did:peer short-form    webvh: new endpoint
       │                    DIDComm intro SKY              authcrypt SKY          peer: from_prior
       │                    exchange peer long-forms       callerDid = webvh      SCID unchanged
       └──────────────────► store peer per subscription ◄────────────────────── peers notified
```

### Talking points (external / summit)

- **Three planes, not one mega-DID:** passkeys (human→actor), DIDs (actor + relationships), OAuth (integrator→channel).
- **Passport + visa stamp:** webvh = who the pico is; peer = permission to talk on **this** subscription.
- **VCs bind to actors, not phone calls:** credentials reference webvh; DIDComm over peer is the envelope.
- **Self-hosted meshes:** webvh hosting is the main operational cost; peer is relationship crypto without a ledger.
- **Why not one method:** same reason we don't use phone numbers as passports — different lifecycle, visibility, and trust semantics.

**See also:** [pico-identity-libraries.md](./pico-identity-libraries.md) · [sky-didcomm-protocol.md](./sky-didcomm-protocol.md) §12 · [pico-move.md](./pico-move.md) Phase D

---

## Public intro (`publicIntro`)

**Principle:** Every pico gets **did:webvh at create** (cheap, uniform). No pico is a second-class citizen — any pico *can* have a public face. **Advertising** that face for unsolicited introduction is **off by default**, except **root pico**.

### Two distinct concepts

| Concept | Always (every pico) | Only when `publicIntro: true` |
|---------|---------------------|-------------------------------|
| **did:webvh exists** | ✓ — SCID, log, keys provisioned | |
| **Log resolvable** | ✓ — if you know the DID string | |
| **Accept unsolicited intro via webvh** | | ✓ — DIDComm to webvh endpoint → subscription handshake |
| **Advertised in mesh listings / parent UI** | | ✓ — wrangler queries, optional registry |
| **Replace wellKnown ECI for intro** | | ✓ — public picos use did:webvh as billboard |

**Default:** `publicIntro = true` for **root pico**; `false` for all other picos at create.

**Wrangler toggle:** **parent pico via wrangler** may enable on descendants — e.g. root sets `publicIntro: true` on **tag registry** (child, not root) for cross-mesh subscription.

### Introduction flows

**Private pico** (`publicIntro: false`) — thing picos, most children:

```
Parent / existing peer          Private thing pico
      │                              │
      │  intro via mesh (parent      │
      │  introduces, or existing     │
      │  wellKnown path)             │
      │  ── exchange did:peer ──►    │
      │  ◄── established sub ───     │
      └── ongoing: did:peer only ───►│
```

- webvh exists for portability and future move; **not advertised** for cold intro
- Reachable only through subscriptions formed **within the mesh**

**Public pico** (`publicIntro: true`) — root, communities, tag registry, platform services:

```
Stranger / remote pico            Public pico (e.g. tag registry)
      │                              │
      │  resolve did:webvh            │
      │  ── DIDComm (intro) ──►      │
      │  ◄── exchange did:peer ───     │
      │  ── established sub ──►      │
      └── ongoing: did:peer only ───►│
```

### Engine + wrangler surface (sketch)

| Layer | API |
|-------|-----|
| **Engine store** | `publicIntro: boolean` per pico (identity record) |
| **Engine** | Reject or ignore unsolicited intro DIDComm when `publicIntro: false` |
| **Wrangler** | `wrangler:publicIntro()` query; `wrangler:setPublicIntro(true\|false)` action — **parent pico** may set on child |
| **Wrangler** | `wrangler:myDid()` — always returns did:webvh (whether public or not) |
| **Root provision** | Set `publicIntro: true` in `provisionRoot` |

### Examples

| Pico | Root? | `publicIntro` default | Why enable |
|------|-------|----------------------|------------|
| Owner root | yes | **true** | Mesh front door; human's actor |
| Temperature Network community | no | false → **enable** | Accept member picos from outside strict parent tree |
| Tag registry | no | false → **enable** | Cross-mesh tag lookup; external subscription |
| LHT65 sensor thing | no | false | Reachable via router/community subs only |
| SafeAndMine app pico | no | false | Parent Manifold introduces |

---

## Target architecture

### Two DID layers

| DID | Scope | Created when |
|-----|-------|--------------|
| **did:webvh** | One per pico — portable identity; **public intro opt-in**; **VC subject/issuer** | Pico provisioning (all new picos) |
| **did:peer:4** | One per **subscription** — pairwise relationship; **transport only**, not credential identity | Subscription formation (new subs only) |

Full rationale, decision matrix, anti-patterns, and infrastructure mapping: **§ [Dual-DID design rationale](#dual-did-design-rationale)** above.

### Addressing and routing (dual transport)

**Gate is same-mesh, not same-engine.** A pico-engine may host **many root picos** (many meshes). Co-hosted meshes must not skip crypto just because they share a process.

| Transport | When |
|-----------|------|
| **Verified local dispatch** | Caller and recipient share the same **mesh root id** (intra-mesh subscription) *and* recipient pico is on **this engine instance** |
| **SKY over DIDComm** | **Cross-mesh** (different mesh roots) — always, even on same engine · **or** recipient not local to this engine · **or** public intro |

**Cross-engine** is a subset of cross-mesh or "recipient not local." **Cross-mesh on same engine** is the case this rule catches (e.g. Alice's thing → Bob's tag registry, both on `engine.example.com`).

```
  INTRA-MESH (same mesh root)              CROSS-MESH or remote recipient
  ───────────────────────────              ───────────────────────────────

  Pico A                                   Pico A
    │ wrangler:picoQuery / event:send        │ pack SKY + DIDComm
    ▼                                        ▼ HTTP POST (JWE) or resolve peer endpoint
  Engine verifies:                           Recipient engine
    • caller pico id (rsCtx)                 unpack + verify
    • same meshRootId as recipient           map sender peer DID → sub
    • outbound subscription authorized       assert Rx policy → bus
    • recipient pico local to this engine
    ▼
  ctx:query / local event
    → internal Rx channel → policy → bus
```

**Key design choice — policy without Tx/Rx as address:**

Subscriptions **stop storing Tx/Rx ECIs** as routing targets, but each subscription **still creates an internal Rx channel** whose **event/query policies are unchanged**. The Rx channel id is **not** exchanged with the peer; only **did:peer** long/short forms are.

- **Intra-mesh outbound:** engine primitive → recipient's internal Rx ECI after **subscription authorization** (§ Intra-mesh verification).
- **Cross-mesh outbound:** DIDComm SKY to recipient's **did:peer** (always).
- **Inbound DIDComm:** pico ingress ECI → `(sender_peer_did → subscription → rx_channel)` → policy → bus.

### Intra-mesh verification

Intra-mesh traffic **does not** use DIDComm when the recipient is local to this engine. Identity is enforced at the **engine boundary**:

| Check | Detail |
|-------|--------|
| **Caller identity** | Engine knows **calling pico id** from `rsCtx` |
| **Mesh gate** | `caller.meshRootId === recipient.meshRootId` (same owner forest / root pico) |
| **Subscription authorization** | Caller owns an **outbound established** subscription; engine store mirrors peer DID binding |
| **Locality** | Recipient pico exists on **this engine instance** (implementation dispatch check — not the trust gate) |
| **Recipient context** | `fromPicoID` + **`callerDid`** (caller did:webvh) |
| **Policy** | `assertEventPolicy` / `assertQueryPolicy` on internal Rx channel |

**Cross-mesh** subscriptions set `cross_mesh: true` (or infer from `meshRootId` mismatch) and **always** use DIDComm — no exception for co-hosted engines.

**Not in 1.6:** per-message did:webvh signatures on local dispatch.

### Mesh move and transport fallback

| Subscription type | On whole-mesh move | Transport after move |
|-------------------|--------------------|----------------------|
| **Intra-mesh** (thing → community, same root) | Mesh root id unchanged; picos relocate together | Still **local** on new engine (if entire mesh moved) |
| **Cross-mesh peer** (mesh A → mesh B service) | **did:peer** + **did:webvh** rotation; peer learns new endpoint | Still **DIDComm** — was never local |
| **Cross-mesh co-hosted** (A and B on same engine) | No move implied | **DIDComm** before and after |

Moving a mesh does **not** flip cross-mesh subs to a local shortcut — they were already DIDComm. What move updates is **endpoint resolution** (did:webvh log, DIDComm service endpoint, optional `Tx_host`), via DID Rotation in 1.7+ — not the transport-class decision.

**Do not use `Tx_host === meta:host` as the primary gate** — it conflates co-location with trust domain and breaks multi-tenant semantics. Keep `Tx_host` as a **delivery hint** for DIDComm HTTP POST (and legacy paths); routing logic uses **mesh root id** + `cross_mesh`.

### Scale: channels on a busy Manifold

| Model | Community pico with N members | Notes |
|-------|------------------------------|-------|
| ~~Per-sub ingress~~ (rejected) | N ingress + N Rx = **2N** channels | 1000 members → **2000** channels on one pico |
| **One ingress per pico** (decided) | **1** ingress + N Rx = **N+1** | 1000 members → **1001** channels |
| Thing pico (few subs) | 1 ingress + ~2–5 Rx | ~6 channels each |

**Ingress consolidation** addresses choice 2. **Internal Rx per subscription** remains (channel policy model). At very large N, future work could move policy onto the subscription record and drop per-sub Rx channels — not 1.6.

Example Manifold: 1000 thing picos × ~4 channels each ≈ 4000 channels engine-wide (distributed); one community with 1000 members ≈ 1001 channels on that community pico — acceptable with LevelDB; monitor enumeration UIs.

### What still uses ECIs

| Use case | Mechanism in 1.6 |
|----------|------------------|
| **Family** (parent ↔ child) | `ctx:query` / local event; `familyChannelPicoID` |
| **OAuth integrators** (HA, webhooks) | Bearer token + ECI in `/sky/*` URL |
| **Engine UI** | `engine,ui` channel |
| **System** | `system` tag channels |
| **DIDComm ingress** | One (or few) engine-managed channels per pico — receive only |
| **Regular app channels** | Policy channels; OAuth-eligible if tagged |
| **Legacy subscriptions** | Existing Tx/Rx ECI routing (unchanged) |

---

## Channel-type matrix (1.6)

| Channel type | Identification | Transport | Policy eval | Door verify | OAuth-eligible |
|--------------|----------------|-----------|-------------|-------------|----------------|
| **Family** | ECI + `familyChannelPicoID` | Local `ctx:query`/event | Owner-only (no policy) | No | No |
| **System** | ECI + `system` tag | Local / engine internal | As today | No | No |
| **Engine UI** | ECI + `engine,ui` | HTTP + local | As today | No | No |
| **Regular policy** | ECI | HTTP OAuth / local | event/query policy | Only if via DIDComm¹ | If `oauth-webhook` |
| **Subscription (new, intra-mesh)** | **did:peer:4** + internal Rx | **Local** verified dispatch (same mesh root, local pico) | Internal Rx policy | Engine sub auth | No |
| **Subscription (new, cross-mesh)** | **did:peer:4** | **DIDComm** SKY (even if same engine) | Internal Rx policy | **Yes** (unpack) | No |
| **Subscription (legacy)** | Tx/Rx ECI | HTTP / local as today | Rx channel policy | No | No |
| **DIDComm ingress** | One **per pico** (engine-provisioned) | HTTP POST encrypted JWE (cross-engine only) | Route by sender peer DID | **Yes** (unpack) | No |

¹ Regular channels are not subscription-addressed in 1.6; DIDComm door verify applies to subscription and ingress traffic.

---

## Work breakdown

Estimates are **relative effort** (S/M/L/XL), not calendar time.

### Epic 0 — Decisions & spike (S)

**Goal:** De-risk library integration before broad implementation.

| Task | Owner layer | Effort |
|------|-------------|--------|
| ESM/CJS spike: dynamic `import()` of `didwebvh-ts` + `@veramo/did-comm` from pico-engine-core | engine | S |
| Spike: did:peer:4 create/resolve (vendored `did-peer-4` or `@veramo/did-provider-peer`) | engine | S |
| Spike: authcrypt round-trip two in-memory picos (pack → unpack) | engine | S |
| Choose module name (`identity` vs replace `dido`) and document | docs | S |

**Exit:** CI test proving pack/unpack + peer:4 encode/decode on Node 20.

---

### Epic 1 — Engine identity store (M)

**Goal:** Engine-owned per-pico identity state (never RS `ent:`).

#### Decisions (2026-08-01)

| Topic | Decision |
|-------|----------|
| **Location** | Same mesh LevelDB as everything else (`~/.pico-engine/db`). New prefix **`pico-identity`**, keyed by pico id — **not** ruleset `ent:`, **not** embedded in framework `Pico` |
| **Owner** | `pico-engine` package (`IdentityStore`), wired from `startEngine()` like `AuthService` / `OAuthService` |
| **Framework changes** | **None for 1.6.** `meshRootId` and all DID state live under `pico-identity`; no `Pico.ts` extension |
| **Key layout** | One subkey per field (partial reads without loading secrets): `webvhDid`, `webvhLog`, `webvhKeys`, `meshRootId`, `publicIntro`, `peerSub/{subId}`, `didDoc/{did}`, `pendingRotations` |
| **Protection (1.6)** | **Plaintext JSON in LevelDB** — same posture as passkeys/OAuth today. Filesystem permissions only. |
| **1.6-known-gap** | Private DID keys are **not** encrypted at rest and **not** passkey-gated at use time. Stolen `db/` ⇒ full key compromise. Document in release notes; target upgrade = envelope encryption + session/passkey unlock before crypto ops (MEMORY §9). |
| **Runtime access** | TypeScript-only `IdentityStore`; KRL/wrangler never read/write store directly |
| **Migration** | No-op stub for 1.6 (`migrateFromDidO`); legacy `io.picolabs.did-o` `ent:` not auto-migrated |
| **Testing** | Ava + `startIsolatedEngine` (same harness as Layer 1 auth/OAuth). Docker compose reserved for cross-engine integration (Epic 8); Epic 1 exit = unit CRUD + restart persistence |

```
["pico-identity", picoId, "webvhDid"]
["pico-identity", picoId, "webvhLog"]
["pico-identity", picoId, "webvhKeys"]       ← private + public key material (1.6: plaintext)
["pico-identity", picoId, "meshRootId"]
["pico-identity", picoId, "publicIntro"]
["pico-identity", picoId, "peerSub", subId]
["pico-identity", picoId, "didDoc", did]
["pico-identity", picoId, "pendingRotations"]
```

**Boundary (engine ← wrangler):** Wrangler calls `dido:*` capabilities only; engine lifecycle hooks (Epic 3+) and `dido` module are the sole writers. See § Engine + wrangler surface.

| Task | Details |
|------|---------|
| Define identity DB schema | Per pico fields above |
| CRUD API internal to engine | `IdentityStore` — no KRL exposure of private keys |
| Wire into `startEngine` | `pe.identity` on `PicoEngine` |
| Migration stub | No-op for 1.6 |

**Files:** `packages/pico-engine/src/identity/{types,store,index}.ts`, `packages/pico-engine/test/identityStore.ts`

**Exit:** Unit tests read/write identity state per pico id; survives engine restart on same home dir.

---

### Epic 2 — Greenfield `dido` module reboot (L)

**Goal:** **Replace** `dido.ts` implementation in place; keep **`dido:*`** as the KRL module name (breaking reboot of internals, not a new module alias).

#### Decisions (2026-08-01)

| Topic | Decision |
|-------|----------|
| **Module home** | `packages/pico-engine/src/identity/{IdentityService,didoModule}.ts` — injected via `core.modules["dido"]` before `core.start()` |
| **Core** | **Removed** `pico-engine-core/src/modules/dido.ts` and **`didcomm-node`** dependency |
| **did-o ruleset** | **Removed** from `BUNDLED_KRL_FILES`; DIDComm routing folded into wrangler |
| **Wrangler** | `myDid()`, `didcomm_route_message`, trust-ping route init; child picos no longer install did-o |
| **Legacy `dido:*`** | `generateDID`, `mapDid`, etc. → **410** with migration message |
| **Pack/unpack** | Lazy `@veramo/did-comm` via dynamic require; needs full `npm install` in `packages/pico-engine` |
| **1.6-known-gap (peer)** | `@veramo/did-provider-peer` v7 supports numalgo **0/2 only** — did:peer:4 vendoring deferred to follow-up spike |

| Task | Library | KRL surface (capabilities only) |
|------|---------|----------------------------------|
| Rewrite `dido.ts` on new stack | didwebvh-ts, did-peer-4, @veramo/did-comm | Same `dido:*` names where applicable |
| `ensureWebvhDid()` | didwebvh-ts | Engine-internal at pico create |
| `getMyDid(picoId)` | store | `dido:myDid()` via wrangler |
| `createPeerDid(subscriptionId)` | did-peer-4 | Engine-internal at sub formation |
| `resolveDid(did)` | didwebvh-ts + peer | Engine-internal |
| `packMessage` / `unpackMessage` | @veramo/did-comm | Engine-internal; **SKY protocol** types |
| `sendDidcomm` / ingress handler | @veramo/did-comm | One **pico-level** ingress; route by sender peer DID |
| `crossPicoQuery` / `crossPicoEvent` | engine | Intra-mesh + local recipient: verified dispatch; else DIDComm |
| Remove `io.picolabs.did-o` dependency | — | Behaviors fold into wrangler |

**Exit:** Module loads; no did-o ruleset required; old didcomm-node code gone.

---

### Epic 3 — did:webvh hosting (L)

**Goal:** Every new pico gets a resolvable `did:webvh` with `portable: true`.

| Task                                          | Details                                                                                  |
| --------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `createDID` at pico provisioning              | Hook `provisionRoot` / `newPico` paths — **all picos**                                   |
| `publicIntro` flag in identity store          | Default `true` root, `false` others; see § Public intro                                  |
| Persist log + keys in identity store          |                                                                                          |
| HTTP routes for DID log                       | **did:webvh spec HTTPS mapping** — host/path derived from DID; `did.jsonl` at mapped URL |
| Optional parallel `did.json`                  | `generateParallelDidWeb` from didwebvh-ts                                                |
| Resolver endpoint (engine)                    | Resolve local + fetch remote logs                                                        |
| DIDComm service endpoint in DID doc           | Points to **pico's single ingress** URL                                                  |
| **Intro policy gate**                         | Accept unsolicited intro DIDComm only when `publicIntro: true`                           |
| Wrangler `myDid()`                            | Returns did:webvh string (always)                                                        |
| Wrangler `publicIntro()` / `setPublicIntro()` | Query + action                                                                           |

**Files (expected):** `packages/pico-engine/src/identity/webvh.ts`, `server.ts` routes.

**Exit:** External HTTPS GET resolves a pico's DID; SCID verifies.

**Out of scope (Epic 3 baseline):** Epic 3 delivers a **minimal conformant did:webvh** — one signing key at create, append-only log, HTTPS hosting, resolver, DIDComm service endpoint, and `publicIntro` gating. The following **did:webvh v1.0** features are supported by [`didwebvh-ts`](./pico-identity-libraries.md) but **not wired in Epic 3 / 1.6**:

| Feature | Epic 3 | Notes |
|---------|--------|-------|
| **Pre-rotation** (`nextKeyHashes` at inception) | ✗ | Library supports it; we create with a single active key. Candidate **early add-on** after baseline webvh lands — cheap at provision time and pairs with DID Rotation / move (1.7+). |
| **Witnesses** | ✗ | Library has witness proof helpers; no `did-witness.json` routes or witness ceremony in 1.6. |
| **Watchers** | ✗ | Log-monitoring / replication role in the spec; not implemented in 1.6. |

**Future add-on — identity infrastructure pico:** See § [Identity infrastructure pico](#identity-infrastructure-pico-future) below.

---

## Identity infrastructure pico (future)

**Concept:** A single-purpose pico — deployed via an installable KRL ruleset (e.g. `io.picolabs.identity-infrastructure`) — that provides **shared did:webvh services** for other picos and meshes. One actor, two modes:

| Mode | Role | Hot path |
|------|------|----------|
| **Witness** | Co-sign log updates for enrolled DIDs | Engine-native crypto (`didwebvh-ts` witness proofs); KRL for accept/reject policy |
| **Watcher** | Pull, cache, and serve mirrored `did.jsonl` | Engine HTTP fetch + local store; KRL for which DIDs to mirror |

Standalone meshes self-host their own log and need no infrastructure pico. **Communities of pico meshes** are the natural operators: a neighborhood co-op, campus lab, or trusted steward runs one or more identity-infrastructure picos that members **opt into**.

### Why a pico (not an engine plugin)

- **Deployability** — `installRuleset` + spawn pico; no engine fork or special build
- **Federation** — each community chooses *which* infrastructure picos to trust; no Picolab central service
- **Consistency** — same pattern as community picos, tag registries, and thing picos: specialized persistent actors
- **Policy in KRL** — quotas, enrollment rules, audit events, operator UI; engine stays thin

### Engine vs KRL boundary

Same split as `dido:*` today:

| Layer | Responsibility |
|-------|----------------|
| **Engine** | Witness proof generation/verification, `did-witness.json` routes, log-update notifications, mirror fetch/serve, resolve cached logs |
| **Identity infrastructure pico (KRL)** | Enroll/unenroll DIDs, accept/reject join requests, witness quorum preferences, watcher mirror list, operator alerts |

Co-signing and mirror refresh should **not** round-trip through the full ruleset scheduler on every log line — enrollment and policy changes yes; the hot path reads config from identity store or `ent:` and runs engine-native.

### Joining (enrollment)

Bilateral, subscription-shaped — not a special admin API:

```
Member pico / mesh root              Identity infrastructure pico
      │                                        │
      │  enroll / request witness service      │
      │  ── intro or SKY enroll ─────────────► │
      │  ◄── accept + infrastructure did ───── │
      │                                        │
      │  next log update lists witness         │
      │  ── witness ceremony ─────────────────►│ co-sign (witness mode)
      │  ◄── witness proof ────────────────────│
      │                                        │
      │  (optional) watcher pulls mirror       │ replicate (watcher mode)
```

- **Witness enrollment** — infrastructure pico explicitly accepts; subject adds witness to the next DID log entry (did:webvh spec ceremony)
- **Watcher enrollment** — lighter; infrastructure pico subscribes to log-update notifications or polls; serves read-only mirror
- **Community broker** — a community pico may offer default infrastructure picos to members on join (“inherit these witnesses”)

Revocation: infrastructure pico handles leave/unenroll; subject publishes log update removing the witness.

### Deployment sketch

| Operator | Typical setup |
|----------|----------------|
| Solo mesh | None — self-hosted `did.jsonl` only |
| Community engine | One identity-infrastructure pico per steward; members list 1–3 for redundancy |
| Multi-steward consortium | Each steward runs their own; member DID docs list witnesses from different operators |

The infrastructure pico is a **first-class actor**: own `did:webvh`, keys, DIDComm ingress, and `publicIntro` as needed for enrollment endpoints.

**Deferred:** Epic 3 baseline + 1.6 release. Implement after move/rotation (1.7+) or when multi-mesh communities need availability beyond self-hosting.

---

### Epic 4 — DIDComm ingress & door verify (L)

**Goal:** Encrypted inbound path for **cross-engine** subscription traffic only.

**Ingress model (revised):** **One DIDComm ingress channel per pico** (provisioned at pico create). Inbound JWEs routed by **sender peer DID** → subscription → internal Rx channel. Avoids N ingress channels on community picos with thousands of members.

| Task                                               | Details                                                                      |
| -------------------------------------------------- | ---------------------------------------------------------------------------- |
| Provision **one DIDComm ingress channel per pico** | Engine-managed; created with pico (or lazily on first cross-engine sub)      |
| Sky route: `dido/didcomm_message`                  | Accept POST body = JWE on pico's ingress ECI                                 |
| Unpack + authcrypt verify                          | @veramo/did-comm; reject on failure (401/403)                                |
| Route by sender **did:peer**                       | Lookup subscription on recipient pico → internal Rx                          |
| Parse **SKY protocol** plaintext → event or query  | See [sky-didcomm-protocol.md](./sky-didcomm-protocol.md)                     |
| **`crossPicoQuery` / `crossPicoEvent` primitives** | Intra-mesh + local: verify mesh root + sub; `ctx:query`/event. Else: DIDComm |
| `callerDid()` metadata                             | Attach on both paths                                                         |
| Outbound HTTP client                               | POST JWE for cross-mesh or remote recipient                                  |

**Exit:** Cross-engine integration test + same-engine verified local test (no DIDComm on loopback).

---

### Epic 5 — Subscription ruleset overhaul (XL)

**Goal:** New subscription formation exchanges **did:peer:4**; stores peer DIDs; routes over DIDComm.

| Task | Details |
|------|---------|
| **Feature flag or version gate** | New behavior only for subscriptions formed after 1.6; legacy `ent:` shape unchanged |
| Adapt introduction flow | `wellKnown` channel intro → exchange **long-form** did:peer:4 both directions; **public picos** may also accept intro via did:webvh when `publicIntro: true` |
| Update `ent:inbound` / `outbound` / `established` schema | Add `Tx_did`, `Rx_did` (names TBD); **remove Tx/Rx ECI from new records** |
| Still create **internal Rx channel** per subscription | For policy eval; not shared as address |
| Engine callback at subscription establish | Create peer DID + store in identity store |
| Outbound event send | Local if intra-mesh + local recipient; else DIDComm SKY |
| Inbound query support | Intra-mesh local: `ctx:query`; cross-mesh/remote: SKY over DIDComm |
| Password / autoAccept flows | Unchanged semantics; DID exchange added to handshake |
| Tests | New sub E2E; legacy sub regression unchanged |

**Files (expected):** `packages/pico-engine/krl/io.picolabs.subscription.krl`, wrangler subscription events, engine hooks.

**Exit:** Two picos form new subscription; events and queries work without Tx/Rx ECIs in ent.

---

### Epic 6 — Wrangler integration (L)

**Goal:** OS-layer ergonomics; retire `dido:prepareQuery` and did-o install wiring.

| Task | Details |
|------|---------|
| `picoQuery` routing | Intra-mesh + local → verified `ctx:query`; cross-mesh → DIDComm; family → `ctx:query`; legacy → existing |
| `event:send` to subscription | Intra-mesh + local → verified local event; cross-mesh → DIDComm |
| `wrangler:myDid()` / `wrangler:callerDid()` | |
| `wrangler:publicIntro()` / `wrangler:setPublicIntro()` | See § Public intro |
| Remove `did_o_url` sibling install | Wrangler bootstrap |
| Mark `io.picolabs.did-o.krl` deprecated | README + CHANGELOG; do not install on new roots |
| Update wrangler docs | |

**Exit:** Manifold / test rulesets work without did-o installed.

---

### Epic 7 — Channel policy preservation (M)

**Goal:** Explicit guarantee that permission model is unchanged for 1.6.

| Task | Details |
|------|---------|
| Document mapping: sender peer DID → subscription → Rx channel | |
| `assertChannelPolicies` on DIDComm-delivered events/queries | Reuse pico-framework `Channel.assertEventPolicy` / `assertQueryPolicy` |
| Subscription channel tags | Keep `wellknown_rx`, `tx_rx`, etc. on **internal** channels where needed for OAuth exclusion |
| `channelEligibility.ts` | Ensure internal sub Rx channels remain OAuth-ineligible |
| Family / system / engine | No code changes (verify regression tests) |

**Exit:** Test proves a denied event on Rx policy is rejected after DIDComm delivery.

---

### Epic 7b — Subscriptions UI (M)

**Goal:** Developer UI matches Layer 2 subscription model; Rx policy is discoverable and editable in context.

**Context:** Generic channel policy editing exists on the **Channels** tab (1.5.1+). Subscription **internal Rx** channels are editable there, but the **Subscriptions** tab is still legacy (`wellKnown_Tx`, ECI-centric). Users should not have to hunt Rx ECIs on the Channels tab.

| Task | Details |
|------|---------|
| **Layer 2 create flow** | New subscription form: `layer2: true`, `target_did` (did:webvh or did:peer); hide or secondary-tab legacy `wellKnown_Tx` path |
| **Established sub display** | Show `Tx_did`, `Rx_did`, `layer2`, internal `Rx` ECI; de-emphasize empty legacy `Tx` on layer2 subs |
| **Rx policy in context** | Link from established sub → Rx channel; inline or jump-to Channels editor for event/query policy |
| **`myDid` / `publicIntro`** | Display caller's did:webvh; toggle public intro where appropriate (root / parent-on-child) |
| **Send event on sub** | Optional: test/send panel using `event:send({ sub: bus, … })` for debugging |
| **Forest view** | Subscription lines still work; ensure layer2 subs render without Tx ECI |

**Files (expected):** `packages/pico-engine-ui/src/components/PicoTabs/Subscriptions.tsx`, possibly `Channels.tsx` (deep-link), `stores/subscriptions.js`.

**Exit:** Operator can form a layer2 subscription, see DIDs, and edit Rx policy without leaving Subscriptions context.

**Note:** Engine + KRL Layer 2 path is done (Epics 5–7). This UI epic is **required before 1.6 release** — do not ship Layer 2 to operators with legacy Subscriptions tab only.

---

### Epic 8 — Cross-engine subscriptions (M)

**Goal:** New subscriptions work when `Tx_host` ≠ local engine.

| Task | Details |
|------|---------|
| Resolve remote did:webvh / did:peer | HTTP fetch DID doc + log verification |
| Outbound POST to remote DIDComm endpoint | |
| `Tx_host` in subscription record | Host of peer engine for HTTP; peer DID for crypto |
| Same subscription ruleset fields | |

**Exit:** Two-engine integration test (Docker compose or two processes).

---

### Epic 9 — Testing & CI (M) ✅

| Area | Tests |
|------|-------|
| didwebvh-ts | `webvh.ts`, `epic9Matrix.ts` (SCID tamper) |
| did:peer:4 | **Deferred** — `epic9Matrix.ts` asserts num_algo 2 |
| @veramo/did-comm | `establishSubscription.ts`, `epic9Matrix.ts` (pack/unpack roundtrip) |
| Subscription E2E | `layer2Routing.ts`, `crossEngineSubscription.ts`, `epic9Matrix.ts` |
| Public intro | `skyIntro.ts`, `crossEngineSubscription.ts`, `epic9Matrix.ts` (child + publicIntro) |
| Intra-mesh sub | `didcommIngress.ts` |
| Cross-mesh sub (same engine) | `didcommIngress.ts` |
| Cross-mesh sub (move) | **Deferred 1.7+** |
| Legacy sub regression | `epic9Matrix.ts` + `helpers/legacySub.ts` |
| Family channel regression | `epic9Matrix.ts` |
| OAuth regression | `oauth.ts`, `auth.ts`, `acg.ts`, `httpSurface.ts`, `epic9Matrix.ts` |

Run: `npm run test:epic9` (also included in default `npm test` / CI).

---

### Epic 10 — Documentation & release (S)

| Deliverable | Status |
|-------------|--------|
| Update `MEMORY.md` §5 | Layer 2 shipped scope for 1.6 |
| Update `pico-identity-libraries.md` | Module name, any library pin changes |
| CHANGELOG 1.6 | ✅ `CHANGELOG.md` |
| KRL docs | `identity` module (if any public queries) |
| Developer guide | ✅ [`docs/guides/layer2-subscriptions.md`](../guides/layer2-subscriptions.md) |
| Release notes | ✅ [`docs/release/1.6.md`](../release/1.6.md) |
| README updates | ✅ root + `packages/pico-engine/README.md` |
| Docker cross-engine | Optional `docker-compose.cross-engine.yml` (experimental); **demo: two host processes** |

---

## Explicitly deferred (post-1.6)

| Item | Rationale |
|------|-----------|
| **Family channel crypto verify** | Interview: unchanged for 1.6; engine `fromPicoID` sufficient locally |
| **Door verify on all ctx:query/event** | Interview: DIDComm ingress only |
| **Legacy subscription migration** | New subs only |
| **DIDComm DID Rotation / pico move** | [pico-move.md](./pico-move.md) Phase D |
| **VC-based authorization** | MEMORY §5 phase 5 |
| **Retire `dido.ts`** | Deprecate in 1.6; remove 1.7+ |
| **Mediators / routing 2.0 forward** | Direct HTTP sufficient |
| **did:webvh pre-rotation** (`nextKeyHashes`) | Epic 3 baseline uses single key at create; library supports pre-rotation — optional early add-on before move (1.7+) |
| **Identity infrastructure pico** | Witness + watcher modes in one KRL-deployed pico; see § [Identity infrastructure pico](#identity-infrastructure-pico-future) |

---

## Suggested implementation order

```
Epic 0 (spike)
  → Epic 1 (store)
  → Epic 2 (module skeleton)
  → Epic 3 (webvh)
  → Epic 4 (ingress)
  → Epic 7 (policy mapping) — parallel with Epic 4
  → Epic 5 (subscription) — largest; needs 2–4
  → Epic 6 (wrangler)
  → Epic 8 (cross-engine)
  → Epic 9–10 (tests, docs, release)
```

**Critical path:** store → webvh → DIDComm ingress → subscription overhaul → wrangler routing.

---

---

## SKY protocol on DIDComm (decided)

Define a **formal Picolab SKY protocol** on DIDComm v2 for **cross-engine** subscription traffic and **introduction**. Same-engine established subscriptions use **verified local dispatch** instead (see § Intra-mesh verification).

### Message types

| Type | Purpose |
|------|---------|
| `https://picolabs.org/sky/1.0/intro` | Introduction handshake; exchange did:peer long-forms |
| `https://picolabs.org/sky/1.0/intro-response` | Accept/reject intro; complete peer exchange |
| `https://picolabs.org/sky/1.0/event` | Raise event on recipient pico (cross-engine) |
| `https://picolabs.org/sky/1.0/query` | Query request (cross-engine) |
| `https://picolabs.org/sky/1.0/query-response` | Query result or error; **`thid`** links to query `id` |

### Transport selection

| Condition | Transport |
|-----------|-----------|
| **Intra-mesh** (same `meshRootId`) + recipient local to engine | **Verified local dispatch** |
| **Cross-mesh** (different mesh roots) | **SKY over DIDComm** — always |
| Remote recipient (same mesh, different engine¹) | **SKY over DIDComm** |
| **Public intro** (`publicIntro: true`) | **SKY over DIDComm** to did:webvh |

¹ Unusual in 1.6 (mesh = one engine); DIDComm is the safe default if locality fails.

Full spec: [sky-didcomm-protocol.md](./sky-didcomm-protocol.md)

---

## Resolved decisions (2026-08-01 interview)

| # | Question | Decision |
|---|----------|----------|
| 1 | Ingress channel cardinality | ~~One per subscription~~ → **One per pico** (rev. performance/scale) |
| 2 | picoQuery over DIDComm | **Full SKY protocol** cross-mesh; **verified local dispatch** intra-mesh |
| 3 | KRL module name | **`dido:*` reboot** |
| 4 | Rollout | **Always-on** for new subscriptions on 1.6+ |
| 5 | did.jsonl URL | **did:webvh spec HTTPS mapping** |
| 6 | `setPublicIntro` authorization | **Parent pico via wrangler** |
| 7 | Public vs private picos | All picos get webvh; `publicIntro` opt-in; root default on |
| 8 | Intra-mesh fast path (rev.) | **Same mesh root**, not same engine; cross-mesh always DIDComm |

---

## Open questions (remaining)

_None — 1.6 scoping interview complete. Protocol specified in [sky-didcomm-protocol.md](./sky-didcomm-protocol.md)._

---

## Security notes (family channels — for future)

Family channels **can** be cryptographically authenticated in a later release without DIDComm overhead:

- On local `ctx:query`/event, engine verifies caller **did:webvh** signature (or pico↔DID binding) matches `familyChannelPicoID` owner pico.
- No HTTP exposure; no DIDComm required.
- Deferred per interview decision; document as 1.7+ candidate.

---

## Related documents

- [sky-didcomm-protocol.md](./sky-didcomm-protocol.md) — SKY on DIDComm v2 (1.0)
- [pico-identity-libraries.md](./pico-identity-libraries.md) — library choices
- [MEMORY.md §5](../../MEMORY.md) — identity model
- [pico-move.md](./pico-move.md) — portability phasing
- [one-summit-japan-2026-cfp.md](./one-summit-japan-2026-cfp.md) — talk strategy (identity as hook, actors as payoff)
