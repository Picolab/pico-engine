# ONE Summit Japan 2026 — CFP talk ideas

Planning notes for [Open Networking & Edge Summit Japan](https://events.linuxfoundation.org/open-networking-edge-summit-japan/) (Dec 10–11, 2026).

- **CFP closes:** August 24, 2026 (23:59 JST)
- **Submit:** [Sessionize — ONE Summit 2026](https://sessionize.com/one-summit-2026/)
- **Suggested tracks:** [CFP suggested topics](https://events.linuxfoundation.org/open-networking-edge-summit-japan/program/cfp/#suggested-topics)

Based on work to date: **pico-engine discovery**, **Manifold**, **MCPforEXP** conversational interface, **Home Assistant** hub + **sensor-network** companion, **LoRaWAN** edge things, and the **three-plane identity model** (passkeys, DID/DIDComm, OAuth).

---

## Talk strategy (Jul 2026)

**Goal:** Increase **visibility of picos** as a programming model and runtime—not only sell a particular app stack. Conference talks (ONE Summit and others) are a primary **marketing channel** for picos: credible, technical, ecosystem-facing, not ad copy.

**Hook:** **Identity** — where Phil's credentials and audience interest align (DIDs, SPIFFE tradeoffs, edge security). The identity talk is the **door**; attendees should leave curious about **what picos are**, not only how we authenticate them.

**Through-line — what makes picos unique:**

| Property | What it means | Why identity amplifies it |
|----------|---------------|---------------------------|
| **Identity permanence** | A pico is a persistent actor with a stable identity that can survive relocation (`did:webvh` SCID, DIDComm relationships) — not an ephemeral session or path-scoped workload ID | Without crypto identity, permanence is only a database row; with it, **relationships and trust survive moves** |
| **Data permanence** | Entity state, rulesets, subscriptions, and channel history live **with** the pico across its lifetime — not in a siloed app backend | Portable identity makes **data + actor** move together instead of breaking references on migration |
| **Internet-native** | Picos communicate over HTTP/events/queries on the open web; subscriptions are first-class; no required central broker | DIDs and DIDComm are **web-native identity and messaging** — same grain as how picos already talk |

**Terminology — say *actor*, not *agent*:** Picos implement the **actor model** (independent actors, message passing, local state). Avoid calling picos "agents" in our messaging — *agent* is overloaded (LLM agents, SSI agents, "agentic AI") and obscures what picos actually are. Preferred phrasing:

- **Root pico** = the human's **actor** on the mesh (unlocked via passkey)
- **Child picos** = actors for things, communities, services
- Reserve *agent* for external industry terms only (e.g. "MCP agent", "Agentic AI track") when quoting conference tracks or third-party tools

**Self-hosted honesty (see Talk A close):** Not turn-key SaaS — operators run a pico-engine (multi-tenant, community-scale). Identity + permanence story is **stronger** in that model, not despite it.

---

## Preferred direction (Jul 2026)

**Hypothesis:** The ONE Summit audience may be *more* receptive to a **design/architecture talk on pico identity** than to a Manifold-app demo—especially if framed as edge networking choices: who acts, how peers trust each other, and how integrators (HA, MCP, webhooks) fit without collapsing those concerns.

**Lead talk:** **Three identity modalities** and **why DIDs beat SPIFFE** for open, multi-owner edge meshes (see **§ A** below)—with a deliberate **"what is a pico?"** payoff: persistent **actors** with identity permanence, data permanence, and internet-native messaging.

Keep discovery / sensor-network / MCP talks as alternates or future submissions.

---

## Talk proposals (pick 1–2 for submission)

### A. Three identity planes for edge picos: passkeys, DIDs, and OAuth *(preferred)*

**Best track:** AI Implications on Networks  
→ *Security & Trust in AI-Driven Networks*, *Open Source Governance*; also Network Evolution → *Intelligent Network Control*

**Working title:** *Who Acts on the Edge? Passkeys, DIDs, and OAuth in a Pico Mesh*

**Alternate title:** *Why We Chose DIDs Over SPIFFE for Portable Edge Actors*

**Why this audience:** ONE Summit skews toward **network operators, edge architects, and security-minded integrators**—people who already know SPIFFE/SVID, zero-trust, and federation pain. A candid “we evaluated SPIFFE and chose DIDs instead” talk is **design review**, not product pitch, if you show tradeoffs and failure modes honestly—and if you land the **pico** story: not another agent framework, but **persistent internet-native actors** whose identity and data outlive any single host.

**Pitch (one paragraph):** Edge systems need three different answers to three different questions—not one mega-identity. **(1) Human → actor:** passkeys / WebAuthn to the root pico (the human's persistent **actor** on the mesh—available today, phishing-resistant, no central IdP). **(2) Actor → mesh:** DID/DIDComm—`did:webvh` for portable pico identity, `did:peer` for subscription relationships—so peers and service subscriptions **survive relocation** without O(n²) trust-domain federation. **(3) Actor → external apps:** OAuth (mesh-scoped tokens for Home Assistant, MCP, webhooks). SPIFFE remains excellent for a **single operator's fleet** inside one trust domain; we set it aside when **multi-owner meshes, portability, and relationship continuity** matter more than hierarchical workload naming. Underneath: **picos**—actor-model programs with **identity permanence**, **data permanence**, and **internet-native** communication; a robust identity layer makes all three credible at scale.

#### The three modalities (talk spine)

| Plane | Question | Mechanism | What it is *not* |
|-------|----------|-----------|------------------|
| **Human → actor** | Is this the right person for this root? | **Passkeys / WebAuthn** — each root pico = its own RP | Not DID Auth at the human's phone; not a shared user DB |
| **Actor → world** | Which pico is acting? | **DID/DIDComm** — `did:webvh` + `did:peer` | Not SPIFFE path-as-identity; not channel ECI as crypto identity |
| **Actor → apps** | Which third-party integrator? | **OAuth** — mesh-scoped Bearer on `/sky/*` | Not conflated with pico DID or human session |

**Composition rule:** The human unlocks their **root actor** (root pico) with a passkey; picos act outward with DIDs; external automation uses OAuth. One mechanism per direction—each using the most deployable tech for that direction.

#### DID vs SPIFFE — what to say on stage

**SPIFFE strengths (acknowledge fairly):**

- Mature cloud-native story: SPIRE, SVIDs, mTLS, JWT-SVID
- Clean **intra–trust-domain** workload identity (`spiffe://trust-domain/path/...`)
- Operators already running SPIRE understand the model

**Why we set SPIFFE aside for picos:**

| Concern | SPIFFE | DID/DIDComm (our direction) |
|---------|--------|------------------------------|
| **Identity on move** | Path/domain-scoped → **re-mint** on relocation; surviving peer relationships break | **`did:webvh` SCID stable**; location update via DIDComm DID Rotation |
| **Cross-domain / multi-owner meshes** | **Federation** (trust bundles, O(n²) between domains) | Relationship-anchored **`did:peer`**; federation-free between independent owners |
| **Human authn** | Workload identity ≠ human login (side system needed) | **Passkey → root actor** unifies human + pico without wallet apps |
| **Integrator plane** | Separate from workload id | **OAuth** explicitly third plane (HA, MCP already shipping) |

**Honest downsides of DID path (include these—reviewers trust it):**

- Two DID methods (`did:webvh` + `did:peer`) still to unify in one mental model
- **Hosting/resolution dependency** for `did:webvh` (mitigated by witnesses; `did:peer` for relationships)
- **Identifier string changes on move** (SCID immutable; peers learn via rotation—not KERI-level immutability)
- Per-request verify cost vs JWT (cache resolved keys)
- **KERI** kept as heavier fallback if did:webvh proves insufficient

**SPIFFE is not wrong** — wrong *default* for **open, portable, multi-owner edge meshes**. Still fine for “my K8s cluster, my SPIRE, my fleet.”

#### What picos are (the marketing payoff — ~2 min before close)

After identity mechanics, zoom out. **Picos are not "AI agents."** They are **actors** in the actor-model sense: independent units of computation with local state, communicating by message passing (events and queries over the web).

Three properties that distinguish picos—and that **identity permanence** now makes real:

1. **Identity permanence** — a pico can be recognized across time and relocation (DID SCID, surviving subscriptions), not re-created on every deploy
2. **Data permanence** — rulesets, entity vars, subscriptions, and channel policy live with the actor; export/import and move are first-class problems, not afterthoughts
3. **Internet-native** — no proprietary bus required; HTTP sky API, OAuth integrators, DIDComm as the peer layer on the same grain as the web

**Bridge line:** *SPIFFE names workloads inside a domain; picos are actors on the internet—with identities and data that persist.*

#### Layering slide (engine ← wrangler ← manifold)

- **Engine:** passkey store, session issuance, DID keys engine-held, sign/verify at door, deny-by-default
- **Wrangler:** subscription formation as DIDComm connections, `wrangler:myDid()`, rotation, `callerDid()`
- **Manifold / apps:** “sign in”, “join community”, OAuth clients—one-liners over primitives

#### Tie to shipped work (credibility, not vapor)

| Modality | Shipped / in progress |
|----------|------------------------|
| Passkeys | Engine registration, mesh UI session gate |
| OAuth | Mesh lock, HA PKCE, webhook client credentials, `/api/mesh-context` |
| DID/DIDComm | Engine `dido` module; design in MEMORY + `docs/design/pico-move.md`; **Layer 2 deferred post-1.5** |
| Discovery / policy | Channel policy + discovery `filterBindingsForCaller` (capability exposure, not identity—but shows “least privilege” culture) |

Be explicit: **identity Layer 2 is roadmap**, Layer 3a OAuth **shipped**—this is a **design talk with partial implementation**, not a “everything is in prod” talk.

#### Close — honest deployment posture (vs legacy Manifold)

End the talk by naming what this architecture **is not**, so the identity story lands as infrastructure design rather than a product relaunch:

- **Departure from turn-key SaaS Manifold.** The original Manifold was a hosted application people could log into with Gmail and use immediately. This direction is **not** that. There is no central Picolab service to sign up for; identity and data live on **your** engine.
- **What it takes today.** A useful mesh still requires **operator setup**: a **pico-engine** instance (passkeys, OAuth, discovery, future DID hosting) and, for the reference integrator story, a **Home Assistant** instance with the Manifold hub and any companions. That is real friction—say it out loud.
- **Why that is acceptable (and maybe better).** The engine is **multi-tenant**: one process can host many root picos, many owners, many communities on a shared mesh. That enables a **community-operated** model—neighborhood sensor networks, a maker space, a small facility—not only a single global SaaS. Each community can run its own engine (or share one run by a trusted steward) without Picolab in the middle.
- **Identity fits the model.** Passkeys bind humans to **their** root actor on **that** engine; OAuth scopes integrators to **that** mesh; DIDs (when shipped) make picos **portable between** such engines without a central IdP. The three-plane design assumes **distributed deployment**, not “log in with Google to picolab.com.”
- **Call to action:** picos are open source (pico-engine, pico-framework, Manifold KRL)—run an engine, create actors, integrate with HA or MCP. Identity is the **reason** permanence matters; permanence is the **reason** picos are worth knowing about.

One-liner for the slide: *“Not Gmail-in-the-cloud—run your engine, join your mesh.”*

**Demo options (lightweight):**

- Passkey sign-in → Manifold UI → HA OAuth consent (human + app planes in 2 minutes)
- Diagram: pico move with which edges sever vs survive (parent vs mesh subscription vs DIDComm peer)
- Optional: show existing `io.picolabs.did-o` / engine dido as starting point

**Repos / docs:** pico-engine (`MEMORY.md` §5, §9, identity future), `docs/design/pico-move.md`, manifold-home-assistant (OAuth integrator)

**Enhance before CFP:**

- One **public architecture diagram** (three planes + layering)
- **1-page SPIFFE vs DID decision record** (could live beside `pico-move.md`)
- If time: **minimal did:webvh per pico** prototype slide (even “created, not enforced yet”)

---

### 1. Discovery channels as the API for agentic edge systems

**Best track:** Open & AI Native Networking & Edge  
→ *Agentic AI & Intent-Based Networking*, *Multi-Agent Orchestration*, *Real-World Deployments*

**Working title:** *Discovery Channels: One Integrator Contract for HA, MCP, and Edge Picos*

**Pitch:** Most edge platforms expose integrators to a sprawl of rulesets, channels, and event schemas. Pico-engine 1.5 adds a **discovery channel on every pico**: integrators fire one event; rulesets respond with **`discovery capability`** directives and a **bindings** contract (queries, events, notifications). Home Assistant turns those bindings into services and entities; MCPforEXP turns them into tools for a conversational layer. Same mesh, multiple integrators—without hard-coding each app in each client.

**Demo / evidence today:**

- SafeAndMine + Journal discovery rulesets (`manifold-api`)
- HA dynamic services from bindings (`manifold-home-assistant`)
- `wrangler:filterBindingsForCaller` — integrator sees only what its channel policy allows
- MCPforEXP channel-walk discovery on the root pico

**Repos:** pico-engine, manifold-api, manifold-home-assistant, MCPforEXP

---

### 2. An open edge mesh: LoRaWAN sensors, communities, and Home Assistant

**Best track:** Edge AI & Data at the Edge  
→ *Data Processing & Management at the Edge*, *Vertical Industry Deployments*, *Open Source Edge Platforms*

**Working title:** *From LoRaWAN Payload to Home Automation: An Open Manifold Mesh at the Edge*

**Pitch:** Sensor-network on Manifold treats **communities** (e.g. Temperature Network) and **things** (LHT65 routers) as picos on a shared mesh—not a separate silo. Readings flow thing → community → Manifold notifications. The **HA companion** (`pico_mesh_sensor_network`) adds temperature/humidity entities on thing devices; the **Manifold hub** owns communities and cross-cutting apps (SafeAndMine). Open KRL + open HA integrations; Docker-dev reproducible.

**Demo / evidence today:**

- Temperature Network community + Test Temperature Sensor
- LHT65 router → HA sensor entities (°F, humidity, last reading)
- Companion integration pattern (hub + `pico_mesh_sensor_network`)
- Threshold → `manifold add_notification` path (manual or scripted)

**Repos:** sensor-network, manifold-api, manifold-home-assistant, pico-engine

**Audience hook (Japan):** Frame as environmental / facility monitoring (IIoT), not only personal gadgets.

---

### 3. Conversational operations over a distributed pico mesh (MCP + Manifold)

**Best track:** Open & AI Native Networking & Edge  
→ *Agentic AI*, *Autonomous Network Operations*; also *APIs, Tokens & Inference for Verticals*

**Working title:** *Talk to Your Edge Mesh: MCP, Manifold, and Intent-Based Pico Operations*

**Pitch:** Operators shouldn’t need Sky URLs, ECIs, or KRL event names to manage a mesh. **MCPforEXP** is a reference **conversational interface**: natural language → MCP tools → Manifold events/queries (create things, journal notes, tags, list mesh). Combined with **skills registry**, **discovery**, and **passkey-authenticated root pico**, this is a practical pattern for intent-based edge operations—not a chatbot bolted onto a REST API.

**Demo / evidence today:**

- Chat-driven thing creation, journal, SafeAndMine flows
- Prompt design for referential language (“tag it”, “that thing”) — `MCPforEXP/docs/prompt-design.md`
- Root → Owner → Manifold channel discovery (same pattern as HA)

**Repos:** MCPforEXP, manifold-api, pico-engine

---

### 4. Securing multi-integrator edge meshes: passkeys, OAuth, and capability filtering

**Best track:** AI Implications on Networks  
→ *Security & Trust in AI-Driven Networks*; Open & AI Native → *Cloud-Native & Autonomous Agentic Networks*

**Working title:** *Passkeys, Mesh OAuth, and Discovery: Securing Open Edge Integrators*

**Pitch:** Edge meshes need **humans** (passkeys), **automation** (OAuth clients: HA, MCP, webhooks), and **least-privilege capability exposure**. Pico-engine: mesh-wide OAuth with PKCE, channel policies, discovery with **caller ECI filtering**, separate integrator styles (Authorization Code vs Client Credentials). Lessons from HA-in-Docker (dual engine URLs, on-engine event delivery) show why security and ops are one design problem.

**Demo / evidence today:**

- HA OAuth + mesh scope
- `/api/mesh-context` and Manifold auto-discovery
- Tag registry on-engine delivery (fix 401 when HA runs in Docker)
- Bindings filtered per caller ECI

**Repos:** pico-engine, manifold-api, manifold-home-assistant

---

## Which to submit?

| Goal | Submit |
|------|--------|
| **Best fit for ONE Summit identity/security crowd** | **#A Three identity planes / DID vs SPIFFE** |
| Strongest **open-source integrator** story | **#1 Discovery** or **#2 Edge mesh + HA** |
| Most **AI / conversational** alignment | **#3 Conversational MCP** (pair with #A or #1 in abstract) |
| **Japan edge / IIoT** vertical demo | **#2** |
| Narrow **OAuth/ops** talk (subset of #A) | **#4** — consider folding into #A instead |

**Recommendation:** Submit **#A** as the primary session. Optionally add **#2** or **#1** as a second submission if Sessionize allows multiple talks—or a **lightning talk** on “three integrators, one mesh” as a concrete appendix to #A.

**Lightning talk options:**

- *Three integrators, one Manifold mesh: Home Assistant, MCP, and LoRaWAN sensors.*
- *Three identity questions, three mechanisms: a pico mesh cheat sheet.*
- *Picos are actors, not agents: identity permanence, data permanence, internet-native.*

---

## Enhancements before CFP close (Aug 24)

Prioritized for talk quality, not product completeness.

| Priority | Enhancement | Strengthens |
|----------|-------------|-------------|
| **0** | **Identity architecture diagram** + SPIFFE vs DID decision record | Talk **#A** |
| 1 | **Discovery → MCP auto-tools** (mirror HA binding → services) | Talks #1, #3 |
| 2 | **Recorded 3–5 min demo**: passkey → mesh UI → HA OAuth *or* sensor → HA | Talks #A, #2, #3 |
| 3 | **Architecture + sequence diagrams** (identity planes, discovery, sensor path) | All talks |
| 4 | **One vertical narrative** (environmental monitoring or smart asset tracking) | Talk #2 |
| 5 | **One-command Docker story** (engine + Manifold + HA hub + sensor companion) | Reviewer reproducibility |

Additional nice-to-haves:

- Second sensor router in companion (LSE01 or LSN50) — proves pattern, not one-off
- Scripted E2E: heartbeat → HA sensor → threshold → notification
- **Integrator guide** comparing HA / MCP / webhook auth models
- OAuth apps panel: public URL, redirect URIs, scopes (less mystery config in talk)
- Short threat-model slide: what discovery filtering prevents vs does not

---

## CFP reminders (from LF)

- Avoid sales pitches; focus on ecosystem and real experience
- Proposals need **specific technical depth** — name repos, flows, and lessons learned
- Panel submissions need all participants named up front
- Slides due before the event if accepted

---

## Related repos & docs

| Repo | Role |
|------|------|
| [pico-engine](https://github.com/Picolab/pico-engine) | Runtime, OAuth, discovery channels, `/sky/query` |
| [manifold-api](https://github.com/Picolab/manifold-api) | Manifold platform KRL, SafeAndMine, Journal, HA ruleset |
| [sensor-network](https://github.com/windley/sensor-network) | LoRaWAN communities + `pico_mesh_sensor_network` companion |
| [manifold-home-assistant](https://github.com/Picolab/manifold-home-assistant) | HA hub (`pico_mesh`) v1.0.0 |
| [MCPforEXP](https://github.com/picolab/MCPforEXP) | Conversational / MCP reference integrator |

| Doc | Path |
|-----|------|
| **Identity design (source of truth)** | `MEMORY.md` — §5 (DID/DIDComm), §9 (passkeys), “SPIFFE reconsidered”, three-plane model |
| Pico move / portability | `docs/design/pico-move.md` |
| Identity libraries | `docs/design/pico-identity-libraries.md` |
| Discovery (KRL) | `packages/pico-engine/public/docs/krl/discovery.md` |
| HA hub MEMORY | `manifold-home-assistant/MEMORY.md` |
| Sensor companion MEMORY | `sensor-network/MEMORY.md` |
| MCP prompt design | `MCPforEXP/docs/prompt-design.md` |

---

## Draft abstract stub — Talk A (Sessionize)

> Edge platforms often collapse human login, workload identity, and third-party API access into one mechanism. That fails for open meshes where picos move, multiple owners interact, and integrators (Home Assistant, MCP tools, webhooks) need mesh-scoped access without becoming the pico.
>
> We present a **three-plane model** for the pico-engine: **passkeys** for human→actor authentication (root pico as the person's persistent actor), **DID/DIDComm** (`did:webvh` + `did:peer`) for pico↔pico identity and portable relationships, and **OAuth** for external apps. We explain why we **evaluated SPIFFE/SVID** and set it aside for this use case—domain-scoped workload IDs and trust-domain federation conflict with multi-owner portability and surviving subscriptions across mesh moves—while acknowledging where SPIFFE remains the better tool.
>
> Attendees leave with a decision framework, an engine↔wrangler↔app layering map, and honest tradeoffs (hosting, rotation, verify cost, KERI as fallback). Shipped OAuth and passkey paths ground the talk; DID enforcement is roadmap with a greenfield library plan (`docs/design/pico-identity-libraries.md`).
>
> We close on **what picos are**: not LLM agents, but **internet-native actors** with identity permanence, data permanence, and message-passing semantics—made credible by the identity architecture we describe. This is a deliberate break from hosted SaaS Manifold: run a multi-tenant pico-engine (and optionally Home Assistant) for community-scale meshes, not Gmail-in-the-cloud.

---

## Next step (optional)

Draft **Sessionize-ready titles + ~150-word abstracts** for Talk **A** (and one alternate) when ready to submit.
