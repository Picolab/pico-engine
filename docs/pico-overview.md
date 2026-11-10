# Picos: what they are, what they enable, and what they are for

**Status:** draft (2026-09-24)
**Audience:** anyone arriving at this repo — contributors, students, integrators — who needs the model in their head before reading the other design docs.
**Sources:** the design docs in this folder and `MEMORY.md`; the `manifold-api`, `sensor-network`, and `MCPforEXP` repos; the Picolabs wiki; and the picos-tagged posts on windley.com (2013–2026). Links at the end.

---

## 1. What picos are

A **pico** (persistent compute object) is a small, general-purpose, always-online computer that stands in for one entity: a person, a place, a device, an organization, a group, a concept, even a pothole. It has a unique identity, keeps its own state, runs its own programs, and talks to other picos by exchanging events and answering queries. Networks of picos model the world — one addressable actor per thing we care about.

Picos are **actors** in the [actor-model](https://en.wikipedia.org/wiki/Actor_model) sense. In response to a message a pico may send messages to other picos, create other picos, and change its internal state, which affects how it handles the next message. Picos share nothing except messages; one pico cannot see or touch another's state.

Three kinds of persistence distinguish picos from most other programming models:

| Property | Meaning |
|----------|---------|
| **Persistent identity** | A pico exists with one stable identity from creation until it is explicitly deleted. Since 1.6 that identity is a portable `did:webvh` that survives moving between engines. |
| **Persistent state** | A pico's state lives inside it, isolated from every other pico, and is available to any rule that runs there. No external database. |
| **Persistent availability** | Once created, a pico is always on and ready for events and queries. Restarting the engine changes nothing about what picos exist or know. |

### Anatomy of a pico

| Part | What it is |
|------|------------|
| **Rulesets and event bus** | Behavior is installed as KRL rulesets, loaded by URL and compiled to JavaScript. A rule is event-condition-action: `select when` an event expression matches, evaluate a condition, act, then a postlude that updates state and raises further events. Every incoming event is raised on the pico's internal bus; a salience graph routes it to listening rules, so installing a ruleset subscribes its rules automatically. |
| **Event-query API** | Not RESTful. The **Sky Event API** delivers events; the **Sky Cloud/Query API** calls shared functions. It is a *meta-API*: a pico's concrete API is whatever its installed rulesets provide, and it can change over the pico's life. |
| **State: entity variables and PDS** | `ent:` variables are scoped to each ruleset (a closure over its data). The **Pico Data Store** (default since 1.4) is the shared data plane on every pico — profile, namespaced general data, per-ruleset settings — written by `pds` events, read by shared functions. |
| **Channels (ECIs)** | As many channels as a pico needs, each with an Event Channel Identifier and its own event/query **policy**. Channels are non-correlatable addresses and the local authorization gate. A `discovery` channel on every pico lets integrators learn what it can do. |
| **Relationships** | Pairwise, bidirectional, policy-gated connections between picos (*subscriptions* before 1.6.2). They form the heterarchical graph applications run on, independent of the parent/child tree and of which engine hosts each pico. |
| **Parent/child tree + Wrangler** | Every pico except a root has a parent, which installs and initializes it; control of a root implies control of its subtree. **Wrangler**, the pico OS on every pico, exposes lifecycle, channels, and relationships as KRL functions and events. |
| **Identity** | Three planes: a human unlocks their **root pico** with a passkey (the root is the person's actor on the mesh); picos identify themselves to each other with **DIDs** (`did:webvh` per pico, `did:peer` per relationship, DIDComm across meshes); outside software reaches a mesh with **OAuth** tokens on `/sky/*`. |

### Where picos run

Picos live in a **pico engine**, an open-source Node.js runtime built on `pico-framework` (lifecycle, channels, LevelDB persistence) and `select-when` (event-expression matching) with a KRL compiler on top. One engine hosts many picos and, since 1.5, many independent **meshes** (a root pico and its descendants) belonging to different owners. Picos on different engines form relationships as easily as picos on the same engine; the engines need no arrangement between them. The engine runs on a Raspberry Pi and on Fargate.

The stack above the engine is strictly layered, and the layering is a design rule: engine and wrangler stay domain-agnostic; Manifold and community rulesets supply the vocabulary (owner, thing, community, borrower).

```
engine      ← primitives: picos, channels, policy, persistence, DID keys, passkeys, OAuth
wrangler    ← the OS: children, channels, relationships, discovery
manifold    ← a framework for pico meshes: owner, things, communities, registries, notifications
mesh apps   ← sensor-network, SafeAndMine, Fuse-style apps
```

### Lineage

Picos grew out of the Kynetx rules engine (2008) and its "personal cloud" era: CloudOS, SquareTag, Fuse (a production connected-car platform, 2013–2015, hundreds of customers and over a thousand devices), and a guard-tour system. The Node rewrite (2017) made the engine small and fast; 1.0 (2021) made it modular; 1.4 added PDS by default; 1.5 (July 2026) brought passkeys and OAuth into the engine; 1.6 (August 2026) shipped DID-based identity and relationships. The motivation has not changed: an Internet of Things that is decentralized, heterarchical, and interoperable — an alternative to the "CompuServe of Things," where people rent connected devices from vendors in the middle.

---

## 2. What pico features enable

The value is the combination: every entity gets a **closure over identity, data, and behavior**.

| Feature                                                  | What it enables                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Persistent identity** (`did:webvh`, channels)          | Relationships that outlive restarts and moves; reputation and history; credentials with a durable subject; revocable delegation; a lifecycle that follows the thing across owners. Why SPIFFE was set aside: it names replaceable processes; picos are actors that last.                                                                                    |
| **Persistent state and availability** (entity vars, PDS) | Databaseless programming; the running system *is* the design, visible live in the developer UI. Data control at the ruleset grain: delete the trip service before transferring a vehicle, keep the maintenance records. Twins keep working while the owner is offline.                                                                                      |
| **Rules on an event bus**                                | Each rule is a microservice for one entity. Functionality accretes — install a ruleset and its rules start listening. Correlation ids, scatter-gather, guard rules, scheduled retries, and routed error events make failure-tolerant asynchrony the default.                                                                                                |
| **Event-query meta-API + discovery**                     | A pico's API is discoverable at runtime. Home Assistant turns discovery bindings into devices and services; the MCP interface turns them into LLM tools, gated to the rulesets actually installed.                                                                                                                                                          |
| **Channels with policy**                                 | Capability-style security: an ECI is permission to do what its policy allows and nothing more. Separate channels prevent correlation, scope webhooks to one endpoint, and let discovery filter bindings per caller.                                                                                                                                         |
| **Typed, pairwise relationships**                        | Heterarchical graphs across the tree and across engines. Rights are *relationships*, not attributes: a fleet can have two owners, a truck can be lent with attenuated rights, a community can accept members from other meshes. The **introduction pattern** — an existing relationship brokers a new one — generalizes to delegation, transfer, and ReBAC. |
| **Tree + Wrangler**                                      | Programmatic lifecycle: picos create, initialize, and delete picos; prototypes stamp out configured children. Admin rights follow the tree; everything else is conferred by policy.                                                                                                                                                                         |
| **Actor concurrency**                                    | Lock-free, isolated, location-transparent. Applications shard naturally — one pico per section, sensor, vehicle — and scale by adding engines. A laptop replayed 44,504 registration events into 8,000+ section picos at 21 events/sec.                                                                                                                     |
| **Three-plane identity**                                 | Self-sovereign meshes: no central identity provider, no password database; strangers on different engines trust each other by resolving DIDs, with no federation. Integrators get scoped, revocable OAuth access without becoming the pico.                                                                                                                 |
| **Substitutable, small hosting**                         | A Pi, a community server, or a cloud, with picos movable between them. Compute moves toward the data, and a vendor's cloud shutting down does not brick the thing.                                                                                                                                                                                          |

---

## 3. Five use cases

| Use case | Picos | Relationships | Status |
|----------|-------|---------------|--------|
| LoRaWAN sensor network | owner, Manifold hub, sensor communities, sensor things | community ↔ thing; hub ↔ community; Home Assistant via OAuth | Running at the cabin |
| Connected vehicles, transferable twins | owner, fleet, vehicle | FleetOwner per owner; vehicle ↔ mechanic, insurer, borrower | Fuse shipped 2014; DID-era transfer designed |
| Personal inventory and lost-and-found | owner, things, communities, tag and skills registries | thing ↔ community; tag → thing via registry | Manifold on 1.5+; tag-scan path in progress |
| AI that works for the owner | root or household pico and children as memory and event sources | pico ↔ model via webhook or callback; later a local model | Webhook pattern now; `llm:*` designed |
| High-fan-out institutional systems | institution, index picos, tours, locations, reports; or one pico per course section | personal cloud ↔ institution; collection → members | Guard tour delivered 2014; registration proof 2017 |

### 3.1 A LoRaWAN sensor network

Battery-powered Dragino sensors in a pump house, a crawl space, a deck, and a beehive report over the Helium network. Each sensor is a **thing pico** in a **sensor community pico** under the owner's Manifold hub. Helium posts each heartbeat to a channel on the sensor's pico; a router ruleset decodes the payload and raises `sensor:new_readings`; a thresholds ruleset raises `sensor:threshold_violation`; the community raises `manifold:add_notification`, and Manifold fans the alert out to whatever the owner enabled (inbox, SMS, Prowl, Home Assistant). Home Assistant connects over OAuth and renders the mesh as devices — history, dashboards, automations — with no custom UI. Picos contribute one actor per sensor with its own decoding, thresholds, and history; communities that own bootstrap and aggregation; a notification platform no domain ruleset reimplements; and a way to admit a machine (the Helium webhook) into an OAuth-locked mesh by exempting one narrow channel. Adding a sensor type is one router ruleset.

### 3.2 Connected vehicles and transferable digital twins

Fuse gave every vehicle a pico fed by an OBD-II device — trips, fuel, maintenance, diagnostic codes, alerts, each a set of rules in the vehicle pico — with an owner pico and a fleet pico above. Ownership was a **relationship** (`FleetOwner`), so two owners were two relationships, and a new owner was added through the introduction pattern. The design docs carry this forward: a vehicle's relationships with manufacturer, mechanic, insurer, borrower, and DMV are one mechanism with different roles and Rx policies. When Phil sells his truck to Dave on another engine, the truck's `did:webvh` stays the same, parent and community links move to Dave's mesh, and the battery-health service relationship survives via DID rotation. Trip data can be deleted before transfer; maintenance records stay with the vehicle. The twin's identity is bound to the vehicle, not to any owner.

### 3.3 Personal inventory, tags, and lost-and-found

SquareTag, and now Manifold with SafeAndMine, gives a person a mesh of **thing picos** for the objects they care about — a backpack, a bike, a furnace — grouped into communities. Each thing carries skills: SafeAndMine registers QR/NFC tags in the tag registry and shows owner contact information to a finder who scans one; Journal records notes such as filter changes. Things are created, tagged, and annotated through Home Assistant or through a conversational interface: an MCP server exposes Manifold operations as tools, and skill-gating shows the model only the tools whose rulesets are installed on the pico at hand, offering to install what is missing. Every thing has its own API, skills are installed per thing at runtime, a thing can belong to several communities, and the data stays in the owner's mesh rather than a vendor's account.

### 3.4 AI that works for the owner

Picos already have what an AI integration needs: persistent identity, owned state, and an event-driven interface. The progression starts shallow — a pico fires an event, an external routine reasons and posts a response event back — then moves to KRL actions that call a model with a callback event, then to the model using pico queries as tools so that the **pico is the memory**, and finally to the model raising events into the pico graph to make things happen. A household pico gives a model a cross-domain view over its children (car, sensors, calendar) while the hierarchy encodes the privacy boundary. The local-model design adds `llm:complete`, `llm:extract`, `llm:classify`, and `llm:summarize` as KRL primitives bounded by channel policy, with the rule that the model *proposes* and KRL *commits*. Fuse's bare alerts are the motivating example: a diagnostic code enriched with context and a recommendation is what drivers needed.

### 3.5 High-fan-out institutional systems

The **guard tour** system modeled an institution, tours, locations, and reports as separate picos, with index picos mapping identifiers to channels; guards and managers used their own personal clouds with a guard-tour ruleset installed — no accounts in the tour system — plus temporary channels for the duration of a tour. **BYU priority registration** modeled each of 5,393 course sections as a pico keeping its own roster; replaying two days of add/drop requests showed that an actor per entity absorbs a surge without contention. The pattern: many entities with independent state and bursty activity get one pico each, plus collection picos for grouping, and people participate through their own picos rather than an account the institution owns.

---

## Open work

Moving picos between engines ([pico-move.md](./pico-move.md)), pico-level schemas ([pico-schemas.md](./pico-schemas.md)), the `peer` relationship type and ReBAC in community rulesets ([pico-relationships.md](./pico-relationships.md)), delegated admin ([delegated-admin-relationship.md](./delegated-admin-relationship.md)), local LLM primitives ([pico-llm-capabilities.md](./pico-llm-capabilities.md)), and the channel-policy ceiling and pico mirrors (`MEMORY.md` roadmap).

## Sources

**Actor model:** [Actor model](https://en.wikipedia.org/wiki/Actor_model) — general overview; Hewitt, Bishop and Steiger, *A Universal Modular ACTOR Formalism for Artificial Intelligence* (IJCAI 1973) — the origin; [Agha, *Actors: A Model of Concurrent Computation in Distributed Systems*](https://dspace.mit.edu/handle/1721.1/6952) (MIT AITR-844, 1985) — the canonical treatment.

**Repos and docs:** this folder and `MEMORY.md`; [manifold-api](https://github.com/Picolab/manifold-api) (`README.md`, `docs/Manifold.md`, `docs/Managing_PDS.md`); [sensor-network](https://github.com/windley/sensor-network); [MCPforEXP](https://github.com/picolab/MCPforEXP).

**Confluence documentation** — the [Pico Labs developer site](https://picolabs.atlassian.net/wiki/spaces/docs/overview) is the reference manual for everything above. Start here: [Pico Engine Quickstart](https://picolabs.atlassian.net/wiki/spaces/docs/pages/19791878) · [Pico Programming Lessons](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1185969). Engine and Wrangler: [Pico Engine](https://picolabs.atlassian.net/wiki/spaces/docs/pages/6356996) · [Wrangler](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1686929547) · [Picos API](https://picolabs.atlassian.net/wiki/spaces/docs/pages/761593879) · [Managing Channels](https://picolabs.atlassian.net/wiki/spaces/docs/pages/11403288) · [Managing Pico Lifecycle](https://picolabs.atlassian.net/wiki/spaces/docs/pages/11403290). KRL: [KRL Manual](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189890) · [Libraries](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1189596) · [KRL Cookbook](https://picolabs.atlassian.net/wiki/spaces/docs/pages/1190497). Identity: [Identity System](https://picolabs.atlassian.net/wiki/spaces/docs/pages/3962044419) · [DIDs — Pico Identity](https://picolabs.atlassian.net/wiki/spaces/docs/pages/4033413122) · [Relationships](https://picolabs.atlassian.net/wiki/spaces/docs/pages/4032102406). Platform: [Manifold](https://picolabs.atlassian.net/wiki/spaces/docs/pages/3907190800) · [Pico Data Store](https://picolabs.atlassian.net/wiki/spaces/docs/pages/3907289100).

**Blog (windley.com, tag: picos):** [Fundamental Features of Persistent Compute Objects](https://www.windley.com/archives/2013/10/fundamental_features_of_persistent_compute_objects.shtml) · [Pico APIs: Events and Queries](https://www.windley.com/archives/2013/12/pico_apis_events_and_queries.shtml) · [Complex Pico Structures: Guard Tours](https://www.windley.com/archives/2014/01/complex_pico_structures_guard_tours.shtml) · [Fuse as a Microservice Architecture](https://www.windley.com/archives/2014/07/fuse_as_a_microservice_architecture.shtml) · [Fuse with Two Owners](https://www.windley.com/archives/2014/10/fuse_with_two_owners.shtml) · [Reactive Programming with Picos](https://www.windley.com/archives/2015/11/reactive_programming_with_picos.shtml) · [Reactive Programming Patterns: Examples from Fuse](https://www.windley.com/archives/2016/04/reactive_programming_patterns_examples_from_fuse.shtml) · [Using Picos for BYU's Priority Registration](https://www.windley.com/archives/2017/01/using_picos_for_byus_priority_registration.shtml) · [Announcing Pico Engine 1.0](https://www.windley.com/archives/2021/02/announcing_pico_engine_10.shtml) · [Persistence, Programming, and Picos](https://www.windley.com/archives/2021/02/persistence_programming_and_picos.shtml) · [Ten Reasons to Use Picos](https://www.windley.com/archives/2021/07/ten_reasons_to_use_picos_for_your_next_decentralized_programming_project.shtml) · [Alternatives to the CompuServe of Things](https://www.windley.com/archives/2021/07/alternatives_to_the_compuserve_of_things.shtml) · [Monitoring Temperatures in a Remote Pump House](https://www.windley.com/archives/2023/03/monitoring_temperatures_in_a_remote_pump_house_using_lorawan.shtml) · [Building a Conversational Interface for Manifold](https://www.windley.com/archives/2026/04/building_a_conversational_interface_for_manifold_with_mcp_and_picos.shtml) · [AI Integration in Picos Starts with Events](https://www.windley.com/archives/2026/06/ai_integration_in_picos_starts_with_events.shtml) · [Manifold API and Sensor Network](https://www.windley.com/archives/2026/06/manifold_api_and_sensor_network_two_new_repos.shtml) · [Identity for the Pico Engine](https://www.windley.com/archives/2026/07/identity_for_the_pico_engine.shtml) · [Why Not SPIFFE for Pico Identity?](https://www.windley.com/archives/2026/08/why_not_spiffe_for_pico_identity.shtml) · [Moving My Sensor Network onto Manifold](https://www.windley.com/archives/2026/09/moving_my_sensor_network_onto_manifold.shtml).
