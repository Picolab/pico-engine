# SKY protocol on DIDComm v2

**Status:** draft (2026-08-01)  
**Version:** 1.0  
**Context:** Formal DIDComm protocol for **cross-mesh** and **remote** pico-to-pico communication in pico-engine **1.6**. **Intra-mesh** subscriptions on the same engine use **verified local dispatch** (no DIDComm) — see [pico-identity-layer2-work.md § Intra-mesh verification](./pico-identity-layer2-work.md).

**Related:** [pico-identity-layer2-work.md](./pico-identity-layer2-work.md) · [pico-identity-libraries.md](./pico-identity-libraries.md) · [MEMORY.md §5](../../MEMORY.md)

**Normative references:**

- [DIDComm Messaging v2.0](https://identity.foundation/didcomm-messaging/spec/v2.0/)
- [did:peer Method 4](https://identity.foundation/peer-did-method-spec/)
- [did:webvh v1.0](https://identity.foundation/didwebvh/v1.0/)

---

## 1. Goals

| Goal | Detail |
|------|--------|
| **Inter-pico events** | Raise sky events on a remote pico over a subscription (**cross-engine via DIDComm**) |
| **Inter-pico queries** | Request/response queries (`picoQuery`) with correlation (**cross-engine**) |
| **Introduction** | Establish subscriptions by exchanging **did:peer:4** long-forms (DIDComm or local wrangler) |
| **Policy preservation** | Inbound messages evaluated against the subscription's internal Rx channel policy |
| **Crypto identity** | Authcrypt to **did:peer** (cross-engine subs) or **did:webvh** (public intro) |

## 2. Transport selection

| Condition | Transport | Spec section |
|-----------|-----------|--------------|
| **Intra-mesh** (same `meshRootId`) + recipient on this engine | **Verified local dispatch** — no DIDComm | §4.1 |
| **Cross-mesh** (different mesh roots) | **SKY over DIDComm** — **always**, even if same engine process | §4.2+ |
| Recipient not on this engine | **SKY over DIDComm** | §4.2+ |
| **Public intro** (`publicIntro: true`) | **SKY over DIDComm** to did:webvh | §7 |
| Family parent↔child | Local only (not SKY) | — |
| OAuth integrators | HTTP `/sky/*` + ECI (not SKY) | — |

**Rationale:** Multi-tenant engines host **many meshes**. Same-engine is not same-trust-domain. Intra-mesh traffic (thing → community under one root) avoids DIDComm overhead when picos are local. Cross-mesh traffic needs crypto on the wire even when co-hosted.

**Mesh move:** Cross-mesh subs **always** used DIDComm — move updates **endpoints** (did:webvh rotation), not transport class. Intra-mesh subs stay local when the whole mesh relocates together.

## 3. Non-goals (1.0)

| Out of scope | Mechanism instead |
|--------------|-------------------|
| Human / app integrators | OAuth + HTTP `/sky/*` + ECI (Layer 3) |
| Family parent↔child | Local `ctx:query` / event |
| Mediators / forward routing | Direct HTTP POST to service endpoint |
| DID rotation on move | SKY 1.1 / pico-move Phase D (`from_prior`) |
| Legacy ECI-only subscriptions | Unchanged HTTP/local routing |
| **Same-engine established subs** | Verified local dispatch (not DIDComm) |
| **Cross-mesh on same engine** | DIDComm (not local) |

---

## 4. Architecture overview

### 4.1 Intra-mesh (verified local dispatch)

Not DIDComm. Applies when **caller and recipient share the same mesh root id** and recipient is on this engine.

```
  Pico A (caller)                         Pico B (recipient)
    │ wrangler:picoQuery / event:send       │
    ▼                                       │
  Engine cross-pico primitive               │
    • caller pico id from rsCtx             │
    • caller.meshRootId === recipient.meshRootId │
    • authorize outbound subscription       │
    • peer DID binding check                │
    • recipient pico local to this engine   │
    ▼                                       ▼
  ctx:query(internal_rx_eci) / local event
    • fromPicoID = A
    • callerDid = A's did:webvh
    • assert Rx channel policy → bus
```

**Security:** KRL cannot forge another pico's id. **Cross-mesh** subscriptions on the same engine **must not** use this path — they use §4.2 DIDComm even though co-hosted.

### 4.2 Cross-mesh / remote (SKY over DIDComm)

```
  Pico A                              Pico B (recipient)
    │  SKY message (plaintext)             │
    │  type: …/sky/1.0/event             │
    │  from: did:peer:4…  (short)          │
    │  to:   did:peer:4…                   │
    │                                      │
    │  ── DIDComm authcrypt (JWE) ──────► │
    │     POST {pico ingress endpoint}     │
    │     /sky/event/{ingress_eci}/      │
    │       none/dido/didcomm_message      │
    │                                      │
    │                    unpack + verify   │
    │                    map sender peer   │
    │                      DID → sub       │
    │                    assert Rx policy  │
    │                    deliver to bus    │
```

**Addressing (cross-mesh / remote):**

- **Wire target:** recipient's **did:peer:4** (short form)
- **Ingress:** **one ingress ECI per pico** (not per subscription); route by sender peer DID
- **Policy:** internal **Rx channel** per subscription (engine-local)

---

## 5. DIDComm profile

| Setting | Value |
|---------|-------|
| **Profile** | `didcomm/v2` only (no `didcomm/aip2`) |
| **Encryption** | Authcrypt (ECDH-1PU + A256KW + A256CBC-HS512) |
| **Plaintext type** | `application/didcomm-plain+json` |
| **Encrypted type** | `application/didcomm-encrypted+json` |
| **Service endpoint** | `#didcommmessaging-0` in DID doc; `accept: ["didcomm/v2"]` |

Service endpoint URI — **one per pico** (in did:webvh doc and optionally replicated on peer DIDs):

```
https://{engine-host}/sky/event/{pico_ingress_eci}/none/dido/didcomm_message
```

`{pico_ingress_eci}` is provisioned at pico create (or first cross-engine need). **All subscriptions** on that pico share this ingress; the engine routes by **`from` peer DID** → subscription → internal Rx channel.

Peer DID service endpoints MAY point to the same URI (recommended) rather than per-subscription URLs.

---

## 6. Message type registry

All SKY protocol types use the namespace **`https://picolabs.org/sky/1.0/`**:

| Type URI | Direction | Purpose |
|----------|-----------|---------|
| `…/intro` | A → B | Request subscription; offer did:peer long-form |
| `…/intro-response` | B → A | Accept or reject; offer reciprocal did:peer long-form |
| `…/event` | A → B | Raise event on recipient pico |
| `…/query` | A → B | Query request |
| `…/query-response` | B → A | Query result or error (`thid` → query `id`) |

Future types (not in 1.0): `…/rotate`, `…/rotate-ack` for DIDComm DID Rotation on move.

---

### Common DIDComm envelope fields

All SKY messages MUST include standard [DIDComm message fields](https://identity.foundation/didcomm-messaging/spec/v2.0/#message-format):

| Field | Required | Notes |
|-------|----------|-------|
| `id` | ✓ | Unique message id (UUID or cuid) |
| `type` | ✓ | One of §5 URIs |
| `from` | ✓ | Sender **did:peer:4** short form (intro: may use long form on first message) |
| `to` | ✓ | Recipient **did:peer:4** or **did:webvh** (intro only) |
| `created_time` | ✓ | Unix seconds |
| `body` | ✓ | SKY payload (§7–§9) |
| `thid` | query-response | MUST equal the `id` of the `…/query` being answered |
| `from_prior` | optional | Post-1.0: DID rotation (deferred) |
| `expires_time` | optional | Recommended for intro messages (e.g. +300s) |

---

## 7. Introduction messages

Introduction replaces the legacy wrangler `new_subscription_request` event payload for **1.6+ subscriptions**, while preserving the same **semantic fields** from `io.picolabs.subscription`.

### 7.1 `…/intro`

**Sender:** prospective subscriber (pico A)  
**Recipient:** target pico (pico B) — `to: did:webvh:…` if public intro; otherwise `to: did:peer:…` of an existing relationship path if applicable.

**Body:**

```json
{
  "sky_version": "1.0",
  "name": "Temperature Network",
  "channel_type": "Tx_Rx",
  "Tx_role": "member",
  "Rx_role": "community",
  "peer_did_long": "did:peer:4z…:z…",
  "Tx_host": "https://engine-a.example.com"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `sky_version` | ✓ | `"1.0"` |
| `name` | ✓ | Subscription name (same as wrangler `subscription` event) |
| `channel_type` | | Default `"Tx_Rx"` |
| `Tx_role` | ✓ | Sender's role in the relationship |
| `Rx_role` | ✓ | Requested role for recipient |
| `peer_did_long` | ✓ | Sender's **did:peer:4 long form** for this subscription |
| `Tx_host` | | Engine base URL for sender (omit or null if same host) |

**Recipient behavior:**

- If `publicIntro: false` and message arrived on did:webvh → **reject** (ignore or intro-response with error)
- If accepted → create inbound pending subscription, internal Rx + ingress channels, store sender's long-form peer DID

### 7.2 `…/intro-response`

**Body (accept):**

```json
{
  "sky_version": "1.0",
  "status": "accepted",
  "subscription_id": "cuid-…",
  "peer_did_long": "did:peer:4z…:z…",
  "Tx_host": "https://engine-b.example.com"
}
```

**Body (reject):**

```json
{
  "sky_version": "1.0",
  "status": "rejected",
  "reason": "auto_accept_denied",
  "detail": "optional human-readable string"
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `status` | ✓ | `"accepted"` \| `"rejected"` |
| `subscription_id` | if accepted | Recipient's subscription id (maps to `ent:established[].Id`) |
| `peer_did_long` | if accepted | Recipient's **did:peer:4 long form** |
| `Tx_host` | if accepted | Recipient engine base URL |

**On accept:** both sides store peer DIDs (long + short), move subscription to `established`, and use **short-form did:peer** for all subsequent SKY messages.

### 7.3 Introduction state machine

```
                    ┌──────────────┐
                    │   (start)    │
                    └──────┬───────┘
                           │ SKY intro
                           ▼
                    ┌──────────────┐
         reject ◄───│   pending    │───► accept
                    │  (inbound/   │
                    │   outbound)  │
                    └──────┬───────┘
                           │ intro-response accepted
                           ▼
                    ┌──────────────┐
                    │  established │
                    │  (did:peer   │
                    │   traffic)   │
                    └──────────────┘
```

**Paths into `intro`:**

| Path | `to` address | When |
|------|--------------|------|
| **Public intro** | Recipient **did:webvh** | `publicIntro: true` (root, tag registry, community, …) |
| **Mesh intro** | Recipient **did:webvh** or peer via introducer | Parent/community introduces; may relay over existing subscription in future — 1.0: direct to target did:webvh if public, else via wrangler-mediated intro over existing peer sub |

**Auto-accept:** existing `io.picolabs.subscription` `autoAcceptConfig` rules apply after intro body is validated; approval may send `intro-response` without UI.

### 7.4 Mapping from legacy wrangler events

| Legacy (ECI subscription) | SKY 1.0 |
|---------------------------|---------|
| `wrangler:subscription` + `wellKnown_Tx` ECI | `…/intro` to target **did:webvh** or known peer |
| `new_subscription_request` attrs | `…/intro` body fields |
| `outbound_pending_subscription_approved` | `…/intro-response` accepted |
| `ent:established[].Tx` / `.Rx` ECIs | `peer_did_short` + ingress ECI (internal) |

---

## 8. Event messages

### 8.1 `…/event`

Carries a sky event equivalent to `POST /sky/event/{eci}/{eid}/{domain}/{type}`.

**Body:**

```json
{
  "sky_version": "1.0",
  "eid": "none",
  "domain": "manifold",
  "name": "notification",
  "attrs": {
    "message": "threshold exceeded",
    "severity": "warn"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `sky_version` | ✓ | `"1.0"` |
| `eid` | | Event id segment; default `"none"` |
| `domain` | ✓ | KRL event domain |
| `name` | ✓ | KRL event name |
| `attrs` | ✓ | Event attributes map (JSON object) |

**Recipient processing:**

1. Unpack JWE; verify authcrypt
2. Resolve `from` peer DID → subscription record
3. `assertEventPolicy` on subscription's **internal Rx channel**
4. Raise event on recipient pico bus with `callerDid` = `from`
5. Return HTTP 200 with optional directives JSON (same shape as sky event HTTP response)

**No `…/event-response` in 1.0** — events are one-way. Query-style event/query combos use HTTP sky paths or `…/query` separately.

---

## 9. Query messages

### 9.1 `…/query`

Equivalent to `GET/POST /sky/query/{eci}/{rid}/{function}`.

**Body:**

```json
{
  "sky_version": "1.0",
  "rid": "io.picolabs.wrangler",
  "name": "name",
  "args": {}
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `sky_version` | ✓ | `"1.0"` |
| `rid` | ✓ | Ruleset id / module |
| `name` | ✓ | Function name |
| `args` | ✓ | Query arguments map |

### 9.2 `…/query-response`

**MUST** set `thid` to the `id` of the corresponding `…/query` message.

**Body (success):**

```json
{
  "sky_version": "1.0",
  "status": "ok",
  "result": "My Pico Name"
}
```

**Body (error):**

```json
{
  "sky_version": "1.0",
  "status": "error",
  "error": "QUERY_SELF_INVALID_HTTP_MAP",
  "error_str": "optional description",
  "result": null
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `status` | ✓ | `"ok"` \| `"error"` |
| `result` | if ok | Query return value (any JSON) |
| `error` | if error | Machine-readable key (align with wrangler `picoQueryError`) |
| `error_str` | | Human-readable detail |

**Sender (`picoQuery`) behavior:**

1. Send `…/query`; retain `id`
2. Await `…/query-response` with matching `thid` (timeout: engine default, e.g. 10s — same as legacy `dido:sendQuery`)
3. Map to wrangler `picoQuery` return / error map

**Recipient processing:**

1. Unpack; map `from` → subscription
2. `assertQueryPolicy` on internal Rx channel
3. Execute `ctx:query` equivalent on recipient pico
4. Send `…/query-response` authcrypt to sender's peer DID

---

## 10. HTTP binding

### 10.1 Inbound

```
POST /sky/event/{ingress_eci}/none/dido/didcomm_message
Content-Type: application/didcomm-encrypted+json

{JWE compact serialization}
```

| Case | Response |
|------|----------|
| Unpack / verify failure | `401` or `403` |
| Unknown sender peer DID | `404` |
| Policy denial | `403` |
| Event delivered | `200` + directives JSON |
| Query delivered | `200`; response sent as separate DIDComm message (async) |

**Note:** For queries, the HTTP response body may be `{ "status": "accepted" }` while the actual result arrives in `…/query-response` over DIDComm. Implementations MAY alternatively block HTTP until query-response is sent (simpler for `picoQuery`; recommended for 1.6).

### 10.2 Outbound

Resolve recipient's peer DID document → `service[0].serviceEndpoint.uri` → HTTP POST JWE.

For **cross-engine**, `Tx_host` in subscription record selects engine base URL; DID resolution confirms endpoint.

---

## 11. Policy and channel model

Inbound **DIDComm** SKY messages target the pico's **single ingress ECI** for routing only. Policy runs on the subscription's **internal Rx channel**:

```
DIDComm → pico_ingress_eci (route only)
       → subscription lookup by sender peer DID
       → internal_rx_eci.assertEventPolicy / assertQueryPolicy
       → pico bus
```

**Intra-mesh** messages skip ingress entirely; engine delivers directly to `internal_rx_eci` after authorization (§4.1).

Ingress channel event policy SHOULD allow only:

```json
{
  "allow": [{ "domain": "dido", "name": "didcomm_message" }],
  "deny": []
}
```

OAuth **does not** apply to DIDComm ingress channels.

---

## 12. Identity fields in DID documents

**Design reference:** Why both methods exist, decision matrix, VC rules — [pico-identity-layer2-work.md § Dual-DID design rationale](./pico-identity-layer2-work.md#dual-did-design-rationale).

| Role | DID |
|------|-----|
| Actor identity (portable, credentials, `myDid`) | **did:webvh** |
| Subscription relationship (ongoing DIDComm) | **did:peer:4** |

### 12.1 did:webvh (every pico)

- Provisioned at create; `portable: true`
- Service endpoint points to default DIDComm ingress OR a pico-level staging endpoint for **public intro only**
- `publicIntro: false` → engine rejects unsolicited `…/intro` on webvh endpoint

### 12.2 did:peer:4 (per subscription)

- Long form exchanged in `…/intro` / `…/intro-response`
- Short form used in `from` / `to` on cross-engine messages
- Service endpoint in peer input doc SHOULD reference the pico's **shared ingress** URI
- **Not** used as VC `iss` or `sub` — credentials bind to the actor's **did:webvh**

---

## 13. Error codes (intro-response / query-response)

| Code | Meaning |
|------|---------|
| `public_intro_disabled` | Target pico has `publicIntro: false` |
| `auto_accept_denied` | Subscription auto-accept rules rejected intro |
| `invalid_peer_did` | Long-form did:peer failed validation |
| `duplicate_subscription` | Equivalent subscription already established |
| `policy_denied` | Rx channel policy rejected event/query |
| `unknown_subscription` | Sender peer DID not mapped to a subscription |
| `query_timeout` | No query-response within timeout |
| `unpack_failed` | JWE decrypt or authcrypt verify failed |

---

## 14. Examples

### 14.1 Public intro (tag registry)

1. Remote pico resolves `did:webvh:…:registry.example.com` → DID doc + endpoint
2. Sends `…/intro` authcrypt to webvh with `peer_did_long`
3. Registry accepts → `…/intro-response` with its `peer_did_long`
4. Both in `established`; further traffic uses short-form did:peer

### 14.2 Event on established subscription

```json
{
  "id": "clx…",
  "type": "https://picolabs.org/sky/1.0/event",
  "from": "did:peer:4z6Mk…",
  "to": ["did:peer:4z6Ml…"],
  "created_time": 1754068800,
  "body": {
    "sky_version": "1.0",
    "eid": "none",
    "domain": "engine_ui",
    "name": "notification",
    "attrs": { "message": "reading posted" }
  }
}
```

### 14.3 Query round-trip

**Query (`id: q1`):**

```json
{
  "id": "q1",
  "type": "https://picolabs.org/sky/1.0/query",
  "from": "did:peer:4z6Mk…",
  "to": ["did:peer:4z6Ml…"],
  "created_time": 1754068801,
  "body": {
    "sky_version": "1.0",
    "rid": "io.picolabs.wrangler",
    "name": "name",
    "args": {}
  }
}
```

**Response (`thid: q1`):**

```json
{
  "id": "r1",
  "type": "https://picolabs.org/sky/1.0/query-response",
  "thid": "q1",
  "from": "did:peer:4z6Ml…",
  "to": ["did:peer:4z6Mk…"],
  "created_time": 1754068802,
  "body": {
    "sky_version": "1.0",
    "status": "ok",
    "result": "Tag Registry"
  }
}
```

---

## 15. Versioning

| Version | Change |
|---------|--------|
| **1.0** | Initial: intro, intro-response, event, query, query-response |
| **1.1** (planned) | `…/rotate`, `…/rotate-ack`; `from_prior` on all types |

Messages include `body.sky_version` for forward compatibility. Receivers MUST reject unknown `sky_version` with `intro-response` or `query-response` error.

Type URIs are versioned in the path (`/sky/1.0/`). A future `/sky/1.1/` namespace may be introduced without breaking 1.0 implementations.

---

## 16. Implementation checklist (1.6)

| Component | Responsibility |
|-----------|----------------|
| **`dido` module (reboot)** | Pack/unpack; type dispatch; peer/webvh resolve |
| **Engine server** | `didcomm_message` route; unpack at door |
| **`io.picolabs.subscription`** | Intro state machine; store peer DIDs; ingress per sub |
| **Wrangler** | `picoQuery` / event send → SKY over did:peer |
| **Tests** | Intro E2E; event; query/`thid`; publicIntro gate; policy deny |

---

## 17. DIDComm Discover Features (planned)

**Status:** not implemented in 1.6 · **Priority:** optional (1.7+)

### Three discovery mechanisms (do not conflate)

| Mechanism | Plane | Question | Implementation |
|-----------|-------|----------|----------------|
| **Discovery channel** | Integrator (HTTP/OAuth) | What queries/events can I use on this pico? | `discovery capabilities` → `discovery capability` directives — see [discovery.md](../packages/pico-engine/public/docs/krl/discovery.md) |
| **did:webvh resolution** | Identity | Who is this pico? Where is its log? | `GET /picos/{picoId}/did.jsonl`, `wrangler:myDid()` |
| **DIDComm Discover Features 2.0** | Pico↔pico (DIDComm) | What **protocols and goal codes** does this **agent** support? | **Planned** — this section |

Integrator discovery is **not** SKY and **not** DIDComm Discover Features. Discover Features is agent-to-agent capability advertisement **before or beside** relationship formation — not a replacement for the discovery channel or for Rx channel policy after a relationship exists.

**Normative reference:** [Discover Features Protocol 2.0](https://didcomm.org/discover-features/2.0/) ([Aries RFC 0557](https://identity.foundation/aries-rfcs/latest/features/0557-discover-features-v2/))

### Why support it

Homogeneous pico-engine ↔ pico-engine traffic can assume SKY 1.0 after intro; **Discover Features still helps when:**

1. **Pre-intro cold query to did:webvh** — learn whether a stranger accepts public intro, speaks SKY intro/event/query, or supports a **goal-code** (e.g. borrow, sale) *before* paying for a full SKY intro round trip.
2. **Cross-ecosystem interop** — generic Aries/DIDComm agents discover what a pico supports via standard `queries` / `disclose` messages.
3. **2020 SSIoT narrative** — [*Relationships in the SSIoT*](https://www.windley.com/archives/2020/12/relationships_in_the_self-sovereign_internet_of_things.shtml) describes using DIDComm Discovery to learn if Doug is open to a sale transaction; that maps to **goal-code** disclosure, not integrator bindings.

Discover Features is **lower priority** when both sides are known pico-engine peers and intro + `publicIntro` + Rx policy suffice.

### Message types

| Type URI | Direction | Purpose |
|----------|-----------|---------|
| `https://didcomm.org/discover-features/2.0/queries` | Requester → agent | Ask what features match (protocol, goal-code, …) |
| `https://didcomm.org/discover-features/2.0/disclose` | Agent → requester | List supported features (`thid` = query `id`) |

Example query (protocol wildcard):

```json
{
  "type": "https://didcomm.org/discover-features/2.0/queries",
  "id": "q-discover-1",
  "body": {
    "queries": [
      { "feature-type": "protocol", "match": "https://picolabs.org/sky/1.*" },
      { "feature-type": "goal-code", "match": "org.picolabs.*" }
    ]
  }
}
```

Example disclose (response):

```json
{
  "type": "https://didcomm.org/discover-features/2.0/disclose",
  "thid": "q-discover-1",
  "body": {
    "disclosures": [
      { "feature-type": "protocol", "id": "https://picolabs.org/sky/1.0/intro" },
      { "feature-type": "protocol", "id": "https://picolabs.org/sky/1.0/event" },
      { "feature-type": "protocol", "id": "https://picolabs.org/sky/1.0/query" },
      { "feature-type": "goal-code", "id": "org.picolabs.relationship.owner" },
      { "feature-type": "goal-code", "id": "org.picolabs.relationship.borrower" }
    ]
  }
}
```

### Where it runs

- **Ingress:** same DIDComm door as SKY — `POST …/dido/didcomm_message` on the pico’s ingress ECI.
- **Addressing:** typically **did:webvh** (public agent) before a did:peer relationship exists; optionally did:peer post-establishment for re-negotiation (deferred).
- **Routing:** register handlers via `dido:addRoute` (same pattern as legacy trust-ping routes on wrangler setup).

### Proposed 1.7 baseline (minimal)

Engine responds to `discover-features/2.0/queries` with a **static or config-driven disclose** list:

| Disclosure | Source |
|------------|--------|
| SKY 1.0 protocol URIs (intro, intro-response, event, query, query-response) | `skyProtocol.ts` constants |
| `publicIntro` hint | `wrangler:publicIntro()` / identity store — optional goal-code or feature flag |
| Relationship goal-codes (future) | Typed relations from [pico-relationships.md](./pico-relationships.md) ReBAC work |

No ruleset participation required for v1; KRL authors do not implement discover-features per app.

### Non-goals (initial)

- Replacing the **discovery channel** or `filterBindingsForCaller`
- Wildcard query engine beyond protocol + goal-code match
- Mediators, OOB invitation combined with discover-features
- Full Aries interop certification matrix

### Implementation checklist (when scheduled)

- [ ] `dido:addRoute` for `discover-features/2.0/queries` and handler in engine or thin KRL rule
- [ ] Build disclose payload from SKY type URIs + `publicIntro`
- [ ] Pack/unpack reply as DIDComm message to requester
- [ ] Test: query to did:webvh ingress → disclose includes SKY intro URI
- [ ] Document distinction from integrator [discovery.md](../packages/pico-engine/public/docs/krl/discovery.md)

**Estimated effort:** similar to trust-ping routing (~small; not a new subsystem).

---

## Related documents

- [pico-identity-layer2-work.md](./pico-identity-layer2-work.md) — epics and decisions
- [pico-identity-libraries.md](./pico-identity-libraries.md) — `@veramo/did-comm`, didwebvh-ts
- [discovery.md](../packages/pico-engine/public/docs/krl/discovery.md) — integrator discovery (HTTP/OAuth; not SKY)
