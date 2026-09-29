# Pico LLM capabilities (local model, KRL-first)

**Status:** brainstorm / TODO (2026-09-18)

**Goal:** Add optional **local inference** (e.g. Gemma via Ollama, llama.cpp, or an engine sidecar)
so each pico can reason over **its own** context — rulesets, entity vars, recent events, channels,
children, relationships — without sending mesh data to a cloud API by default.

**Design lens:** Picos are **actors**, not monolithic chatbots. LLM work should be **invoked from
KRL**, bounded by **channel policy**, and auditable as **events**. Prefer programmatic surfaces
(`defaction`, `def function`, queries, entity vars) over UI-only features.

**Terminology:** Say *actor* / *pico*, not *agent* (see `docs/design/one-summit-japan-2026-cfp.md`).

---

## Architecture sketch

```
┌─────────────────────────────────────────────────────────┐
│  KRL ruleset on pico P                                   │
│    when event → llm:complete(...) → entity + new events  │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Engine LLM primitive (or io.picolabs.llm ruleset)       │
│    - build context from pico boundary                  │
│    - call local backend (Gemma, etc.)                  │
│    - return structured JSON / text                     │
│    - emit llm:* lifecycle events                       │
└───────────────────────────┬─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│  Inference backend (pluggable)                          │
│    - Ollama / llama.cpp sidecar on Fargate               │
│    - optional cloud fallback per pico (explicit opt-in)  │
└─────────────────────────────────────────────────────────┘
```

**Per-pico context boundary:** The model sees only what the calling pico (and policy) allows —
installed RIDs, entity keys, event tail, channel metadata, child names — not the whole engine.

**Non-determinism rule:** LLM **proposes**; KRL **commits**. Critical paths (security, safety,
billing) stay rules-first: guards, human confirmation events, or explicit `commit: true` flags.

---

## KRL / programmatic API (priority backlog)

These are the surfaces mesh apps and rulesets should call directly.

### Engine primitive or `io.picolabs.llm` ruleset

| ID | Item | KRL / API shape | Notes |
|----|------|-----------------|-------|
| **L1** | **Core completion action** | `llm:complete(prompt, opts)` → `{ text, json?, usage }` | `opts`: `temperature`, `maxTokens`, `jsonSchema`, `model` |
| **L2** | **Structured extraction** | `llm:extract(text, schema)` → map | NL or webhook body → typed map for entity vars |
| **L3** | **Classification** | `llm:classify(text, labels[])` → `{ label, confidence }` | Route webhooks to child picos via events |
| **L4** | **Summarize** | `llm:summarize(sources[], maxLen)` → string | `sources`: event tail, entity slice, child rollups |
| **L5** | **Embeddings** | `llm:embed(text)` → vector | Optional; local model or small embedding sidecar |
| **L6** | **Context builder** | `llm:context(opts)` → string | Programmatic mesh snapshot for prompts; `opts`: `events`, `entities`, `rulesets`, `depth` |
| **L7** | **Async completion** | raise `llm:completion_requested` → `llm:completion_ready` | Long runs without blocking rule evaluation |
| **L8** | **Token / cost budget** | entity `llm:budget` + engine enforcement | Per-pico daily cap; reject or queue when exceeded |
| **L9** | **Model selection** | entity `llm:model` or channel tag `llm-gemma-2b` | Default from engine config; override per pico |
| **L10** | **Installable ruleset** | `io.picolabs.llm` on root or per-pico | Same pattern as `io.picolabs.oauth`; queries for status |

### Events (raise / subscribe from KRL)

| Event | Purpose |
|-------|---------|
| `llm:completion_requested` | Async pipeline; attrs: `prompt`, `requestId`, `schema` |
| `llm:completion_ready` | Result; attrs: `requestId`, `text`, `json`, `error` |
| `llm:classification` | Emitted after classify; attrs: `label`, `input`, `channelEci` |
| `llm:extraction` | Structured parse of inbound payload |
| `llm:budget_exceeded` | Ops / parent pico can react |
| `llm:action_proposed` | Model suggested wrangler op; **does not execute** until rule confirms |
| `llm:action_committed` | Audit trail after explicit KRL commit |

### Entity variables (persistent, KRL-readable)

| Key | Purpose |
|-----|---------|
| `llm:memory` | Episodic notes (list of `{ at, note }`) — rules append via `llm:remember` |
| `llm:preferences` | Owner prefs (units, tone, quiet hours) |
| `llm:system_prompt` | Per-pico role string |
| `llm:recent_context_hash` | Dedup / cache invalidation |
| `llm:tool_allowlist` | Event/query names the model may *propose* |

### Wrangler / engine queries (callable from KRL)

| Query | Purpose |
|-------|---------|
| `llm:enabled()` | Feature flag / backend reachable |
| `llm:explain_event(eventId)` | Post-mortem text for debugging |
| `llm:explain_ruleset(rid)` | Human summary of installed RID |
| `llm:mesh_summary(depth)` | Parent pico rollup of children (names, roles, last event) |
| `llm:policy_explain(eci)` | Why channel allowed/denied (for ops picos) |

### Channel / webhook adapters (SKY → KRL)

| ID | Item | Flow |
|----|------|------|
| **C1** | **NL webhook → event** | POST natural language on dedicated channel → `llm:extract` → raise domain event if policy allows |
| **C2** | **Structured webhook assist** | Unknown JSON body → `llm:extract` with schema from entity → domain event |
| **C3** | **Tag `llm-ingress`** | Channel policy: only `llm:*` + narrow domain events; resists prompt injection to wrangler |

### Tool use bounded by channel policy

| ID | Item | KRL pattern |
|----|------|-------------|
| **T1** | **Propose-only tools** | Model returns `{ "raise": { "domain", "type", "attrs" } }`; rule validates + `raise event` |
| **T2** | **Allowed query list** | Model requests query name from allowlist; engine runs query, returns result to next completion |
| **T3** | **No direct wrangler from model** | Engine never executes wrangler ops from raw model output |

### Hierarchy & cross-pico (event-driven)

| ID | Item | KRL pattern |
|----|------|-------------|
| **H1** | **Delegate to child** | Parent `llm:classify` → `raise event` to child with `attrs.task` |
| **H2** | **Child report up** | Child raises `task:result` → parent `llm:summarize` → notify human |
| **H3** | **Peer handoff** | Over subscription: classify → forward structured event to related pico |
| **H4** | **Escalation** | Entity counter + rule: after N failures, raise `human:approval_needed` |

### Ruleset authoring (KRL compiler loop)

| ID | Item | KRL / API |
|----|------|-----------|
| **K1** | **Draft ruleset** | `llm:complete` with KRL grammar hints → string; separate action validates via compiler |
| **K2** | **Patch ruleset** | Diff-style edit proposal; human or rule applies via wrangler install |
| **K3** | **Explain compile error** | Pass compiler stderr → `llm:explain` → entity for UI |
| **K4** | **Generate test events** | From RID meta + rules, propose event JSON for manual or automated raise |

### Memory & replay

| ID | Item | Notes |
|----|------|-------|
| **M1** | **Log LLM I/O optionally** | Schema-flagged `llm:*` events in pico event log for replay/debug |
| **M2** | **Summarize-and-forget** | Rule compresses old `llm:memory` via `llm:summarize` |
| **M3** | **Parent rollup** | Child exposes `summary()` query; parent caches in entity |

### Security & ops (programmatic hooks)

| ID | Item | Notes |
|----|------|-------|
| **S1** | **Prompt injection guard** | Untrusted `/sky/event` content never in system prompt verbatim; delimit + classify |
| **S2** | **Redact before inference** | Engine strips secrets (OAuth tokens, PII keys) from `llm:context` |
| **S3** | **Audit event** | Every completion logs `{ callingRID, channelEci, requestId, tokenCount }` |
| **S4** | **Rate limit per ECI** | Engine primitive, configurable |

---

## Secondary backlog (UI / operator — not KRL-first)

Lower priority for mesh apps; useful for developers and ops.

| ID | Item |
|----|------|
| **U1** | Rulesets tab: KRL copilot (uses same backend as **K1–K3**) |
| **U2** | "Explain this pico" panel (calls **llm:mesh_summary**, read-only) |
| **U3** | Interactive debug: paste event JSON → **llm:explain_event** |
| **U4** | Confluence/runbook export from mesh topology |
| **U5** | Settings: default model, backend URL, global enable |

---

## Use cases unlocked (mesh-wide, not sensor-only)

Programmatic paths in **bold**.

| Domain | Capability |
|--------|------------|
| **Home / building** | **NL → scene events**; anomaly narrative from event correlation |
| **Small business** | **Classify** inbound email/webhook → CRM/task events |
| **Personal knowledge** | Child picos + **llm:memory**; root **summarize** across children |
| **Education** | **K1/K3** — describe behavior → KRL + explain errors |
| **Compliance** | **llm:policy_explain** before channel policy changes commit |
| **Multi-tenant / Manifold** | Community pico **classifies** onboarding; proposes ruleset bundle URL |
| **Cross-engine** | Relationship establishment: **summarize** public capabilities for peer |
| **Mesh health** | Ops pico subscribes to **llm:budget_exceeded**, stale ruleset queries |

---

## Deployment notes (AWS / Fargate)

- Inference likely **not** inside the main engine container initially — **sidecar** or separate
  service (Ollama on EC2/GPU, or CPU-quantized Gemma).
- Engine env: `PICO_ENGINE_LLM_BACKEND=http://ollama:11434` (TBD).
- **Single writer** EFS rule unchanged; LLM state lives in entity vars + optional event log.
- Public ECR image stays slim; document optional LLM compose overlay.

---

## Phasing proposal

| Phase | Deliverable | KRL items |
|-------|-------------|-----------|
| **0** | Design sign-off + backend adapter interface | — |
| **1** | `llm:complete`, `llm:enabled`, audit events | L1, L6, L10, S3 |
| **2** | Structured extract/classify + async events | L2, L3, L7, C1 |
| **3** | Memory entity + parent delegation patterns | M1, H1–H2, L4 |
| **4** | Ruleset copilot (compiler loop) | K1–K4 |
| **5** | Tool propose + policy-bounded queries | T1–T3, S1–S2 |

---

## Open questions

1. **Engine primitive vs ruleset-only?** OAuth split: engine enforces bearer; ruleset holds mesh
   policy. Same for LLM budgets and backend selection?
2. **Blocking vs async in KRL?** Does `llm:complete` block the rule thread or always async?
3. **Shared backend vs per-pico model weights?** One Gemma instance; per-pico prompts only.
4. **Manifold abstraction?** e.g. `manifold:interpret(message)` wrapping L2/L3 for app devs.
5. **Cloud fallback?** Explicit per-pico opt-in only?

---

## References

- Brainstorm session: 2026-09-18 (pico-engine chat)
- Actor terminology: `docs/design/one-summit-japan-2026-cfp.md`
- Channel policy (tool bounds): ROADMAP §4 in `MEMORY.md`
- PDS as data plane for memory: ROADMAP §6 in `MEMORY.md`
