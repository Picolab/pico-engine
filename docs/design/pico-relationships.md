# Pico relationships: nomenclature, model, and rename plan

**Status:** draft (2026-08-12)  
**Context:** Blog work on DIDs in pico-engine 1.6 surfaced a long-standing naming mismatch. The
mechanism in `io.picolabs.subscription` is a **pico-to-pico relationship** (SSI/DIDComm
*connection*), not a subscription in the RSS/SaaS sense. This document captures the correct mental
model, ties it to prior Picolabs work (Fuse, SquareTag, 2020 SSIoT essay), outlines
relationship-based authorization (ReBAC), and plans a **combined UI + KRL alias** rename without
breaking existing rulesets.

**Related:** [pico-identity-layer2-work.md](./pico-identity-layer2-work.md) ·
[layer2-subscriptions guide](../guides/layer2-subscriptions.md) ·
[Windley 2020 — Relationships in the SSIoT](https://www.windley.com/archives/2020/12/relationships_in_the_self-sovereign_internet_of_things.shtml)

---

## Summary

| Today (misleading) | Actual model | Target user-facing term |
|--------------------|--------------|-------------------------|
| Subscription | Typed, pairwise, DIDComm-backed **relationship** | **Relationship** |
| `wrangler:subscription` | Relationship formation event | `wrangler:relationship` (alias) |
| Subscriptions tab | Relationships tab | **Relationships** |
| `io.picolabs.subscription` | Relationship ruleset (RID may stay forever) | unchanged RID |

**Ship plan:** one release combining **UI relabel** and **wrangler/KRL aliases** (~1 day). No new
transport, no ruleset fork, no entity-key rename in this phase.

---

## The problem

Developers and readers import the wrong metaphor from **“subscription”**:

- RSS / Atom feeds
- SaaS billing (“subscribe to Pro”)
- Push notification opt-in

What picos actually form is closer to:

- Aries / DIDComm **connection**
- Zanzibar-style **relationship** with typed privileges
- Fuse / SquareTag **product relationship** (owner, borrower, service provider)

The 2020 essay [*Relationships in the Self-Sovereign Internet of Things*](https://www.windley.com/archives/2020/12/relationships_in_the_self-sovereign_internet_of_things.shtml)
describes Alice, her F-150, co-owners, Carol borrowing the truck, insurers, the DMV — all as
**relationships** with changing rights over time. That essay explicitly names **picos** as the
agent platform. The word “subscription” does not appear in that narrative.

---

## What the mechanism actually is

Use this framing in blog posts, Confluence, and developer onboarding:

- **Pairwise** (not broadcast)
- **Bidirectional** (queries + events both ways, with asymmetric roles)
- **Introduced** (SKY / DIDComm handshake)
- **Policy-gated** (Rx channel; relation-specific policy from community RS)
- **Long-lived** (established until cancelled)
- **Typed** (`Tx_role` / `Rx_role` — owner, borrower, mechanic, …)

That is a **relationship** or **connection** in the SSI sense, not a subscription in the RSS/SaaS
sense.

**One-line addendum for docs:** *Only **family channels** are different — they are hierarchical.
Everything else in the heterarchy (owner, borrower, insurer, mechanic) is the same mechanism with
different relationship types and privileges.*

---

## Two edge types in the pico model

| Edge | Shape | Identity plane | Examples |
|------|--------|----------------|----------|
| **Family channel** | Tree (parent ↔ child) | Hierarchy / admin | Parent queries child; child raises events to parent |
| **Relationship** (today: “subscription”) | Graph (pico ↔ pico) | Heterarchy / ReBAC | Owner, borrower, mechanic, insurer, peer mesh, community |

Do **not** invent separate primitives for insurer, DMV, mechanic, or Carol-the-borrower. They are
**relationships** on the same DIDComm-backed bus with different **relation types** and privilege
bundles.

```
Human ──passkey──► root pico ──family──► child picos
                         │
                         └── relationship (did:peer, roles, Rx policy)
                                  ├── owner / borrower / mechanic / insurer / …
                                  └── SKY + DIDComm (or verified local dispatch)
```

### How this relates to the three identity planes

| Plane | Mechanism | Relationship ruleset? |
|-------|-----------|------------------------|
| Human → root pico | Passkey (WebAuthn) | No |
| Pico → pico | Relationships + DIDs | **Yes** — this document |
| External app → mesh | OAuth + `/sky/*` | No (integrator auth, not pico graph) |

---

## Implementation today (1.6+)

| Concern | Where it lives |
|---------|----------------|
| Formation, pending, established | `io.picolabs.subscription` |
| SKY intro / DIDComm | Engine identity + subscription rules |
| Portable pico identity | **did:webvh** (`wrangler:myDid()`) |
| Pairwise relationship identity | **did:peer** (`Tx_did` / `Rx_did` on established record) |
| Enforcement | **Rx channel** event/query policy (engine door) |
| Role labels | `Tx_role`, `Rx_role` (free-form strings — semantics live in rulesets) |
| Discovery filtering | `wrangler:filterBindingsForCaller()` |

Legacy **ECI-based** formation (`wellKnown_Tx` → `wellKnown_Rx`) remains a relationship in this
sense — same ruleset, classic handshake.

---

## ReBAC: community and Manifold first, engine second

[Relationship-based access control](https://authzed.com/docs/concepts/authzed) (ReBAC — as in
Google Zanzibar / SpiceDB) fits picos naturally: authorization as tuples
`(subject, relation, object)`. **ReBAC vocabulary and lifecycle belong in Manifold and community
rulesets**, not as hard-coded engine semantics. The engine provides a **generic relationship
substrate**; domain rulesets define what `owner`, `borrower`, and `mechanic` *mean*.

### Layering (engine ← wrangler ← Manifold ← community RS)

```
Engine        generic relationship + DIDs + Rx policy enforcement at the door
Wrangler      formation, myDid, intro, callerDid, discovery channel primitives
Manifold      mesh vocabulary: thing, community, join/leave, adopt, mesh UX
Community RS  domain ReBAC: FleetOwner, borrower, mechanic, policy templates, intro rules
Mesh app      Fuse-style vehicle logic (trips, maintenance, …) on top
```

| Concern | Wrangler / engine (bare bones) | Manifold / community RS (rich) |
|---------|-------------------------------|--------------------------------|
| Form an edge | `wrangler:relationship` + `target_did` | “Add controller to fleet”, “Lend to Carol” |
| Role strings | `Tx_role`, `Rx_role` (opaque) | Typed relations: `owner`, `borrower`, `mechanic` |
| Policy | Hand-authored or generated **Rx channel** policy | **Templates per relation** (owner bundle, borrower bundle) |
| Intro rules | `publicIntro` + approve pending | “Only FleetOwner may introduce a new owner” |
| Lifecycle | cancel relationship | lend / return / sell / downgrade owner |
| Data scope | ruleset `ent:` (app/community) | borrower sees their trips; owner sees all |
| Discovery | generic bindings + `filterBindingsForCaller` | capabilities filtered by caller’s relation |

**Do not design domain relation types into the engine.** Different communities (Fleet, Registry,
Home) ship different vocabularies on the same substrate without engine releases.

### Fuse precedent

Fuse already modeled control as **relationships**, not attributes
([Fuse with two owners](https://www.windley.com/archives/2014/10/fuse_with_two_owners.shtml),
[2020 SSIoT essay](https://www.windley.com/archives/2020/12/relationships_in_the_self-sovereign_internet_of_things.shtml)):

- **Owner is a relationship** — `FleetOwner` was a subscription from an owner pico to the fleet
  pico; two owners = two relationships, not two admin roots.
- **Admin vs conferred rights** — parent/child tree = admin; capabilities (drive, read reports,
  configure) = subscription + tags + channel policy.
- **Introduction pattern** — existing owner introduces prospect → fleet mints channel/name →
  prospect subscribes with matching credentials; fleet only honors subs it created for that intro.

Pico-engine **1.6+** supplies the crypto and transport Fuse lacked at scale (did:webvh, did:peer, SKY
intro). What remains is the **domain layer** — community rulesets that assign meaning and policy to
`Tx_role` / `Rx_role`.

Example tuples (stored and enforced **in community RS logic + Rx policy**, not engine enums):

```
(pico:alice, owner,    fleet:vehicle-123)
(pico:carol, borrower, fleet:vehicle-123)
(pico:shop,  mechanic,  fleet:vehicle-123)
```

| Relation (domain) | Typical affordances |
|-------------------|---------------------|
| **owner** | Configure, revoke, broad query/event, introduce others |
| **borrower** | Narrow query/event (e.g. trips while active); no admin |
| **mechanic** | Maintenance queries/events; no ownership transfer |
| **insurer** | Telemetry read; no command |

### What the engine must keep doing

Even with ReBAC in rulesets, the engine stays responsible for:

- Enforcing **Rx channel policy** on every query/event (the door does not trust KRL alone)
- **callerDid** and subscription binding on cross-pico delivery
- Generic relationship formation, SKY intro, and DIDComm transport

Community RS **sets** policy (templates, lifecycle); engine **enforces** it. Optional wrangler
helpers (e.g. `filterBindingsForCaller`) stay relationship-aware but **domain-agnostic**.

### Engine and wrangler primitives (kernel)

These are **mechanism** — domain-agnostic. Community RS builds on top; the engine does not interpret
`owner` or `borrower`.

| Primitive | Responsibility | Today |
|-----------|----------------|--------|
| **Relationship record** | Pairwise edge: Id, name, roles, DIDs/ECIs, lifecycle | ✅ `ent:established` / inbound / outbound |
| **Typing hooks** | Opaque `Tx_role`, `Rx_role`; wrangler **`relationship_type`** (see below) | ✅ roles; ⬜ `relationship_type` |
| **Policy attachment** | Rx channel per relationship; `updateChannel` / `putChannel` | ✅ |
| **Policy enforcement** | Engine evaluates Rx (and legacy Tx) on every query/event | ✅ |
| **Identity binding** | Caller ↔ relationship (`did:peer`, sub Id, `callerDid`) | ✅ 1.6+ |
| **Formation & transport** | SKY intro, pending/approve, cancel, DIDComm / local dispatch | ✅ |
| **Lifecycle signals** | Events for rulesets to react (`subscription_added`, `subscription_removed`, …) | ✅ |
| **Lookup** | Filter established relationships by field | ✅ `established("Rx_role", …)` |
| **Auto-accept patterns** | Regex/config on pending attrs | ✅ `autoAcceptConfig` |
| **Discovery filter** | Bindings trimmed to caller’s channel policy | ✅ `filterBindingsForCaller` |

**Strengthen (still domain-agnostic):**

| Gap | Purpose |
|-----|---------|
| **`relationship_type` on bus record** | Wrangler-level class (default `peer`); drives baseline policy |
| **Policy preset application** | Wrangler helper applies a named policy map to an Rx ECI at establish time |
| **Caller context on delivery** | Optional event attrs: `callerSubId`, caller’s roles — avoid re-lookup in every rule |
| **Policy ceiling** | Engine rejects Rx policy broader than pico-level max (owner/thing/community structural types) |

**Not engine/wrangler semantics:** Fleet `owner` / `borrower` / `mechanic`; intro vouching rules;
trip data segregation; Fleet lifecycle events.

### Default relationship type: `peer`

Every pico-to-pico relationship gets a wrangler-level type **`peer`** by default. This is the **only**
relationship type built into `io.picolabs.subscription` / wrangler — not domain vocabulary.

**Why:**

- **Baseline security for all edges** — no relationship is born with empty or hand-waved policy;
  every Rx channel receives a sensible default (deny-by-default or `standard`) even when the author
  omits roles or a community RS is not installed yet.
- **One hook for OS policy** — wrangler applies the **`peer` preset** on establish; community RS
  may **extend or replace** policy when it handles `subscription_added` / `relationship_added`.
- **Domain roles stay separate** — `Tx_role` / `Rx_role` remain free-form strings for Fleet,
  Registry, etc. Fleet maps `Rx_role: "owner"` to an owner template **on top of** or **instead of**
  the peer baseline; the engine never enumerates those values.

**Bus record (proposed field):**

| Field | Default | Meaning |
|-------|---------|---------|
| `relationship_type` | `"peer"` | Wrangler relationship class; drives baseline Rx policy preset |
| `Tx_role`, `Rx_role` | `""` | Optional domain labels (community interprets) |
| `layer2` | `true` / `false` | Transport class (DID-based vs ECI-based) — orthogonal to `peer` |

Formation attrs may override `relationship_type` only for future wrangler types (none planned
besides `peer` initially). Community RS must **not** use `relationship_type` for `owner` / `borrower`
— use `Tx_role` / `Rx_role` or community events.

**Establish flow:**

```
wrangler:relationship (…)
  → SKY / legacy intro → pending → approved
  → subscription_added / relationship_added
  → wrangler/subscription RS: set relationship_type = "peer" if unset
  → apply peer Rx policy preset to new Rx ECI
  → community RS (if installed): react to event, set roles, apply domain template
```

### Wrangler policy presets (out-of-the-box)

Presets are **mechanism** — named policy maps the subscription ruleset (or wrangler) applies to the
relationship **Rx** channel. Community RS selects or merges presets; it does not define the engine
evaluator.

| Preset | Intended use |
|--------|----------------|
| **`peer`** (default) | Production baseline for every relationship — deny-by-default with narrow allow-list (wrangler/subscription queries, agreed cross-pico traffic). **Applied automatically on establish.** |
| **`permissive`** | Dev / legacy tutorials (`allow *`) — opt-in only |
| **`query-only`** | Remote may query; events restricted |
| **`minimal`** | Health/id/ping only |

Fleet (or other community RS) maps domain relations to presets + deltas, e.g.:

| Domain (`Rx_role`) | Typical preset |
|--------------------|----------------|
| `owner` | `peer` or `permissive` + owner event allows |
| `borrower` | `query-only` + trip events |
| `mechanic` | `query-only` + maintenance events |

### What wrangler ships vs what community RS ships

| Layer | Ships |
|-------|--------|
| **Engine** | Policy evaluation; caller binding; channel CRUD |
| **Wrangler / subscription RS** | `peer` type; DID vs ECI paths; **`peer` preset on every establish**; optional presets; auto-accept; intro transports; lifecycle API events |
| **Manifold** | Mesh UX; suggested `Tx_role` / `Rx_role` on formation |
| **Community RS (e.g. Fleet)** | `owner`, `borrower`, `mechanic`; templates; intro gating; lifecycle; `ent:` state |

**Rule:** no domain relation types in wrangler. **`peer` + baseline policy** is the universal
out-of-the-box kit; everything semantic is community/Manifold.

### Fleet community ruleset (sketch — Manifold / mesh-app layer)

Future work: a **Fleet** (or community-specific) ruleset on the **community pico**, consumed by
Manifold mesh builders and thing picos — not part of wrangler or the rename release.

**RID (illustrative):** `io.picolabs.fleet` or a SafeAndMine community variant installed on the
community pico.

| Responsibility | Sketch |
|----------------|--------|
| **Relation schema** | Document allowed `Tx_role` / `Rx_role` values: `owner`, `co-owner`, `borrower`, `mechanic`, `insurer` |
| **Policy templates** | Functions that return Rx event/query policy maps per relation type; applied when a relationship is established or upgraded |
| **Intro gating** | Events such as `fleet:introduce_owner`, `fleet:lend_vehicle` — only callable by picos with an established `owner` relationship to this fleet |
| **Thing coordination** | On `relationship established` with fleet tags, push or signal thing picos to apply the matching Rx template |
| **Lifecycle** | `fleet:lend` / `fleet:return` / `fleet:transfer_owner` — relation mutation without always tearing down did:peer crypto |
| **Discovery** | `discovery capability` bindings where `filterBindingsForCaller` omits owner-only queries for borrowers |
| **Entity state** | `ent:active_borrows`, `ent:owners`, trip segregation rules (borrower sees own trips only) |

**Manifold** wraps Fleet for mesh-app devs: one-liners like “attach thing to community as borrower
until Sunday” over `wrangler:relationship` + Fleet events.

**Success test (from [MEMORY.md](../../MEMORY.md)):** engine primitives stay generic; Manifold
presents friendly mesh constructs; Fuse-style scenarios work without engine knowing “vehicle” or
“fleet.”

### ReBAC phasing (revised)

| Phase | Scope |
|-------|--------|
| **Rename release** | UI + wrangler aliases; prose says *relationship*; hand-authored Rx policy unchanged |
| **Peer type + baseline policy** | `relationship_type: "peer"` default; apply **`peer` preset** on every establish |
| **Manifold + community RS** | Fleet (or first domain) ships role schema, templates, intro rules, lifecycle on `relationship_added` |
| **Optional engine helpers** | Policy preset application, caller context attrs, policy ceiling — domain-agnostic only |
| **DIDComm Discover Features** | Goal-codes per community schema — see [sky-didcomm-protocol.md §17](./sky-didcomm-protocol.md#17-didcomm-discover-features-planned) |

ReBAC **types** the relationship edge in **rulesets**; it does not replace
`io.picolabs.subscription`, DIDComm, or engine policy enforcement.

### Relationship record as the graph; policy in rulesets

The established **relationship record** on each pico (`ent:established`, plus pending queues) *is*
the ReBAC graph for that agent — distributed, not centralized:

```
(pico:alice, owner,    relationship:sub-123)  →  bus map on fleet pico + mirror on alice
(pico:carol, borrower, relationship:sub-456)  →  bus map on vehicle pico + mirror on carol
```

No separate Zanzibar/SpiceDB store is required for the common case: formation writes the edge;
cancellation removes it; `Tx_role` / `Rx_role` label the relation; **Rx channel policy** is what the
engine enforces at the door.

**Design preference:** authorization logic should live **in rulesets**, not in sidecar policy files
or a separate service operators must keep in sync. Rulesets already encapsulate behavior, entity
state, and discovery — relationship policy belongs there too.

**Direction — enrich KRL policy expressiveness** (future, not 1.7 rename):

| Today | Target |
|-------|--------|
| Channel `eventPolicy` / `queryPolicy` as allow/deny lists | Same maps, but **generated from RS functions** (Fleet templates, peer preset) |
| Policy only at channel attach time | Optional **ruleset-side policy modules** referenced from RS (still compiled into channel maps the engine evaluates) |
| ReBAC checks in ad hoc KRL | Helpers that consult **local** `relationship:established()` + roles + caller context |

The engine keeps a **small evaluator** (today: channel policy match); rulesets own **what** gets
allowed. Community RS ships owner/borrower templates as KRL functions that produce policy maps on
`relationship_added` — behavior and authorization stay in one installable unit.

**External ReBAC engines (SpiceDB, OpenFGA, Ory Keto):** Node clients exist (`@authzed/authzed-node`,
`@openfga/sdk`, `@ory/keto-client`), but all imply a **second graph** to sync from picos. Defer unless
a non-pico service needs global permission queries or standard Zanzibar interop. See
[MEMORY.md § Authorization](../../MEMORY.md) for Cedar-as-evaluator notes.

### Cedar and ReBAC (parallel pattern)

Cedar is not a relationship store; it is a **policy language** over an **externalized entity graph**
(you can model ReBAC in Cedar by representing relations as entities and writing policies that traverse
them — see Windley, *Policy as Code*).

| Cedar + external graph | Picos |
|------------------------|-------|
| Graph in DB / entity bag passed to `Authorize()` | Graph in **`ent:established`** on each pico |
| Policies in `.cedar` files or AVP | Policies as **channel maps + RS logic** (KRL-native) |
| Central eval (library or service) | Engine eval at Rx door; RS decides policy content |

Same separation of concerns — **data (graph) vs rules (policy)** — different packaging: picos keep
both on the agent, rulesets encapsulate the policy half. Cedar (or `@cedar-policy/cedar-wasm`) remains
a candidate **evaluator** if KRL policy outgrows allow/deny lists; the relationship graph would still
not move off-pico.

---

## Rename plan — combined UI + KRL aliases

Phases 1 and 2 from earlier brainstorming are **one release**. Phase 3 (new ruleset RID, entity key
renames) is **deferred** unless a strong migration story appears.

### User-facing changes

| Location | From | To |
|----------|------|-----|
| Developer UI tab | Subscriptions | **Relationships** |
| Section headings | Subscription | **Relationship** |
| Actions | Request / Cancel subscription | Request / Cancel **relationship** |
| Detail panel | Raw subscription record | Raw **relationship** record |
| Confluence / blog | Lead term | **Relationship** (note legacy KRL names) |

Optional: rename `Subscriptions.tsx` → `Relationships.tsx` (cosmetic; tab label matters more).

Rebuild UI bundle after changes: `cd packages/pico-engine-ui && npm run build`.

### Wrangler event aliases

Add parallel rules (same postlude body) in `io.picolabs.subscription.krl` and/or wrangler:

| New event (preferred) | Legacy alias (keep working) |
|-----------------------|----------------------------|
| `wrangler:relationship` | `wrangler:subscription` |
| `wrangler:pending_relationship_approval` | `wrangler:pending_subscription_approval` |
| `wrangler:relationship_cancellation` | `wrangler:subscription_cancellation` |

Optional aliases: `inbound_rejection`, `outbound_cancellation` with `relationship_*` naming.

**Lifecycle API events (final phase, 1.6.4):** each `subscription_*` lifecycle signal also raises the matching `relationship_*` event (dual raise). Rulesets may `select when wrangler relationship_added` (or legacy `subscription_added`). Includes `relationship_added`, `relationship_removed`, pending added/cancelled, `send_event_on_relationships`, and `wrangler:establishRelationship` (alias of `establishSubscription`).

Update **wellKnown_Rx** event policy and **UI channel** policies (`io.picolabs.pico-engine-ui.krl`,
`uiChannelPolicies.ts`) to allow new event names alongside old ones.

Developer UI should POST to **`wrangler/relationship`** (legacy paths still accepted).

### Query / module aliases

**No new ruleset RID required.**

Authors use module alias (works today; document as preferred):

```krl
use module io.picolabs.subscription alias relationship

relationship:established()
relationship:inbound()
relationship:outbound()
relationship:queryOnSub(subId, "io.picolabs.wrangler", "id", {})
```

Legacy module name remains valid:

```krl
subscription:established()
```

### Explicitly unchanged in this release

| Item | Reason |
|------|--------|
| Ruleset RID `io.picolabs.subscription` | Avoid reinstall / registry churn |
| Entity keys `ent:established`, `ent:inbound`, `ent:outbound` | Breaking persistence |
| Bus field `layer2` | KRL/API stability |
| `wellKnown_Rx` channel name | Legacy ECI intro path |
| Legacy wrangler events | Backward compatibility |

### Deprecation messaging

> **Relationships** are the user-facing name for pico-to-pico connections. The KRL ruleset
> `io.picolabs.subscription` and events such as `wrangler:subscription` remain supported.
> Prefer **relationship** in new rulesets and UI-facing docs.

Legacy wrangler events remain supported. **Lifecycle API events** (1.6.4+): rulesets may also listen for `relationship_added`, `inbound_pending_relationship_added`, `relationship_removed`, etc.; each is raised alongside the legacy `subscription_*` name.

---

## Implementation checklist

- [x] `subscription.krl` — alias wrangler event selectors
- [x] `wellKnown_eventPolicy` — allow `wrangler:relationship` (and related)
- [x] `pico-engine-ui.krl` + `uiChannelPolicies.ts` — UI channel policies for new events
- [x] `Relationships.tsx` — labels, headings, event URLs; tab title **Relationships**
- [x] Tab registration in pico UI shell
- [x] Rebuild `public/pico-engine-ui.js`
- [x] Test: `wrangler:relationship` with `layer2: true` establishes same as `subscription`
- [x] **Lifecycle API event aliases** — dual-raise `relationship_*` alongside `subscription_*`; selectors accept both; `send_event_on_relationships`; `wrangler:establishRelationship`
- [ ] **`relationship_type: "peer"`** on establish; apply **`peer` Rx policy preset** (future — after rename)
- [ ] Confluence: Identity child page **DIDs — Pico Identity**; Subscriptions page title → Relationships (or cross-link)
- [x] `CHANGELOG` entry
- [x] Embedded KRL docs (`event.md`, `discovery.md`) — relationship-first wording with legacy notes

**Estimated effort:** ~1 focused day.

---

## Documentation guidance

**Blog / Confluence (external language):**

- **Relationship** as primary term
- **Connection** in parentheses when speaking to DIDComm/SSI developers
- Include the six-bullet framing (see above)
- Link truck scenarios to Windley 2020 post and Fuse two-owners ([2014](https://www.windley.com/archives/2014/10/fuse_with_two_owners.shtml))
- ReBAC lives in **Manifold / community RS**, not the engine kernel

**KRL / API reference:**

- Show `relationship:*` examples first
- Note `subscription:*` and `io.picolabs.subscription` as stable legacy identifiers

**Identity System overview:**

- Keep short summary on parent page (many readers won't open child pages)
- Child page: **Relationships** (this rename) + link to formation/routing detail

---

## Future work (out of scope for alias release)

| Topic | Notes |
|-------|--------|
| **`peer` relationship type** | Default wrangler type on every edge; baseline Rx policy preset — see [§ Default relationship type: `peer`](#default-relationship-type-peer) |
| **Policy presets** | `peer`, `permissive`, `query-only`, `minimal` — wrangler mechanism; Fleet maps domain roles to presets |
| **Fleet community RS** | Domain roles, templates, intro gating, lifecycle — see [§ Fleet community ruleset](#fleet-community-ruleset-sketch--manifold--mesh-app-layer) |
| **Manifold mesh UX** | One-liners over `wrangler:relationship` + community events (join, lend, adopt) |
| **Typed relations** | `owner`, `borrower`, … — **in community RS**, not engine enums |
| **Relation lifecycle** | Lend / sell / downgrade (Alice → former_owner) — community RS + optional relation mutation |
| **Ruleset RID** | `io.picolabs.relationship` wrapper — only if alias module proves insufficient |
| **Entity rename** | `ent:relationships` in subscription ruleset — migration story required |
| **Multi-party** | Co-owners via multiple pairwise relationships (same substrate; Fuse two-owners pattern) |
| **Delegated admin** | Admin rights delegatable via relationship + policy preset — not shared passkeys; [delegated-admin-relationship.md](./delegated-admin-relationship.md) |
| **VC-conferred relations** | Credentials attach relations to existing edges |
| **DIDComm Discover Features** | Pre-intro protocol/goal-code disclosure — community goal-codes — [sky-didcomm-protocol.md §17](./sky-didcomm-protocol.md#17-didcomm-discover-features-planned) |

---

## Cross-references

- [MEMORY.md § Subscriptions are relationships](../../MEMORY.md)
- [Subscriptions (Confluence)](https://picolabs.atlassian.net/wiki/spaces/docs/pages/4032102406/Subscriptions) — formation/routing detail (title may become Relationships)
- [Identity System (Confluence)](https://picolabs.atlassian.net/wiki/spaces/docs/pages/3962044419/Identity+System)
- [pico-move.md](./pico-move.md) — relationships survive move via did:webvh SCID + did:peer rotation
- [sky-didcomm-protocol.md §17](./sky-didcomm-protocol.md#17-didcomm-discover-features-planned) — DIDComm Discover Features (pre-intro; not integrator discovery channel)
