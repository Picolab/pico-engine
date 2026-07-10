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
Surfaced by the R1T adoption scenario (see "Worked scenario" in the identity section). Moving a
pico from one engine/mesh to another so it **leaves** the source and **exists** in the destination.

- **= network-mirror machinery (§3) made federation-aware, + delete of the source.** Migration ≈
  "mirror the pico's structure/state to the destination engine, rewire relationships, then
  `child_deletion_request` on the source."
- **Identity is preserved, not re-minted** — with DID/DIDComm (§5) the pico keeps its **DID
  continuity** across the move: did:webvh moves host/path but retains the **SCID** + full history
  (needs `portable: true` at inception). (This is a key reason SPIFFE was set aside — it would
  re-mint the identity.)
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

### Implementation phasing (layered rollout — plan 2026-07-10)
Build in **three layers that match the architecture** (engine ← wrangler ← manifold) and the
identity dependency order (human authn → agent, then agent↔world DID, then external OAuth).

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

**Spike edits (in the sibling `pico-framework`):**
- Startup: **don't auto-create** a root when `["root-pico"]` missing → allow zero picos.
- Derive roots as **all picos with `parent === null`**; add `rootPicos(): Pico[]`; keep `rootPico`
  as a deprecated "primary root" shim for migration.
- Add `createRootPico(conf?)`: mint a parentless `Pico`, persist `toDbPut()`, `addPico()`, return it
  (mirror `newPico` minus parent wiring). Consider a `["root-picos", picoId]` marker range (or just
  rely on `parent === null`).
- **Tests:** empty boot → `numberOfPicos() === 0`; `createRootPico()` ×2 → two independent
  parentless picos, both routable, isolated event/query, delete-one-keeps-other.

**Then wire into the engine (`packages/pico-engine/src/index.ts`):** stop installing base rulesets
at boot; install them at **root-creation** time (called by the registration flow); serve UI with
zero roots; derive per-session `uiECI`. **Existing single-root engines migrate for free** — their
current root already has `parent === null`, so it's picked up as root #1.

#### Layer 2 — did:webvh / did:peer + DIDComm as the interchange
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

#### Layer 3 — OAuth for external API access
- **The admin-identity layer (root-pico-as-agent) acts as the OAuth Authorization Server (AS).**
- External apps get **OAuth** access to pico event/query APIs as clients; the agent
  authorizes/consents, tokens scoped to what the agent controls.

**Why this order:** Layer 1 gives you an authenticated human + agent (and multi-tenancy) to anchor
everything; Layer 2 gives agents portable cryptographic identity + a uniform secure interchange;
Layer 3 exposes it outward to third parties on top of the now-solid identity base.

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

## Cross-references
- **Manifold / sensor-network context (source of truth):**
  `/Users/pjw/Dropbox/prog/picolabs/manifold-api/MEMORY.md`
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
