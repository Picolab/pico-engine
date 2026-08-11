# Pico identity: library and implementation decisions

**Status:** draft (2026-07-31)  
**Context:** Layer 2 identity (DID/DIDComm) for pico-to-pico interchange. Layers 1 (passkeys) and 3 (OAuth) are shipped. This document records **why we are not extending the existing `dido` module**, which **spec versions** we target, which **Node libraries** to adopt, and how they fit the engine ← wrangler split. See [MEMORY.md §5](../../MEMORY.md) for the identity model; [pico-move.md](./pico-move.md) for relocation phasing.

---

## Decision summary

| Concern | Decision |
|---------|----------|
| Existing `dido` module | **Do not extend.** Treat as deprecated prototype; reference only for migration and API ideas. |
| Portable pico identity | **did:webvh v1.0** via [`didwebvh-ts`](https://github.com/decentralized-identity/didwebvh-ts) |
| Subscription / pairwise identity | **did:peer numalgo 4** via DIF reference impl or `@veramo/did-provider-peer` v7 |
| Messaging | **DIDComm Messaging v2** (`didcomm/v2` profile) via `@veramo/did-comm` v7 |
| Storage | **Engine-owned per-pico state** — keys and logs never in ruleset `ent:` |
| KRL wrapper ruleset | **Retire `io.picolabs.did-o`** — fold ergonomics into wrangler |
| Full SSI agent (Credo / Veramo agent) | **Do not adopt** — same pattern as passkeys/OAuth: library for ceremony, engine for state |

---

## Why the existing `dido` code is not the foundation

The built-in module at `packages/pico-engine-core/src/modules/dido.ts` ("DIDO v1.0.0") and the installable ruleset `io.picolabs.did-o.krl` were useful experiments but sit on a **transitional 2021–2023 stack**:

| Aspect | Current `dido` | Target (2025–2026 specs) |
|--------|----------------|----------------------------|
| DIDComm library | [`didcomm-node`](https://www.npmjs.com/package/didcomm-node) **0.4.1** (last publish May 2023) | Active TS libs on `@veramo/did-comm` v7 or equivalent |
| Service profile | Advertises `didcomm/v2` **and** `didcomm/aip2;env=rfc587` (Aries transitional envelope) | **`didcomm/v2` profile only** per [DIF DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/) |
| Peer method | Hand-rolled **did:peer:2** (numalgo 2) | **did:peer:4** (DIF standardization path; long-form + short-form) |
| Public / portable ID | None | **did:webvh v1.0** — SCID, hash-chained log, `portable: true` at inception |
| Proofs | N/A | Data Integrity **`eddsa-jcs-2022`** on webvh log entries |
| Key storage | Ruleset **`ent:`** (`didSecrets`, `didDocs`, …) | **Engine primitive** — KRL never reads private keys |
| OS integration | Separate **`io.picolabs.did-o`** install | **Wrangler core** — no consumer-installed DID ruleset |

Extending `dido.ts` would inherit wrong storage boundaries, stale crypto dependencies, and spec drift. A **greenfield engine identity module** (name TBD: `identity`, or a replaced `dido`) is the correct path.

---

## Target specifications

### did:webvh v1.0 — portable pico identity

- Spec: [The did:webvh DID Method v1.0](https://identity.foundation/didwebvh/v1.0/) (DIF)
- One **append-only DID log** (`did.jsonl`) per pico, hosted by the engine over HTTPS
- **SCID** (self-certifying identifier) fixed for the life of the DID; verifiers detect log tampering
- **`portable: true` at inception only** — host/path may change on mesh move while SCID + history are retained
- **`nextKeyHashes`** for pre-rotation — **supported by `didwebvh-ts`; deferred in Epic 3 baseline** (see [pico-identity-layer2-work.md](./pico-identity-layer2-work.md) Epic 3)
- **Witnesses / watchers** — library + spec capability; **deferred** as **identity infrastructure pico** (single KRL-deployed actor; see [layer-2 work doc](./pico-identity-layer2-work.md#identity-infrastructure-pico-future))
- DIDComm **service endpoints** in the resolved DID document
- Parallel **`did:web`** document (`did.json`) may be published for backward compatibility (§3.7.10)

### did:peer numalgo 4 — subscription relationships

- Spec: [Peer DID Method Specification](https://identity.foundation/peer-did-method-spec/) — Method 4
- DIF standardization proposal includes **numalgo 4 only** (earlier numalgos deprecated for new work)
- **Long-form** DID embeds the input document; **short-form** is a hash over the long form
- Exchange long form once at **subscription formation**; use short form in ongoing DIDComm traffic
- Maps cleanly onto today's model: one pairwise relationship per subscription, privacy-preserving, no ledger

Numalgo 2 remains common in legacy Aries deployments. We do **not** need interop with those agents for v1 of pico identity; greenfield picos use numalgo 4.

### Why both methods (not webvh-only)

Pico-engine uses **did:webvh for the actor** and **did:peer for each subscription**. They are complementary, not redundant. Full decision matrix, anti-patterns, infrastructure mapping, and credential rules: **[pico-identity-layer2-work.md § Dual-DID design rationale](./pico-identity-layer2-work.md#dual-did-design-rationale)**.

Summary:

- **did:webvh** — passport: portable SCID, hosted log, public resolution, move, **VC `iss`/`sub`**, `wrangler:myDid()`
- **did:peer** — relationship line: pairwise authcrypt for ongoing sub traffic; **never** VC subject or issuer

### DIDComm Messaging v2 — pico-to-pico transport

- Spec: [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/) (DIF-ratified; v2.1 is latest stable)
- Profile: **`didcomm/v2`** — not `didcomm/aip2;env=rfc587`
- Required-to-implement content encryption: **A256CBC-HS512**
- Authcrypt: **ECDH-1PU** key agreement (X25519 and/or P-256)
- **DIDComm DID Rotation** (`from_prior`) for endpoint/key changes after a move
- Transport: continue **HTTP POST to sky/event** endpoints (encryption + identity on top of existing mesh HTTP); mediators optional later

### W3C DID Core 1.0

Both methods produce standard DID documents consumed by resolvers and DIDComm pack/unpack.

---

## Library selection

Principle (same as passkeys and OAuth): **libraries handle crypto and ceremony; the engine owns storage, HTTP serving, and verification at the door.** Do not adopt Credo or Veramo as full agents.

### did:webvh — `didwebvh-ts`

| | |
|--|--|
| **Package** | [`didwebvh-ts`](https://www.npmjs.com/package/didwebvh-ts) |
| **Version** | **≥ 2.8.0** (targets did:webvh v1.0; pin deliberately on upgrade — 2.8.0 fixed conformance issues in earlier releases) |
| **Role** | `createDID`, `updateDID`, `deactivateDID`, `resolveDID`, witness proof helpers, parallel `did:web` doc generation |
| **Engine adds (Epic 3 baseline)** | Persist log + keys in engine DB; HTTP routes for `did.jsonl`, resolver; map DIDComm service endpoints to sky/event URLs |
| **Engine defers (library already supports)** | Pre-rotation (`nextKeyHashes`), `did-witness.json` / witness ceremony, watcher replication — see Epic 3 out-of-scope in layer-2 work doc |
| **Alternatives rejected** | `@credo-ts/webvh` — thin wrapper around the same library plus agent framework; no benefit for pico-engine |

Reference implementation from the DIF did:webvh working group; actively maintained (npm updates through 2026).

### did:peer — numalgo 4

| Option | Package / source | Use when |
|--------|------------------|----------|
| **Preferred** | [`decentralized-identity/did-peer-4`](https://github.com/decentralized-identity/did-peer-4) | Vendoring or thin npm wrapper — DIF reference + test suite; best spec fidelity |
| **Alternative** | [`@veramo/did-provider-peer`](https://www.npmjs.com/package/@veramo/did-provider-peer) v7 | Faster npm integration; create/control peer DIDs without full Veramo agent |
| **Fallback** | [`@credo-ts/core`](https://www.npmjs.com/package/@credo-ts/core) peer registrar | Only if Veramo peer path is unsatisfactory — heavier API surface |

| Option | Rejected / deferred |
|--------|---------------------|
| Extend `dido.ts` numalgo-2 encoder | Legacy; not the standardization path |
| `@aviarytech/did-peer` | Numalgo 2–oriented; superseded for new work |
| `@openvtc/vti-didcomm-js` peer module | **Numalgo 2 only** (explicitly not 4) — fine for DIDComm crypto experiments, wrong for latest peer spec |

### DIDComm v2 — `@veramo/did-comm` v7

| | |
|--|--|
| **Package** | [`@veramo/did-comm`](https://www.npmjs.com/package/@veramo/did-comm) v7 |
| **Role** | `packDIDCommMessage` / `unpackDIDCommMessage` — authcrypt and anoncrypt JWE envelopes; integrate with custom `DIDResolver` + secrets adapter backed by engine storage |
| **Dependencies** | `@noble/curves`, `did-resolver`, `did-jwt` — acceptable, already aligned with modern Node crypto |
| **Gaps to accept** | No `authcrypt+jws` emit (spec says SHOULD NOT emit); sufficient for pico event/query messaging |

| Option | Notes |
|--------|-------|
| **`didcomm-node` (current)** | **Drop.** Frozen ~2023; WASM wrapper; tied to old integration |
| **`@openvtc/vti-didcomm-js`** | Attractive: small, ESM, cross-tested vs Rust `affinidi-messaging-didcomm`, bundles `didwebvh-ts` resolver. **Deferred** until we confirm ESM integration story and numalgo-4 peer needs are met elsewhere |
| **`@credo-ts/didcomm`** | DIDComm v2 still opt-in/experimental in Credo; full agent model |
| **Full Veramo / Credo agent** | Rejected — fights engine-owned storage and wrangler ergonomics |

### Supporting libraries (as needed)

| Package | Role |
|---------|------|
| [`did-resolver`](https://www.npmjs.com/package/did-resolver) | Unified resolver registry (webvh + peer + cached docs) |
| [`did-jwt`](https://www.npmjs.com/package/did-jwt) | JWS/JWE helpers if Veramo doesn't cover a narrow case |
| [`json-canonicalize`](https://www.npmjs.com/package/json-canonicalize) | Already a transitive dep of `didwebvh-ts`; canonical JSON for proofs |

---

## Architecture: engine ← wrangler ← apps

```
┌─────────────────────────────────────────────────────────────────┐
│  Manifold / apps — "join community", "adopt pico", HA, MCP      │
└────────────────────────────┬────────────────────────────────────┘
                             │ wrangler one-liners
┌────────────────────────────▼────────────────────────────────────┐
│  Wrangler (OS)                                                   │
│  • myDid() / callerDid()                                         │
│  • Subscription formation → exchange did:peer:4 long forms       │
│  • picoQuery / event:send route via DIDComm when target is DID   │
│  • DID Rotation ceremony after move (wrangler triggers engine)   │
└────────────────────────────┬────────────────────────────────────┘
                             │ engine module API (no raw keys)
┌────────────────────────────▼────────────────────────────────────┐
│  Engine identity module (new)                                    │
│  • didwebvh-ts: create/update/serve/resolve per-pico log         │
│  • did:peer:4: generate at subscription, store pairwise docs     │
│  • @veramo/did-comm: pack/unpack, from_prior rotation            │
│  • Sign/verify at engine door (request authentication)           │
│  • Engine DB: keys, logs, peer docs, pending rotations, routes     │
│  • HTTP: did.jsonl, resolver, DIDComm → sky/event ingress        │
└─────────────────────────────────────────────────────────────────┘
```

**Deprecated (reference only):**

- `packages/pico-engine-core/src/modules/dido.ts` — retire after migration window
- `packages/pico-engine/krl/io.picolabs.did-o.krl` — behaviors move to wrangler; ruleset uninstall path for existing picos
- Wrangler `did_o_url` sibling-install wiring — remove when did-o is retired

---

## Engine module surface (sketch)

Exact names TBD; capabilities the new module must expose to wrangler/KRL:

| Capability | Library | Notes |
|------------|---------|-------|
| `ensureWebvhDid(picoId)` | didwebvh-ts | Create at pico birth if missing; `portable: true` |
| `getMyDid(picoId)` | engine state | Returns current did:webvh string |
| `updateWebvhEndpoint(picoId, …)` | didwebvh-ts | After move — new host/path in log |
| `createPeerDid(picoId, subscriptionId)` | did-peer-4 / Veramo | Pairwise DID for one subscription |
| `resolveDid(did)` | didwebvh-ts + peer resolver | Cache resolved docs (JWKS-like TTL) |
| `packMessage(…)` / `unpackMessage(…)` | @veramo/did-comm | DIDComm v2 authcrypt |
| `signRequest(…)` / `verifyRequest(…)` | engine + resolved keys | Engine-door auth (Phase 3) |
| `prepareRotation(…)` / `applyFromPrior(…)` | @veramo/did-comm + didwebvh-ts | Move + subscription continuity |

KRL sees **capabilities**, not JWKs. Private keys never appear in `ent:` or query results.

---

## Module packaging and ESM

Pico-engine-core is **CommonJS** (`main: dist/index.js`). Target libraries differ:

| Library | Module system | Integration approach |
|---------|---------------|----------------------|
| `didwebvh-ts` | ESM-oriented | Dynamic `import()` from identity module, or small **`pico-engine-identity` ESM subpackage** |
| `@veramo/did-comm` v7 | Node-friendly CJS/ESM | Direct import likely works |
| `did-peer-4` (vendored) | TS source | Compile into engine or subpackage |

**Recommendation:** spike dynamic import of `didwebvh-ts` + `@veramo/did-comm` in a test harness before committing to a separate package. If ESM friction is high, isolate identity crypto in `packages/pico-engine-identity` (ESM, Node 20+) consumed by pico-engine-core.

Node **≥ 20** is already required (`engines` in pico-engine-core).

---

## Phased implementation

Aligned with [MEMORY.md §5 phased path](../../MEMORY.md); library work per phase:

### Phase 1 — did:webvh per pico

- Add engine identity store (schema for log, keys, metadata)
- Integrate `didwebvh-ts`: create at pico provisioning (`portable: true`)
- HTTP: serve `did.jsonl` under engine's DID path mapping
- Wrangler: `wrangler:myDid()` returns did:webvh string
- **No verify at door yet** — identity exists but is not enforced

**Exit criteria:** resolve a pico's DID from another engine via HTTPS; log verifies against SCID.

### Phase 2 — did:peer on subscriptions

- Numalgo 4 create + long-form exchange in wrangler subscription formation
- Store pairwise DID docs in engine (both sides of subscription)
- Record peer DID on subscription record (alongside ECI)
- **No DIDComm traffic yet** — DIDs exist for relationships

**Exit criteria:** two picos subscribe; each holds the other's peer DID; short form used in stored state.

### Phase 3 — DIDComm messaging + engine-door verify

- `@veramo/did-comm` pack/unpack wired to sky/event ingress (replace `dido:route` behavior)
- `picoQuery` / cross-pico `event:send` use DIDComm when target is a DID
- Sign/verify on engine API requests where policy requires caller identity
- Retire direct `dido:*` calls from wrangler

**Exit criteria:** authcrypt message round-trip between two picos; engine rejects unsigned caller where required.

### Phase 4 — Rotation and move

- `updateDID` via didwebvh-ts for new host/path ([pico-move.md Phase D](./pico-move.md))
- DIDComm `from_prior` rotation to surviving peer subscriptions
- Wrangler migration hooks on import

**Exit criteria:** simulated move — SCID unchanged, peer subscription still works after rotation.

### Phase 5 — VC policy (later)

- `/whois`, conferred-rights VCs, deny-by-default evaluator
- **VC subject and issuer DIDs:** always **did:webvh** (actor identity), never did:peer — see [layer-2 work doc § Dual-DID](./pico-identity-layer2-work.md#dual-did-design-rationale)
- Presentation may be sent over DIDComm to a **did:peer**; proofs still reference holder/issuer **webvh**
- Out of scope for initial library integration; plan resolver hooks only

---

## Migration from `dido` / `did-o`

For the small number of picos that may have experimented with `io.picolabs.did-o`:

1. **Do not** auto-convert did:peer:2 → did:peer:4 — treat as new relationships
2. One-time export of `ent:didSecrets`, `didDocs`, `didMap`, `pendingRotations`, `routes` from did-o ruleset → engine identity store (if any production data exists)
3. Uninstall `io.picolabs.did-o`; remove wrangler sibling-install URL
4. Remove `dido` module from pico-engine-core after deprecation period
5. Document breaking change in CHANGELOG when Phase 3 ships

No commitment to interop with did:peer:2 identities created by the old module.

---

## Testing strategy

| Layer | Approach |
|-------|----------|
| did:webvh | `didwebvh-ts` test vectors; round-trip create → serve → resolve |
| did:peer:4 | DIF [`did-peer-4`](https://github.com/decentralized-identity/did-peer-4) test suite (vendored) |
| DIDComm | `@veramo/did-comm` unit tests; cross-engine integration test (two pico-engine instances) |
| Engine door | Request sign/verify against cached resolved doc |
| Regression | Ensure OAuth and passkey layers unaffected |

Consider interop smoke test against `didwebvh-ts` resolver examples and, optionally, `vti-didcomm-js` wire format (same A256CBC-HS512 profile) without adopting that package yet.

---

## Open questions

1. **Module name** — keep `dido` (breaking reboot) vs new `identity` module name?
2. **did-peer-4 packaging** — vendored TS vs npm wrapper vs Veramo-only?
3. **P-256 vs X25519** — didwebvh v1.0 and DIDComm v2 allow both; default to **Ed25519 + X25519** (matches existing dido key types) unless interop requires P-256?
4. **Witnesses** — defer until after Phase 4; engine-as-host sufficient initially?
5. **Mediator support** — out of scope for Phase 3; direct HTTP only?

---

## Deployment posture: not turn-key SaaS

This identity design assumes a **deliberate departure** from the original hosted Manifold model.

| Legacy Manifold | Current direction |
|-----------------|-------------------|
| Turn-key SaaS — sign in with Gmail, use immediately | **Self-hosted pico-engine** — operator runs the runtime |
| Central Picolab service | **No required central operator** — each mesh is local or community-run |
| Identity implied by the hosted account | **Passkeys + OAuth + (future) DIDs** on the operator's engine |

**What using it requires today (honest):**

- A **pico-engine** instance — passkeys, OAuth, discovery, and (when built) did:webvh log hosting
- For the reference integrator path: a **Home Assistant** instance with the Manifold hub (`pico_mesh`) and any companions (e.g. sensor-network)
- Operator effort for Docker/volumes, TLS, OAuth redirect URIs, and mesh bootstrap — not zero, but documented (see `manifold-home-assistant/docs/LOCAL.md`)

**Why multi-tenancy matters:** The engine supports **many root picos and many owners on one process**. That enables **community-scale deployment** without Picolab running a global service: a neighborhood sensor co-op, a campus lab, a small facility, or a trusted steward hosting one engine for several families. Identity primitives (passkey per root, mesh-scoped OAuth, portable did:webvh) are designed for **distributed operators**, not a single Gmail-gated cloud app.

This is a feature for ONE Summit's edge/open-networking audience: **infrastructure you can run**, relationships you can port, integrators (HA, MCP) that attach via OAuth without becoming the pico.

**Framing (see [one-summit-japan-2026-cfp.md](./one-summit-japan-2026-cfp.md) § Talk strategy):** Identity is the **hook** for conference talks; the **goal** is pico visibility. Picos are **actors** (actor model), not "agents." The three properties identity makes credible: **identity permanence**, **data permanence**, **internet-native**.

---

## Related documents

- [MEMORY.md §5 — Pico identity: DID/DIDComm](../../MEMORY.md)
- [pico-move.md](./pico-move.md) — relocation phasing and ECI vs DID
- [one-summit-japan-2026-cfp.md](./one-summit-japan-2026-cfp.md) — identity architecture talk (three planes)
- Specs: [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/) · [Peer DID Method](https://identity.foundation/peer-did-method-spec/) · [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/)
