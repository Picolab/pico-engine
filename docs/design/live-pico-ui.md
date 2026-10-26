# Live pico UI

**Status:** design (2026-10-20). Items marked **1.8** are in [`release/1.8.md`](../release/1.8.md); the rest are proposed for later releases.
**Context:** Smalltalk is one of the models for picos and for the developer UI. A Smalltalk image is alive: every object can be opened, inspected, and sent messages, and the developer works by moving around inside the running system rather than editing files and restarting. The 1.8 schema work (annotations, ruleset schemas, rule outcome reporting) makes the same thing possible for picos. This doc collects the UI pieces that follow from it so they add up to one place instead of separate features.

**Related:** [pico-schemas.md](./pico-schemas.md) (annotations, `@example`, outcome reporting, UI backlog U1–U9) · [pico-overview.md](./pico-overview.md) · [agent-harness-on-mesh.md](./agent-harness-on-mesh.md)

---

## Summary

The developer UI becomes a **pico inspector**: open any pico and see its documentation, its state, its recent activity, and its working examples, all describing **the live pico** rather than the source, and follow any reference on the page to the pico it names. 1.8 builds most of the pieces. The main new piece after that is **linked references**.

---

## The Smalltalk mapping

| Smalltalk | Pico | Status |
|-----------|------|--------|
| The image: everything is alive, nothing is "just a file" | The engine and its meshes: a pico is always on and holds its own state | Exists |
| An object | A pico | Exists |
| Sending a message | Raising an event or running a query | Exists (Testing tab) |
| **Browser**: classes, methods, comments | Rulesets, operations, queries, annotations: the **Docs view** | **1.8** |
| Examples runnable from the browser | `@example` with **Try it** | **1.8** |
| **Workspace**: "do it" / "print it" in context | **KRL console**: evaluate an expression in this ruleset on this pico | **1.8** |
| Saved workspace contents, kept in the image | **History and saved requests**, kept in the pico | **1.8** |
| **Inspector**: open an object, see its state | Queries plus the console, together in one view | **1.8** pieces; combined view later |
| Message trace / debugger | Logs: which rules an event selected, fired, and emitted | Partial (Logging tab, outcome reporting) |
| Following a reference by clicking it | Click an ECI, child, parent, relationship, or DID to open that pico | **Missing** — the main next step |
| Moldable views (Glamorous Toolkit): an object supplies its own views | A ruleset supplies a custom panel for its picos | Later |

---

## Principles

| Principle | Meaning |
|-----------|---------|
| **Describe the live pico, not the source** | Docs come from `rulesetSchema(rid)` for the version installed on this pico; examples show their result *here*; activity shows what this pico actually did |
| **Every reference is navigable** | Anything that names a pico — an ECI, a picoID, a DID, a child, a relationship's Tx — is a link to that pico |
| **One set of components** | Docs view, Testing tab, and console share attribute tables, typed fields, and example presets, so they can't disagree |
| **Things that work are kept in the pico** | Saved requests live with the pico (and move with it), like workspace contents saved in the image |
| **Promotion from live to source** | A request that works on one pico can become an `@example` in the ruleset, then a doctest |
| **Power tools are owner-only** | The console and saved requests are on the UI channel with a passkey session, never on discovery, OAuth, or app channels |

---

## The pico inspector

Opening a pico gives one view with these facets:

| Facet | Shows | Source | Release |
|-------|-------|--------|---------|
| **Docs** | Per ruleset: description, operations (events to send, attributes, when it acts, what it may emit, sibling rules), queries | `rulesetSchema(rid)`; layout follows `krl-schema --format markdown` | **1.8** (U6) |
| **Try** | Each operation's `@example` presets as pre-filled forms; query examples run in place | `@example` in the ruleset schema | **1.8** (U7) |
| **Console** | Evaluate a KRL expression in a chosen ruleset's context: its globals, module aliases, `ent:` variables. Read-only by construction | `ctx:evalInRuleset` | **1.8** |
| **History / Saved** | Every event and query sent from the UI, with its outcome; named saved requests; "Copy as `@example`" | `io.picolabs.pico-engine-ui` entity, keyed by rid | **1.8** (U9) |
| **Activity** | Per operation: when it last fired, with which attrs, and what it emitted | Logs plus outcome reporting | Later |
| **Relationships / Tree** | Parent, children, relationships, each a link to the other pico | Wrangler and subscription queries | Exists as tabs; links are later |

The existing tabs (About, Channels, Rulesets, Relationships, Logging, Testing) don't go away; the inspector is the direction they move in. In 1.8 the facets arrive inside the Rulesets and Testing tabs.

---

## Linked references

The step that makes the UI feel like a live image. Today references appear as text.

| Reference | Where it appears | Opens |
|-----------|------------------|-------|
| ECI (any channel id) | Query results, log lines, attrs, channel lists, `Tx` / `Rx` of relationships | The pico that owns the channel, scrolled to that channel |
| Child family ECI | `children()`, Manifold `getThings()` | The child pico |
| Parent ECI | `parent_eci()`, About tab | The parent pico |
| Relationship | Relationships tab, `established()` | The pico at the other end |
| DID (`did:webvh`, `did:peer`) | Layer 2 relationships, `myDid()` | That pico; off-engine if it lives elsewhere |
| RID | Rulesets tab, logs, schemas | That ruleset's Docs facet on this pico |

**Resolution.** For channels on this engine, the engine already maps an ECI to its pico. Off-engine references (a relationship's `Tx_host`, a DID on another engine) open an off-engine node (`OffEngineNode.tsx` exists) showing what is known — host, DID, relationship — and, if the owner has access there, a link to that engine's UI.

**Recognition.** Query results and log entries are JSON; the UI recognizes reference-shaped values by field name (`eci`, `Tx`, `Rx`, `picoID`, `*_eci`, `*Did`) and by lookup (a string that is a known ECI on this engine). Lookup must stay cheap and must never reveal a channel the viewer couldn't otherwise see.

---

## Doctests

`@example` plus rule outcome reporting gives KRL what Rust and Elixir have: examples in the docs that run as tests, so they can't drift.

| Point | Rule |
|-------|------|
| What runs | For each operation example: install the ruleset on a pico in an isolated test engine, send the example's attrs as the entry event, and require the outcome **selected and fired** for the annotated rule. For each query example: run it and require no error |
| Placeholders | Examples with placeholders (`"<eci>"`, `"<rid>"`) don't run as written. They are skipped, or filled from a per-ruleset fixture (e.g. a second pico for `wellKnown_Tx`). Examples with only concrete values always run |
| Expected outcome | Default: the annotated rule fires. Examples that document a failure path need a way to say so; deferred until a real case needs it |
| Where | `krl doctest <file>` (or `krl-check --doctest`) against an isolated engine; a CI job over the bundled rulesets |
| Release | **1.8 stretch**: CI for the bundled rulesets, since every building block is already in 1.8. Fixtures for placeholder examples later |

Doctests also close the loop on history and saved requests: a saved request with its recorded outcome is a doctest on a live pico, and "Copy as `@example`" moves it into the source where CI checks it from then on.

---

## Later

| Item | Idea |
|------|------|
| **Activity facet** | Per operation, recent firings with attrs and emits, from logs and outcome reporting |
| **Moldable views** | A ruleset supplies a custom panel for its picos: an annotated shared function whose result the inspector renders (Manifold could show things and communities as a diagram). Needs a convention for the result shape |
| **Debugger** | Step through one transaction rule by rule, with the `pre` bindings at each step. Logs already record selection and firing; capturing bindings gets close |
| **Environments** | Placeholders in saved requests and examples filled from the pico: pickers for its channels, children, relationships |
| **Collections** | Saved requests run in order: setup flows, and the sequence rules (`before`, `then`, `within`) that aren't single tool calls |
| **Combined inspector** | The facets as one view per pico rather than spread over tabs |

---

## Open questions

1. **Linked references in 1.8 or later?** They are the main thing that makes the UI feel live, and partly a rendering change, but recognition and off-engine resolution need care. Proposed: first item after 1.8.
2. **Moldable view convention.** What does a ruleset return so the inspector can render it — a small set of known shapes (table, tree, graph), or HTML? Known shapes are safer and work in the docs site too.
3. **History cap and retention.** A fixed cap per pico (e.g. 50), per ruleset, or time-based? Saved requests are never trimmed automatically.
