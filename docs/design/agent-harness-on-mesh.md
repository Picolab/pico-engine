# Agent harness on a pico mesh

**Status:** brainstorm (2026-09-24)
**Context:** [pico-llm-capabilities.md](./pico-llm-capabilities.md) puts the LLM *inside* the pico: KRL calls `llm:*` primitives and the pico stays on top of the call stack. This doc flips that. A long-lived agent harness — one that spawns sub-agents and runs for weeks, in the style of OpenClaw or Muse — sits on top, and a pico engine and mesh are available to it as memory, scratchpad, nervous system, and hands. The two designs compose; the seam between them is the same in both directions: events in, proposals out, rules commit.

**Terminology:** *agent* and *harness* here name the external LLM system, following the industry usage. Picos remain *actors* ([pico-overview.md](./pico-overview.md), [one-summit-japan-2026-cfp.md](./one-summit-japan-2026-cfp.md)). The event domain for the bridge is `harness` (name TBD, see open questions).

**Related:** [pico-overview.md](./pico-overview.md) · [pico-llm-capabilities.md](./pico-llm-capabilities.md) · [pico-schemas.md](./pico-schemas.md) · [pico-relationships.md](./pico-relationships.md)

---

## Summary

Today's harnesses weld two things together that picos keep separate. A harness sub-agent is a *session*: identity, memory, and reasoning all exist only as long as a context window and a transcript do. Picos split that into a **durable half** (identity, state, inbox, relationships, rules — the pico) and an **ephemeral half** (a burst of reasoning — the LLM session). Once split:

- sub-agents can **sleep for free** and wake on events, with rules deciding whether an event even deserves a model call;
- **authority is capability-shaped**: a sub-agent can do what the channels it holds allow, and nothing else;
- the model can **compile settled decisions into rulesets** that run without it, so the system gets cheaper and more predictable the longer it runs — the opposite of context rot.

The harness world has already reinvented, crudely, the three things picos do natively: persistent sessions (identity + state), triggers (events), and scoped tools (channel policy). That is the opening.

---

## Where harnesses struggle today

From OpenClaw's documentation and practitioner write-ups:

| Harness mechanism | Limitation |
|-------------------|------------|
| Sub-agent = a run inside a session; "a run ends, a session does not" | Resuming means replaying or forking a transcript; the sub-agent has no existence between runs except as text |
| Layered memory: working memory plus retrieved memory files | **Context rot** — memory files, skill definitions, and schemas accumulate as permanent baggage that degrades precision |
| Triggers: heartbeats, cron, webhooks | Every trigger costs a model call just to decide whether anything is interesting |
| Tool policy narrowed by nesting depth | Coarse; permissions are per agent and depth, not per resource or per task |
| Governance: sandboxing, audit logs, tool permissions | Bolted on per deployment rather than structural |
| Two users' agents collaborating | Requires both on one platform or a bespoke integration |

The BYU MCPforEXP capstone saw the same thing from the other side: accuracy degraded after hundreds of create/edit/delete operations accumulated in context, and the fix they identified was context management.

---

## The flip

```
        ┌──────────────────────────────────────────────┐
        │  Agent harness (long-lived)                   │
        │   orchestrator session ── spawns ──► sub-agent │
        │   sessions (ephemeral reasoning bursts)       │
        └───────────────┬───────────────────────────────┘
                        │  MCP bridge: tools generated from
                        │  wrangler + discovery + picoSchema
        ┌───────────────▼───────────────────────────────┐
        │  Pico mesh (durable)                          │
        │   harness root pico ── children: task,        │
        │   watcher, memory, mailbox, sandbox picos     │
        │   ── relationships ──► owner's things,        │
        │   other people's meshes (DIDComm)             │
        └───────────────────────────────────────────────┘
```

The central move: **a sub-agent is a pico plus, occasionally, an LLM session.** The pico holds the task's identity, progress, inbox, relationships, and rules. The session is spawned when the pico raises `harness:needs_reasoning`, receives context the pico's rules assembled, and returns a `harness:proposal` that the pico's rules commit or refuse. The rule from [pico-llm-capabilities.md](./pico-llm-capabilities.md) holds unchanged: the model **proposes**, KRL **commits**.

---

## What it enables

| Hard today                                       | With a mesh underneath                                                                                                     | Engine mechanism                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Sub-agents die with their run                    | Sub-agent = pico; dormancy is free; weeks-long tasks are cheap                                                             | Persistent identity, state, availability; `schedule`; wrangler prototypes  |
| Memory as files + vector search; context rot     | Memory is a *graph* of picos (per project, person, thing) navigated by relationship; children summarize, parents aggregate | Parent/child tree, PDS, queries; hierarchy as context and privacy boundary |
| Every trigger wakes the model                    | Rules filter, dedupe, threshold, and enrich deterministically; the model wakes only when rules can't decide                | Event bus, salience, enrichment and semantic-translation patterns          |
| Tool permissions per agent                       | A sub-agent's authority *is* the ECIs it holds; revoke by deleting a channel; a leak exposes one narrow door               | Channels + policy; `filterBindingsForCaller`                               |
| Guardrails live in prompts                       | Invariants live in rules the model can't rewrite: idempotence guards, budgets, quiet hours, approval gates                 | Guard rules; postlude conditions; `human:approval_needed`                  |
| Cross-user collaboration needs a shared platform | My agent's actor forms a DID relationship with yours; introduction brokers scoped access                                   | did:webvh / did:peer; SKY over DIDComm; introduction pattern               |
| Audit is whatever the harness logs               | Every committed action is an event on a pico; replayable; a mirror is a sandbox for a risky sub-agent                      | Event log; mirrors and replay (roadmap)                                    |
| Agent locked to one vendor's memory format       | The whole agent — memory, relationships, sub-agents — is a mesh that moves between engines; the model is swappable         | Substitutable hosting; pico move                                           |

## Three directions to pursue first

The table lists everything a mesh could change for a harness; not all of it is equally new. Three directions stand out because each turns one pico primitive against one of the harness pain points named above: **persistence** against the cost of keeping sub-agents alive, **capabilities** against coarse, per-agent tool permissions, and **rules** against context rot. They are also ordered by what they depend on. Sleeping sub-agents need only features that have already shipped; delegation as introduction needs the channel-policy fix; and using the mesh as the deterministic half of the brain comes into its own with pico schemas and generated rulesets. That order matches phases 1 through 3 in the [phasing](#phasing) section.

### Direction 1 — sleeping sub-agents

A pico-backed sub-agent watches for the events it cares about, keeps progress in `ent:` vars, schedules its own follow-ups, and raises `harness:needs_reasoning` only when judgment is required. The model call becomes the rare, expensive step in an otherwise free actor lifecycle. The pumphouse sensor is the template, with "does this need a reasoner?" in place of the threshold check.

### Direction 2 — delegation as introduction

Spawning a sub-agent means creating a task pico, minting its channels to exactly the resources the task needs with narrow policies, and handing those ECIs to the reasoning session. That is the Fuse borrow-my-truck pattern applied to agents. It extends cleanly to other people's agents: a DID relationship with a role and an Rx policy preset is the same mechanism, so the Fleet vocabulary in [pico-relationships.md](./pico-relationships.md) (owner, borrower, mechanic) doubles as an agent-permission vocabulary.

### Direction 3 — the mesh as the deterministic half of the brain

Move state and invariants out of the context window into actors that hold them. The model should not remember the roster, the budget, or whether the notification already went out — a pico does, and a guard rule refuses the duplicate. In promise-theory terms, each pico is a set of promises and the model composes promises rather than re-deriving behavior each turn.

---

## Rulesets: four tiers

Picos do not all carry the same rulesets. The agent creates a pico for a purpose and installs what that purpose needs, following established patterns: Manifold's per-thing skills from the skills registry, sensor-network's `rids_to_install` by type, Fuse's typed initialization, and Wrangler prototypes.

| Tier | Contents | Fixed? | Author | Installed by |
|------|----------|--------|--------|--------------|
| **1. Substrate** | Wrangler, PDS, discovery (engine defaults) plus one **harness kit**: raise `harness:needs_reasoning`, accept `harness:proposal`, commit or refuse, audit, budget metering, memory conventions | Yes — small, versioned, boring | Pico Labs | Engine default or harness bootstrap |
| **2. Role library** | Task, watcher, mailbox, notebook/memory, scheduler, blackboard/community, sandbox, reasoning broker, integrator adapters (Home Assistant, webhook, calendar, email) | Curated; grows slowly; refactored by versioning | Pico Labs, then contributors | The agent, at creation, by choosing a **prototype** from the registry |
| **3. Domain rulesets** | Whatever the mesh is about: sensor routers, SafeAndMine, Fleet | Per deployment | Domain repos | Registry lookup by purpose |
| **4. Generated rulesets** | Rules the model writes for one pico and one purpose | Ephemeral by default | The harness | The harness, on that pico only |

**Substrate.** The harness kit is the analog of `io.picolabs.thing`: the one ruleset that makes a pico legible to the reasoner. It carries no domain vocabulary, per the engine ← wrangler ← manifold layering rule in `MEMORY.md`.

**Role library.** The Manifold skills registry, generalized from things to any actor the harness spawns. Each entry carries a RID, a version, a `meta.schema`, and MCP tool definitions. Because the registry is a pico, the harness *queries* it when deciding what to install — creation for a purpose is a lookup, not hardcoded knowledge. Refactoring is versioning: rulesets are URLs, picos pin versions, and the Fuse self-healing pattern (compare "should have" to "have," fix the difference) upgrades thousands of picos without a mass update.

**Generated rulesets.** Once the reasoner has settled a decision — "if the crawl-space probe reads below 34°F twice in a row, text me and turn on the heater" — it writes a rule, the compiler validates it, and it installs on that one pico. The reasoner is out of the loop until the rule raises something it can't handle. This is JIT compilation of promises: settled decisions become deterministic actors; only novelty reaches the model. It is the mechanism that empties the context window, and the LLM-capabilities doc's K1–K4 items (draft, patch, explain, test) pointed the other way.

### Conditions for allowing generated rulesets

| Condition | Mechanism |
|-----------|-----------|
| A narrow surface to write against | The harness kit ships KRL modules — `harness:propose()`, `harness:remember()`, `harness:escalate()` — so generated code is mostly `select when … raise harness event …` glue over a vetted library |
| Policy is not writable from KRL | Generated rulesets run inside channel policies set at creation and cannot widen them; requires the permit-overrides-deny fix and a policy ceiling |
| Provenance travels with the code | Installing actor's DID, the originating intent, and `meta.schema` stored in the pico's PDS settings; auditable, explainable, regenerable, collected with the pico |
| Promotion, not sprawl | A generated ruleset the harness keeps rewriting becomes a candidate for the role library: reviewed, named, versioned, registered. Code flows up from tier 4 to tier 2; nothing enters the substrate without a human |

---

## Skills and generated rulesets

A generated ruleset resembles a harness skill, but the difference is who executes it. A skill is instructions the model reads and interprets each time; it improves the reasoner but runs only while the reasoner runs. A generated ruleset is a decision already made, compiled into behavior that runs without the model.

| | Skill | Generated ruleset |
|---|---|---|
| Executed by | The model, reinterpreted each time | The engine, deterministically |
| When it runs | Only during an active session | Whenever a matching event arrives |
| Cost per use | Tokens, every time | Effectively zero |
| State | None of its own | Its own `ent:` vars, surviving restarts |
| Scope | Global to the agent | One pico, one entity, one purpose |
| Authority | Whatever the harness holds | Only what that pico's channel policies allow |
| Handles novelty | Well | Badly — it does exactly what it says |
| Auditable by | Reading the transcript | Reading the code and the event log |

They are complements. A situation starts as skill-guided reasoning, recurs, stabilizes, and is compiled into a rule, with `harness:escalate()` as the exit for cases the rule wasn't written for. A skill can also be what *writes and maintains* rulesets for its domain: a home-monitoring skill tells the model how to author, test, and revise the threshold rules it installs on each sensor pico. The skill holds the expertise; the rulesets hold the commitments.

---

## The bridge

The harness reaches the mesh through an **MCP server native to the engine** — a generic version of MCPforEXP's server over wrangler, discovery, and pico schemas that turns any pico's surface into tools at runtime, rather than hand-written wrappers per operation. It is useful on its own, independent of any harness: any MCP client can then work with any pico (see open question 2). The capstone judge's suggestion — generate tool definitions from API specifications — is exactly this, and it makes `wrangler:picoSchema()` the source of truth. The uniform request/response envelope and skill-gating from MCPforEXP carry over directly: a session sees only tools for rulesets installed on the pico it holds a channel to.

The harness gets its own **root pico** (its actor), provisioned under the owner's passkey and reached by the harness process with OAuth (Authorization Code for the orchestrator; Client Credentials channels for narrowly scoped workers). Task, watcher, and memory picos are its children, created from prototypes.

## Local models, routing, and escalation

Local models running alongside the pico engine fit the personal nature of picos: the data stays in picos the owner controls, and it is reasoned over by a model on hardware the owner controls. The flipped design makes local models more viable than they would otherwise be. Rules carry the deterministic load and generated rulesets absorb settled decisions, so what reaches a model is narrow. Small local models are weak at long-horizon planning but good at exactly those narrow jobs: classify this event, extract fields from this payload, decide whether this needs more. Those are the `llm:classify`, `llm:extract`, and `llm:summarize` primitives in [pico-llm-capabilities.md](./pico-llm-capabilities.md), backed by its proposed inference sidecar (Ollama, llama.cpp).

Choosing a model has two axes. The **vertical** axis is difficulty: escalate when a job is too hard for the current step. The **horizontal** axis is specialization: some jobs go straight to a purpose-built model regardless of difficulty. Cursor's coding environment is a working example of both — a purpose-built model always runs Tab completion, an in-house fast model handles routine agent edits, frontier models take hard reasoning, and an Auto router picks among them on query, context, complexity, and domain under a user-chosen Intelligence / Balance / Cost setting.

### The escalation ladder (difficulty)

Each step handles what it can and escalates the rest:

| Step | Handles | Runs | Data leaves the mesh? |
|------|---------|------|-----------------------|
| **1. Rules** | Anything settled: thresholds, routing, dedupe, guards, generated rulesets | Engine | No |
| **2. Local model** | Classification, extraction, summarization, and the escalation decision itself | Sidecar beside the engine | No |
| **3. Frontier model** | Planning, novel situations, authoring and revising rulesets | Cloud, opt-in per pico | Only what that pico's policy allows |

**Escalation is policy, not code.** How far an event may climb is a setting on the pico (for example, a ceiling stored in PDS settings and enforced by the harness kit). A health or finance pico can be capped at step 2; a planning pico can be allowed to step 3. The pico hierarchy already draws the boundary for what may be sent out, and a parent's ceiling bounds its children's. "Local by default, cloud by explicit exception" becomes a property of the mesh rather than a vendor's promise, and every escalation is an event on the pico, so the owner can audit what left and why.

**The ladder drains downward over time.** A frontier model resolves a novel case and writes a ruleset; the next occurrence stops at step 1. A local model that keeps escalating the same kind of event is a signal that a rule or a role-library ruleset is missing.

### Specialization (task type)

A role in the role library declares the model class it needs, the way a Manifold skill declares its tools. Those models run whenever the role needs them, independent of the ladder:

| Role | Model class | Typical job |
|------|-------------|-------------|
| Memory / notebook pico | Embedding model | Index and retrieve what the pico holds |
| Camera or document pico | Vision model | Describe, extract, or classify images and scans |
| Voice or mailbox pico | Speech-to-text | Turn audio into events |
| Router pico (e.g. a sensor community) | Small classifier | Route inbound events to the right child or domain |
| Task pico doing planning | Frontier model (subject to ceiling) | Decompose goals, write rulesets |

Specialized models are usually small enough to run locally, which strengthens the local-by-default posture.

### Two dials

| Dial | Question | Kind | Where it lives |
|------|----------|------|----------------|
| **Privacy ceiling** | How far may this pico's data travel? | Hard constraint | Per pico, bounded by its parent's ceiling |
| **Cost / quality preset** | Within the ceiling, favor capability, balance, or cost? | Preference | Per mesh default, overridable per pico |

The ceiling always wins. A health pico with a local-only ceiling and a capability preset gets the best *local* model, never a cloud one. This is what a mesh adds to Cursor's design: Cursor routes on capability, cost, and latency, and everything it routes goes to its cloud. A mesh routes on those *and* on ownership.

### The reasoning broker

Routing is itself a role: a **reasoning-broker pico** in the role library receives `harness:needs_reasoning`, chooses a model by task type, difficulty, and the two dials, and records the choice as an event. That makes routing auditable and puts the broker on its own ladder: obvious routing becomes rules, fuzzy routing ("is this planning or classification?") is a cheap job for a small local model, and only genuinely ambiguous cases need anything larger. One broker per mesh is the default; a subtree with unusual constraints (a clinic, a business) can have its own.

Cursor trains its in-house models on its own usage. The mesh has an owned analog: the broker's log of escalations and outcomes records what this owner's mesh actually needs, and could later be used to evaluate or tune the local model — owned data improving an owned model. That is speculative, but it is the mirror image of the vendor pattern.

**Constraints.**

| Constraint | Consequence | Mitigation |
|------------|-------------|------------|
| Hardware | A Raspberry Pi runs the engine but not a useful model; the realistic floor is a mini PC or Mac mini | Community-operated engines share one GPU box across many meshes, with per-pico token budgets (L8 in the capabilities doc) keeping use fair |
| Quality gap | Local models write worse rulesets and plans than frontier models | Generated rulesets must pass the compiler and schema lint; installation can require approval from a human or a higher step on the ladder |
| Latency | Local inference on modest hardware is slow | Async completion events (L7); rules keep the fast path model-free |

---

## Prerequisites

| Prerequisite | Why this design needs it | Where it is designed | Status |
|--------------|--------------------------|----------------------|--------|
| **Pico schemas** (`meta.schema`, `wrangler:picoSchema()`, JSON Schema export) | The bridge generates MCP tools from declared surfaces; generated rulesets must declare what they add; the compiler lints them against the schema | [pico-schemas.md](./pico-schemas.md) | Explore / TODO |
| **Channel policy fix** — deny overrides permit, pico-level policy ceiling, restricted channel creation | An agent holding ECIs makes a wide-open channel fatal; generated rulesets must be unable to mint broader channels | `MEMORY.md` → ROADMAP §4 | MUST FIX, not started |
| **Relationships, `peer` type, policy presets** | Delegation as introduction; sub-agent and cross-user permissions as typed relationships with preset Rx policy | [pico-relationships.md](./pico-relationships.md) | Rename shipped 1.6.4; `peer` type and presets TODO |
| **Pico identity (did:webvh, did:peer, SKY over DIDComm)** | Cross-mesh collaboration between agents; `callerDid()` for provenance on proposals and generated code | [pico-identity-layer2-work.md](./pico-identity-layer2-work.md), [sky-didcomm-protocol.md](./sky-didcomm-protocol.md) | Shipped 1.6 |
| **DID key protection at rest** | Agents acting across meshes raise the stakes of the 1.6 known gap (plaintext keys in LevelDB) | [pico-identity-layer2-work.md](./pico-identity-layer2-work.md) → Epic 1 known gap; `MEMORY.md` §9 | Known gap |
| **Delegated admin as a relationship** | The harness administers subtrees on the owner's behalf without holding the owner's passkey | [delegated-admin-relationship.md](./delegated-admin-relationship.md) | Follow-up / open questions |
| **LLM primitives in KRL** | The inward-facing half and step 2 of the escalation ladder: local inference sidecar, `llm:classify` / `llm:extract` on picos while the harness plans; shared audit and budget events | [pico-llm-capabilities.md](./pico-llm-capabilities.md) | Brainstorm |
| **Selective logging, replay, mirrors** | Audit of every committed proposal; sandbox mirrors for risky sub-agents; replay across model versions | `MEMORY.md` → ROADMAP §1–3 | Sketch |
| **Pico move / portability** | The agent's whole mesh moves between engines; vendor-independent memory | [pico-move.md](./pico-move.md) | Draft; phases A–D |
| **Discovery channels + `filterBindingsForCaller`** | Per-caller tool exposure; skill-gating in the bridge | `packages/pico-engine/public/docs/krl/discovery.md` | Shipped 1.5 |
| **Skills registry** | Home for the role library and prototype definitions | `manifold-api/io.picolabs.manifold.skills_registry.krl` | Exists; needs generalizing beyond things |
| **MCP bridge reference** | Envelope, skill-gating, and prompt-design lessons | [MCPforEXP](https://github.com/picolab/MCPforEXP) (`docs/prompt-design.md`, `docs/lessons-learned.md`) | Reference implementation |

The first two rows gate everything else. Without schemas the bridge is hand-written wrappers again; without the policy fix, handing ECIs to a model is unsafe.

---

## Phasing

| Phase | Deliverable                                                                                                                                                        | Depends on                              |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------- |
| **0** | Design sign-off; harness kit event vocabulary; name the domain                                                                                                     | —                                       |
| **1** | Engine-native MCP server over wrangler + discovery (hand-listed tools acceptable; standalone deliverable); harness root pico; sleeping task picos with `needs_reasoning` / `proposal` round-trip | Discovery (shipped)                     |
| **2** | Role library v0 (task, watcher, memory, mailbox) as prototypes in a generalized registry; delegation by minting scoped channels                                    | Channel policy fix                      |
| **3** | Tools generated from `picoSchema`; generated rulesets restricted to the harness-kit DSL, compiled and linted, installed per pico with provenance                   | Pico schemas                            |
| **4** | Cross-mesh agents: DID relationships between harnesses with preset Rx policies; introduction flows                                                                 | `peer` type and presets; key protection |
| **5** | Promotion pipeline (tier 4 → tier 2); mirrors as sandboxes; replay across model versions                                                                           | Logging, replay, mirrors                |

---

## Open questions

1. **Where does reasoning dispatch live?** A harness polling a queue pico, a webhook from the engine to the harness, or the harness subscribing to an event stream per pico?
2. **Existing harnesses (OpenClaw) — decided: not a general direction.** OpenClaw's large user base makes a plugin tempting, and it is technically realistic, though not through the slot the name suggests. Its *agent-harness plugin* is a low-level executor for one model turn, meant for model families with their own native session runtime, and third-party installation is marked experimental. The fitting surfaces are the ordinary ones:
   - **Level 1 — MCP server** (no plugin code): the mesh as tools. No sleeping sub-agents; the agent touches the mesh only when already awake.
   - **Level 2 — native plugin** (agent tools, webhook route, background service, lifecycle hooks): picos wake OpenClaw by posting `harness:needs_reasoning` to a webhook; a sub-agent-spawn hook creates a task pico and binds session to pico DID; the service can run a local engine. This is the most OpenClaw could offer without users giving anything up.
   - **Level 3 — memory capability**: the mesh as OpenClaw's memory, with `authorizeSearchHits` mapped onto channel policy. The memory slot is exclusive, so users would have to drop Mem0, Cognee, or whatever they use now.

   The disadvantages decide it. **Inversion of control:** OpenClaw core owns the transcript, context, and model resolution, so "a sub-agent *is* a pico" degrades to "a sub-agent *has* a pico," with two sources of truth to keep in sync. **Half a security boundary:** channel policy protects the mesh from the agent, not the world from an agent that also has shell, browser, and community skills, and OpenClaw's skills supply chain has a poor record (hundreds of malicious ClawHub skills reported; HKCERT and press warnings). **Churn:** every plugin API is documented as experimental, a standing maintenance tax on a small team. **Visibility:** as a plugin, picos become plumbing, cutting against the goal of making the programming model visible. **Ethos:** OpenClaw is gateway-centric; picos argue the durable part should be owned and runtime-independent.

   What survives is the harness-agnostic core: an **engine-native MCP server** over wrangler, discovery, and pico schemas. That is a standalone win for the engine regardless of any harness — every pico becomes usable from any MCP client (Claude, OpenClaw, IDE agents, MCPforEXP's successor) with tools generated from declared surfaces instead of hand-written wrappers — and it justifies finishing [pico-schemas.md](./pico-schemas.md) on its own merits. A thin OpenClaw adapter remains possible later as a client of that server plus a standard wake-up webhook, but the mesh, not any harness, stays the durable center.
3. **Generated ruleset hosting.** Rulesets are loaded by URL. Does the engine host generated rulesets itself, or does the harness publish them to a registry pico?
4. **Blast radius of a bad generated rule.** Rate limits per pico? Mandatory dry run against a mirror before install?
5. **Human in the loop.** Which proposal classes always require `human:approval_needed`, and is that list in the substrate or per owner?
6. **Memory shape.** One memory pico per topic, per person, per project — or let the agent decide, with the role library offering conventions?
7. **Naming.** `harness`, `agent`, or something else for the event domain, given the actor-not-agent convention?
8. **Relationship to local LLM.** When a pico has both `llm:*` locally and a harness above it, who decides which reasoner handles an event? *Proposed:* a reasoning-broker pico routing by task type and difficulty, as described in [Local models, routing, and escalation](#local-models-routing-and-escalation) — specialized models by role, then the ladder of rules, local model, and frontier model, constrained by a per-pico privacy ceiling and a cost/quality preset. Remaining questions: where the ceiling lives (PDS settings vs. channel policy), whether the local model or the harness kit makes the escalation call, and how a parent's ceiling constrains its children.

---

## References

- [pico-llm-capabilities.md](./pico-llm-capabilities.md) — the inward-facing design this doc flips
- [pico-overview.md](./pico-overview.md) — what picos are and what they enable
- [OpenClaw sub-agents](https://docs.openclaw.ai/tools/subagents) · [OpenClaw agent harness plugins](https://docs.openclaw.ai/plugins/sdk-agent-harness) · [OpenClaw Plugin SDK overview](https://docs.openclaw.ai/plugins/sdk-overview) · [OpenClaw memory and context slots](https://docs.openclaw.ai/plugins/sdk-overview/memory-and-context) · [HKCERT on OpenClaw supply-chain risk](https://www.hkcert.org/blog/openclaw-s-rapid-adoption-exposes-skills-supply-chain-and-fake-installer-risks-in-a-high-privilege-ai-agent-platform) · [The Register on OpenClaw security](https://www.theregister.com/2026/02/03/openclaw_security_problems/) · [What Is OpenClaw? (Zylon)](https://www.zylon.ai/resources/blog/what-is-openclaw-a-practical-guide-to-the-agent-harness-behind-the-hype)
- [Introducing Muse Code (Meta AI Research)](https://research.meta.ai/blog/introducing-muse-code-and-muse-spark-1-2)
- Cursor multi-model routing: [Available models (Cursor docs)](https://cursor.com/help/models-and-usage/available-models) · [Auto mode router explained](https://www.vibecodingacademy.ai/blog/cursor-auto-mode-router-explained) · [Cursor models guide (TechJack)](https://techjacksolutions.com/ai-tools/cursor/cursor-models/)
- Windley, [AI Integration in Picos Starts with Events](https://www.windley.com/archives/2026/06/ai_integration_in_picos_starts_with_events.shtml) — webhook → callback → pico-as-memory → orchestration progression
- Windley, [Building a Conversational Interface for Manifold with MCP and Picos](https://www.windley.com/archives/2026/04/building_a_conversational_interface_for_manifold_with_mcp_and_picos.shtml) — envelope, skill-gating, context degradation
- Windley, [Promises and Communities of Things](https://www.windley.com/archives/2015/12/promises_and_communities_of_things.shtml) — picos as collections of promises
- Windley, [Sharing in SquareTag: Borrowing my Truck](https://www.windley.com/archives/2013/07/sharing_in_squaretag_borrowing_my_truck.shtml) — the introduction pattern
- Windley, [Reactive Programming Patterns: Examples from Fuse](https://www.windley.com/archives/2016/04/reactive_programming_patterns_examples_from_fuse.shtml) — guard rules, self-healing, correlation
