# Pico schemas (events, queries, attributes)

**Status:** **engine complete for 1.8** (2026-10-23) — closure: [`pico-schemas-1.8.md`](pico-schemas-1.8.md). **Target release:** 1.8 (with channel policy fix).

## Summary

Each pico exposes a **surface** of events and queries determined by its **installed rulesets**. Integrators, the Testing tab, mirrors, LLM tools, and validation need a reliable **pico-level schema** — aggregated at the pico boundary, typed, and programmatically queryable.

### Design decision (2026-09-18)

**Annotate rules and functions with structured `/** … */` doc comments; derive everything else from the code.** (Revised 2026-10-19; the earlier `meta.schema` block is under [Alternatives considered](#alternatives-considered-metaschema).) Do **not** extend the `__testing` global or compiler-injected `__testing1` JSON — that path was a **kludge** (hidden global, heuristic attrs, manual wrangler maintenance, drift).

| Canonical                                           | Role                                                                                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **`/** … */` on rules and global functions**        | Opt-in, author-chosen discovery metadata (parser + compiler); unannotated = not discoverable                            |
| **Derived from code**                               | Entry points and constraints from `select when`; attrs from `event:attr`; args and optionality from function params     |
| **Engine pico schema**                              | Merged aggregate on ruleset install/uninstall (primitives); keyed per pico boundary                                     |
| **Wrangler queries**                                | `picoSchema()`, `rulesetSchema(rid)`, `channelSchema(eci)`, `schemaBindings(rid)` — thin exposure of engine APIs      |
| **`schemaBindings(rid)` ∩ channel policy**          | Discovery integrator subset — generated from ruleset schema, filtered by the caller's channel policy; no separate `public` marker |
| **Compiler `eventScope` extract**                   | Source of derived attrs for annotated rules; no lint for unannotated code                                               |
| **`__testing` global / query**                      | **Deprecated** — compat alias, then removed                                                                             |

**Today:** The Testing tab calls `GET /c/{eci}/query/{rid}/__testing` per ruleset. That is useful but **imperfect** and **not a pico schema**. See [What exists today](#what-exists-today).

---

## What exists today

### 1. Compiler-injected `__testing` (default)

On compile, `krl-compiler` builds a JSON blob (`__testing1`) and exposes query `__testing`:

| Source | What it captures |
|--------|------------------|
| **`meta.shares`** | Query names + arg names from `Function` type annotations |
| **Rule `select when`** | `domain` + `type` from each rule's event expression |
| **`event:attr("x")` in rule** | Attribute name `x` associated with that rule's selected event |

See `packages/krl-compiler/src/c/Ruleset.js`, `compile.js` (`eventScope.getTestingJSON()`).

**Limits:**

- **Per ruleset**, not merged for the pico.
- **Events only where rules listen** — not events the RS **raises** unless another rule selects them.
- **Attrs are heuristic** — only names appearing in rule bodies; no required/optional, no types.
- **`addAttr` is rule-wide** — an attr read in one branch may be attributed to all events in that rule.
- **Duplicates** — same `domain:name` from multiple rules or manual + compiler merge awkwardly.
- **Manual override** — RS may set global `__testing = { ... }` to shadow compiler JSON; often drifts (wrangler duplicates entries; legacy `"event"` typo vs `"events"` in old KRL).
- **Queries** — only **shared** queries; `provides` without `shares` omitted; no return types.

### 2. Testing tab (UI)

`packages/pico-engine-ui/src/components/PicoTabs/Testing.tsx`:

- Lists installed RIDs; user expands each → fetches `{rid}/__testing`.
- Renders forms for queries (args as untyped text fields) and events (attrs as text fields).
- Does **not** dedupe, validate, or show pico-wide view.
- TypeScript type `TestingSchema` is minimal: `{ name, args? }`, `{ domain, name, attrs? }`.

### 3. Discovery `bindings` (integrator-facing subset)

Rulesets that implement `discovery capabilities` return **`bindings`**:

```json
{
  "version": 1,
  "queries": [{ "name": "ping" }],
  "events": [{ "domain": "discovery_test", "name": "open", "attrs": [] }],
  "notifications": []
}
```

Filtered by `wrangler:filterBindingsForCaller(bindings, caller_eci, rid)` for least-privilege exposure to a **specific channel** — not the full pico surface.

**`notifications` is dropped from the target design.** Its only user is `io.picolabs.safeandmine`, whose block has three parts, none of which is a discovery concept of its own: `trigger` is an event already listed in `events`; `forward` is an `event:send` to Manifold's `add_notification`, which the compiler derives as an `emits` entry; `channels` (Manifold inbox / SMS / Prowl / Home Assistant) is Manifold configuration. Wrangler's `filterNotificationBindings` also puts Manifold vocabulary in the OS layer, against the engine ← wrangler ← manifold layering rule. **Plan:** 1.8 keeps passing a hand-written `notifications` block through `filterBindingsForCaller` so SafeAndMine keeps working; `schemaBindings` never emits one; 1.9 removes `filterNotificationBindings` along with hand-written `bindings()`. A UI that wants to show "this app sends notifications" reads the derived `emits` entry for `manifold add_notification`.

**Limits:**

- Opt-in per app ruleset; not automatic for wrangler/PDS/platform RSs.
- No arg/attr **types**; `publicTo` / relationship filtering is separate from schema registry.
- Discovery answers “what can **this caller** do?” not “what is **this pico**?”.

### 4. ROADMAP §1 (MEMORY.md)

Deferred work: pico-level schema at the boundary, validation, logging/replay flags. **Mechanism chosen:** doc annotations on rules/functions + **engine** pico schema merge; wrangler exposes queries (this doc). Covers **events and queries**.

---

## Target: two schemas

There are two schemas, and they serve different purposes. Keep them distinct.

**Ruleset schema** — what one ruleset offers, as its author annotated it. Produced by the compiler from that ruleset's annotations plus derived data (see [Compiler output](#compiler-output)), stored with the compiled ruleset. The **engine** reads it for an installed RID on this pico (`rulesetSchema(rid)`); **wrangler** exposes the same query to KRL and Sky. It is the **source** for everything else and the view the **Testing tab** uses: the developer is working on one ruleset at a time, and wants to see its operations with their `select`, `condition`, `alsoSelectedBy`, and `emits` — the rule-level detail.

```
rulesetSchema(rid) → {
  version: 1, rid, rid_version, description,
  operations: [ { rule, description, entry: [ { domain, name, constraints } ], select, condition,
                  prechecks, attrs, emits, alsoSelectedBy, examples?: [ { name, attrs } ] } ],
  queries:    [ { name, description, args: [ { name, type, required, default? | defaultExpr? } ], returns,
                  examples?: [ { name, args } ] } ]
}
```

**Pico schema** — the **aggregate** of the ruleset schemas of every installed ruleset, at the pico boundary. **Merged and stored (or computed on demand) in the engine** when rulesets are installed, uninstalled, or re-flushed — not in wrangler KRL or wrangler entities. Read via the engine API; **`wrangler:picoSchema()`** is a delegate for rulesets and the UI. It is the view for **discovery** (MCP tools, integrators, LLM context, Home Assistant): a caller of the pico doesn't care which ruleset handles an event, only what it can send and query. Operations are grouped by entry event, because several rulesets may react to one event; rule-level detail is summarized, not repeated.

```
picoSchema() → {
  version: 1,
  rulesets: [ { rid, description } ],
  events:   [ { domain, name, constraints, attrs, description, sources: [ { rid, rule } ],
                examples?: [ { rid, rule, name, attrs } ] } ],
  queries:  [ { rid, name, description, args, returns, examples?: [ { name, args } ] } ],
  conflicts: [ { domain, name, constraints, attr, types: [ { type, rid, rule } ] } ]
}
```

The layers form a chain: **ruleset schemas → pico schema → channel schema**. Each is derived from the one before it; only the first is authored. With no `public` marker, there is a single policy-filtered view, and whose channel is used is the only difference between "what can I do here?" (the caller's own ECI) and "what would this channel allow?" (an ECI the owner names).

### Layering: engine vs wrangler

Per **engine ← wrangler ← manifold**, schema **merge and policy intersection are engine primitives**; wrangler is the pico OS surface that exposes them to KRL, discovery rulesets, and HTTP.

| Concern | Engine | Wrangler |
| -------- | ------ | -------- |
| Ruleset schema JSON on compiled module | ✅ (compiler output; ruleset cache by URL) | — |
| Per-pico merge, attr union, `conflicts[]` | ✅ on install / uninstall / flush | — |
| `rulesetSchema(rid)` for installed RIDs | ✅ (`ctx:` + Sky query) | delegates |
| `picoSchema()` aggregate | ✅ | `wrangler:picoSchema()` → engine |
| `channelSchema(eci)` = pico schema ∩ channel policy | ✅ (policy is already engine) | delegates |
| `schemaBindings(rid)` shape for discovery | ✅ (pure transform from ruleset schema) | delegates; app `bindings()` calls it |
| `meta:schema` (own RS, no RID arg) | ✅ from `rsCtx.ruleset` | — |
| `wrangler schema_updated` (S8) | raises `engine ruleset_set_changed` (P2: from `ctx:install` / `ctx:uninstall`) | re-raises as `wrangler schema_updated` with the same attrs |

Wrangler **does not** maintain a parallel schema entity or merge logic in KRL. Install/uninstall already flow through the engine (`ctx:install`, …); the engine updates the pico schema in that lifecycle (or recomputes from installed RIDs + cached compiled schemas — see [open question 1](#open-questions)).

This isn't only layering. A wrangler install hook would see only installs that go through wrangler's `install_ruleset_request` rule, and several paths don't: the engine's **default installs** (PDS and the other bundled rulesets), **direct `ctx:install`** calls, and **portable import** (`importSubtree`, which installs rulesets as part of restoring a subtree). A wrangler-maintained pico schema would silently miss all of them. The engine is the only layer that sees every install.

**Unit of record:** the ruleset schema is per **ruleset**; the pico schema is per **pico boundary** (like channel policy), because multiple rulesets react to one raised event.

**Layers:**

| Layer              | Audience                                 | Contents                                                                 |
| ------------------ | ---------------------------------------- | ------------------------------------------------------------------------ |
| **Ruleset schema** | Developer, Testing tab                   | One RID's annotated operations and queries, with rule-level derived detail (`rulesetSchema(rid)`) |
| **Full schema**    | Owner, mirrors, LLM context              | Aggregate of all installed ruleset schemas at the pico boundary (`picoSchema()`) |
| **Channel schema** | Discovery, MCP, OAuth-scoped integrators (the caller's own ECI); owners configuring webhooks or checking what a channel exposes before handing it out (a named ECI) | Pico schema ∩ that channel's event and query policy (`channelSchema(eci)`; today's analog: `filterBindingsForCaller`) |


### Merging attrs across rules

When more than one annotated rule — in the same ruleset or different ones — uses the **same entry point** (same domain, type, and derived constraints), the pico schema merges their attrs into one event entry. Rules on the same event with **different constraints** (e.g. different `where event_name == …` constants) are separate entry points and are never compared. Each ruleset schema keeps its own rule's attrs exactly as annotated; merging happens only in the pico schema.

| Part of the attr | Can it differ between rules? | Merged result |
|------------------|------------------------------|---------------|
| Name | No — it's the key | — |
| **Type** | **No.** One event carries one value; a caller can't satisfy `Number` and `String` at once | Same everywhere → that type. Different → a **conflict**: `anyOf` in the JSON Schema, and an entry in `conflicts` |
| Required / optional | **Yes.** Two rules are two operations; one may need an attr the other ignores | Required only if **every** source rule requires it; otherwise optional, with the description noting which rule needs it. Otherwise a generated tool would force callers to supply attrs only another operation uses |
| Description | Yes — each rule says what *it* does with the attr | Kept per source, not merged |

**When conflicts are detected:**

| Where the rules live | When                                                                          | Surfaced as                                                           |
| -------------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Same ruleset         | Compile time                                                                  | Compiler warning (`krl check`, flush via `ctx:validate`)              |
| Different rulesets   | Every merge into the pico schema: install, flush/reinstall, **and uninstall** | `picoSchema().conflicts`, `wrangler schema_updated` (S8), warning log |

Conflicts **never block an install**: rulesets are installed for what they do, and annotations are descriptive. They are **stored, not just logged**, because the second ruleset may arrive months after the first, installed by someone else; the Testing tab and MCP server show them whenever they read the pico schema. They are **recomputed on every merge**, so they always reflect what is installed now, independent of install order.


### Schema change event

**As implemented in P2:**

| Layer | Event | Attrs |
|-------|-------|-------|
| Engine (`ctx:install`, `ctx:uninstall`, flush when hash changes) | `engine ruleset_set_changed` | `action`, `rid`, `url`, `hash` (`{ old, new }`) — see **Target attrs** below |
| Wrangler (`schema_updated_on_ruleset_set`) | `wrangler schema_updated` | same attrs, passed through |

**Gaps to close in P2** (found reading the implementation):

| Gap | Detail | Fix |
|-----|--------|-----|
| Not every install path notifies | Portable import (`subtreeState.ts`: `child.install(…)`) and root provisioning (`provisionRoot.ts`: `pico.install(…)`) call the framework's `install` directly, bypassing `ctx:install` — the same bypass that is the reason the merge lives in the engine | Move the notification onto the core install/uninstall path (or wrap the framework calls) so every path raises it |
| ~~Flush never notifies~~ | Done: `ctx:flush` + registry hook when hash changes; full target attrs | — |
| ~~Errors are swallowed~~ | Done: log at error/warn in `schemaNotify` | — |
| ~~Fires on every install, not on change~~ | Done: compare `picoSchema()` before/after | — |

**Raise only on actual change.** A rule may select `wrangler schema_updated` and react by flushing or installing other rulesets (S12). If the event fires on every install or flush, such a rule can loop. The engine compares the pico schema before and after (or the contributing ruleset's hash) and raises only when something discoverable changed. A flush of an unchanged hash is already a no-op in the registry; this keeps the event consistent with that.

**Target attrs** (superset of P2's; existing `rid`/`action` keep their meaning):

| Attr | Content |
|------|---------|
| `action` | `install`, `uninstall`, or `flush` |
| `rid`, `url` | The ruleset whose change caused the event |
| `hash` | `{ old, new }`; `old` null on install, `new` null on uninstall |

A rule can then select narrowly — `select when wrangler schema_updated where event:attr("rid") == "io.picolabs.thing"`. Consumers that need the details (what changed, current `conflicts`) read `picoSchema()` after the event. Per-entry diffs (`added` / `removed` / `changed`) and `conflicts` in the event are deferred until a consumer needs them.

**Module dependents need no rule.** If "dependent" means a ruleset that `use module`s the changed one, the engine already handles it: `CorePico.onRulesetLoaded` re-links every ruleset on the pico that uses the flushed RID when the URL matches and the hash changed. A `schema_updated` rule that flushes dependents is for other kinds of dependency (a ruleset that reads another's schema, a catalog entry in another pico, cross-pico conventions).

---

## Why annotations (not `__testing`)

The `__testing` mechanism was a compile-time workaround:

- Schema lived in a **global variable** shadowing compiler output, not in `meta` with `shares`.
- Event attrs were **inferred** from rule bodies (`event:attr`), not declared.
- Wrangler and legacy RSs **hand-maintained** large JSON maps that drift from actual rules.
- Testing tab and discovery had **no shared source of truth** with bindings.

Putting discovery metadata **on the rule or function it describes** keeps it in sync with the code, and lets the compiler derive what the code already says (select expression, attrs read, parameters). The **engine** merges compiled JSON at the pico boundary on install/uninstall; discovery reads annotated entries via `schemaBindings` and filters by channel policy.

**Migration:** compiler emits normalized discovery JSON from annotations; `__testing` query becomes a thin alias (one release) then removed; wrangler replaces its hand-maintained `__testing` global with annotations on its rules and shared functions.

---

## Schema input (priority)

This section is an inventory of **every place schema information can come from**, ranked by how far to trust it. Some sources are new (annotations), some exist today and are being phased out (`__testing`, hand-written `bindings()`), and some are mechanisms rather than content (the install hook that carries a ruleset schema into the pico schema). It matters mostly during migration: when a ruleset has more than one source, this order decides which one wins, and which are only hints or debugging aids. The end state is two rows: annotations plus derivation produce each ruleset schema (R1), and the install hook aggregates them into the pico schema (R5). Everything else is either compatibility or tooling.

| ID     | Source                                      | When                 | Trust                                                                                                         |
| ------ | ------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **R1** | **Doc annotations + derived select/params** | Compile / flush      | **Authoritative** for what is discoverable                                                                    |
| **R2** | **Compiler extract**                        | Compile              | Fills attr names for annotated rules; nothing for unannotated                                                 |
| **R3** | **Manual `__testing` global**               | Compile              | **Deprecated** — warn on flush                                                                                |
| **R4** | **`bindings()` function**                   | Runtime              | Hand-written today; replaced by `schemaBindings(rid)`, which generates the same shape from the ruleset schema |
| **R5** | **Engine install lifecycle**                | RS install/uninstall / flush | Engine merges or removes the ruleset schema contribution in the pico aggregate (not wrangler KRL)              |
| **R6** | **Observed traffic** (optional)             | Runtime              | Debug overlay only                                                                                            |

**Goal:** R1 + R5 as canonical; the Testing tab reads **ruleset schemas**, integrators and discovery read the **pico schema**.

---

## KRL / programmatic API (backlog)

This is the **work list for what code can do with the schemas** once they exist: **engine** merge and queries (S1–S3, S6–S10), plus **wrangler** delegates and the `schema_updated` event (S8). It is the surface that the Testing tab, the MCP server, discovery, and other rulesets are built on. None of it is syntax a ruleset author writes; authors write annotations (next section) and these functions do the rest.

| ID         | Item                                | Shape                                                                                                                                                                                                                                                                                                                                              |
| ---------- | ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **S1**     | **Pico schema query**               | Engine: `ctx:picoSchema()` (and Sky equivalent). Wrangler: `wrangler:picoSchema()` → same. Aggregate for discovery / MCP                                                                                                                                                                                                                           |
| **S2**     | **Ruleset schema query**            | Engine: `ctx:rulesetSchema(rid)` — one **installed** RID; `null` if not installed; no RID → all installed keyed by RID. Wrangler: `wrangler:rulesetSchema(rid)` → same. KRL + HTTP via wrangler shares                                                                                                                                    |
| **S2a**    | **Own schema**                      | `meta:schema` — the calling ruleset's own schema. KRL only. Read from the compiled ruleset on `rsCtx.ruleset`, the same context `meta:rid` and `meta:rulesetURI` use; no wrangler round trip. (A no-argument wrangler call can't do this: module functions run in the module's own context and get no caller RID.)                                 |
| **S3**     | **Channel schema**                  | Engine: `ctx:channelSchema(eci)` — pico schema ∩ channel policy. Wrangler: `wrangler:channelSchema(eci)` → same                                                                                                                                                                                                                                    |
| ~~**S4**~~ | ~~Validate event attrs~~            | **Dropped.** The event selector (`attr re#…#`, `where`) and the rule condition already decide whether a rule runs; a required `@attr` check would duplicate them. The diagnostic need — *why didn't my rule run?* — is met by rule outcome reporting, including *not selected* for annotated rules whose selector didn't match                     |
| ~~**S5**~~ | ~~Validate and convert query args~~ | **Dropped.** KRL already handles this dynamically (operator coercion) and explicitly (`.as()`). Types are lost only on GET query strings; JSON POST bodies keep them (`mergeGetPost` merges `req.body`). The MCP server and Testing tab send JSON bodies typed from the schema, so no engine conversion is needed. `@param` types stay descriptive |
| **S6**     | **Register on install**             | Engine merge when `ctx:install` (or equivalent) completes (R5)                                                                                                                                                                                                                                                                                   |
| **S7**     | **Unregister on uninstall**         | Engine removes RID contribution and recomputes on uninstall / flush                                                                                                                                                                                                                                                                                |
| **S8**     | **Schema change event**             | See [Schema change event](#schema-change-event). Engine raises `engine ruleset_set_changed`; wrangler re-raises it as `wrangler schema_updated` |
| **S9**     | **Conflict detection and attr merge** | See [Merging attrs across rules](#merging-attrs-across-rules). Only a **type** mismatch for the same attr on the same entry point is a conflict. Same ruleset → compiler warning; different rulesets → recorded in `picoSchema().conflicts` and S8, logged, never blocks install |
| **S10**    | **JSON Schema export**              | `picoSchemaAsJsonSchema()` for OpenAPI/MCP/HA generators                                                                                                                                                                                                                                                                                           |
| **S11** | **Registry schema by URL** (later) | Schema of a ruleset **by URL**, read from the engine's ruleset cache (`RulesetRegistry` / `rulesets-db`) without installing it: "what would installing this give a pico?" For the harness choosing a role ruleset before install ([agent-harness-on-mesh.md](./agent-harness-on-mesh.md)) — not a separate Manifold skill-list pico (retired; see that doc). **Keyed by URL, not RID**, matching the cache: different picos may run the same RID from different sources (a test copy, a fork, a pinned version), and each URL has its own compiled schema. **Read-only lookup**, returning `null` on a cache miss; no fetch inside a query. **Populated by a deliberate flush-only step** (`ctx:flush(url)` without install, wrapped by wrangler as an event) — mechanically possible today but **new usage**: in practice rulesets are only flushed as part of install (wrangler's install rule flushes then installs) or after, to pick up a new version, so the cache today holds only URLs some pico has installed. Engine-level rather than a pico view, since it describes the engine's cache. The cache is never pruned, so it is not a catalog |
| **S12** | **Flush one ruleset (wrangler)** | `wrangler flush_ruleset_request {url}` → `ctx:flush(url)`, then `wrangler ruleset_flushed {url, rid, changed}`. Today wrangler offers only `rulesets_need_flushing` (all installed rulesets) and `install_ruleset_request` (flush + reinstall); app rulesets must not call `ctx:flush` directly. Also the flush-only step S11 needs |

### Proposed KRL syntax: doc annotations

Discovery metadata lives **next to the code it describes**, as structured `/** … */` doc comments immediately preceding a **rule** or a **shared function**. Most of the schema is **derived** by the compiler from code that already exists — the `select when` expression, `event:attr` reads, function parameters and defaults. The author writes only what derivation can't know: descriptions, types, required/optional where a default doesn't say, and the completion event.

**Opt-in by design.** Annotations are not required on anything. The ruleset author annotates the rules and functions they deem worth discovering. **Unannotated rules and functions are invisible to discovery — including the Testing tab.** Annotation governs what is *advertised*, not what is *permitted*: `shares` still decides what is queryable and channel policy still decides who may send or query. A shared function without an annotation still works; it just isn't listed.

```krl
ruleset io.picolabs.manifold_pico {
  meta {
    name "Manifold"
    description "Creates and tracks thing and community picos for one owner."
    shares findThings, canCreateThing
  }

  global {
    /** Things this Manifold pico has created whose name matches `name`, keyed by pico id.
     *  @param name String "name or name prefix to match"
     *  @param exact Boolean "match the whole name rather than a prefix"
     *  @returns Map */
    findThings = function(name, exact = false) {
      ent:things.defaultsTo({}).filter(function(t) {
        exact => t{"name"} == name | t{"name"}.match(("^" + name).as("RegExp"))
      })
    }

    /** True when Manifold is below its max_picos child limit.
     *  @returns Boolean */
    canCreateThing = function() { wrangler:children().length() < max_picos }
  }

  /**
   * Create a thing pico as a child of Manifold and subscribe it as a manifold_thing.
   * Only fires while Manifold has fewer than max_picos children. Completion is not in the
   * response: when the thing is fully initialized, community:thing_created is sent to
   * callback_eci with the caller's rcn.
   * @attr name String "display name of the new thing"
   * @attr callback_eci String optional "channel to receive community:thing_created"
   * @attr rcn String optional "caller's correlation id, echoed in the callback"
   */
  rule create_thing {
    select when manifold create_thing
    …
  }

  // Internal cascade step: no annotation, so not discoverable.
  rule install_thing_ruleset {
    select when wrangler child_initialized where event:attr("event_name") == "manifold_create_thing"
    …
  }
}
```

#### Tags

Free text before the first tag is the **description**. Tags:

| Tag        | On       | Form                                           | Notes                                                                                                          |
| ---------- | -------- | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@attr`    | rule     | `@attr NAME [TYPE] [optional] ["description"]` | Required by default. Attrs the rule reads but doesn't annotate are still listed (name only) An annotation's required/optional always wins over what the select implies |
| `@param`   | function | `@param NAME [TYPE] ["description"]`           | Optional iff the parameter has a default (`since = null`); no `optional` keyword needed                        |
| `@returns` | function | `@returns TYPE ["description"]`                |                                                                                                                |
| `@example` | rule, function | `@example "NAME" { JSON }` | A named preset: for a rule, a map of attrs; for a function, a map of args. Repeatable. See [Examples](#examples) |

Types: `String`, `Number`, `Boolean`, `Map`, `Array`, `Any` (default).

**Defaults are expressions, not values.** Optionality and defaults for `@param` come from the function signature, which has three cases:

| Signature | Discovery output |
|-----------|------------------|
| Literal: `exact = false`, `unit = "C"` | Optional; `"default": false` emitted as a value (JSON Schema `default`; Testing tab prefills it) |
| `null`: `since = null` | Optional; no `default` emitted |
| Computed: `since = time:now()`, `n = ent:limit` | Optional; `"defaultExpr": "time:now()"` as source text, never as a value |

**Annotations don't change behavior.** `@attr` and `@param` types and required/optional are **descriptive**: they feed discovery, JSON Schema for generated tools, and Testing tab form fields. The engine neither validates event attrs (the selector and condition already decide whether a rule runs) nor converts query args. Query args sent as a **JSON body** keep their types; args in a **GET query string** arrive as strings (`?exact=true` → `"true"`, which is truthy even as `"false"`), and functions meant to be called by URL should cast with `.as()` as KRL always has. Generated clients (MCP server, Testing tab) always send JSON bodies. Behavior-changing checks can be added later if experience shows they'd help.

#### Examples

An attribute table says which attrs exist; it doesn't say **which go together** for common cases. `createRxBus` has nine optional attrs, but the common case needs only `wellKnown_Tx`, and `Tx_host` matters only across engines. The `__testing` global recorded this informally by listing the same event several times with different attr sets, each rendered as its own Testing tab form. `@example` keeps that information now that `__testing` is gone:

```krl
  /**
   * Request a relationship with another pico. …
   * @attr wellKnown_Tx String optional "…"
   * …
   * @example "same engine" { "wellKnown_Tx": "<eci>" }
   * @example "same engine, with roles" { "wellKnown_Tx": "<eci>", "name": "<name>", "Rx_role": "<role>", "Tx_role": "<role>" }
   * @example "another engine" { "wellKnown_Tx": "<eci>", "Tx_host": "https://other.example" }
   * @example "auto-accept password" { "wellKnown_Tx": "<eci>", "password": "<password>" }
   * @example "Layer 2" { "layer2": true, "target_did": "<did>" }
   */
  rule createRxBus {
```

| Point | Rule |
|-------|------|
| Format | A quoted name, then a JSON map on the same line. Multi-line examples can come later if needed |
| Placeholders | Strings like `"<eci>"` are allowed. The Testing tab shows them for the developer to replace; MCP and reference pages show them as-is |
| Functions | Same tag; the map is the arguments: `@example "by role" { "key": "Tx_role", "value": "manifold_thing" }` |
| Checks | Malformed JSON is a compile error (strict tag parsing). A key that isn't an annotated or derived attr (or a parameter, for a function) is a **warning**, which catches drift between examples and code |
| Output | `examples: [ { name, attrs } ]` on the operation (`{ name, args }` on a query) in the ruleset schema, carried into the pico schema |
| Consumers | Testing tab: one pre-filled form per example. Reference pages: listed under the attribute table. MCP: tool `examples` |

Examples are optional, like everything else in an annotation. They are worth adding where an operation has several attrs that are only needed in some cases.

That is the whole tag set. Anything the code already says — the select expression, the condition, what the rule raises or sends — is **derived**, not annotated, because restating it next to the rule only creates a second copy that drifts.

**Writing the description.** The description is where the author says what the code *can't*: the conditions that matter most to a caller (in plain words, not a restatement of the condition), and **cascade outcomes** — what eventually happens and which event signals completion, even when a different rule or ruleset raises it. Derived data covers the rule itself; the description covers the story. Guidance for authors:

- Lead with what the operation does for the caller, in one sentence.
- Name the precondition a caller is most likely to trip over ("only while fewer than max_picos children").
- If completion is asynchronous, name the event that signals it and where it is sent.
- Don't restate attrs or the select expression; discovery already shows them.

**Annotating gradually.** The intended workflow is lazy on purpose. A one-line description is a complete annotation: it makes the rule or function discoverable and visible in the Testing tab, and derivation fills in the rest. Add tags only where derivation falls short.

| Step | Write | You get |
|------|-------|---------|
| 1. Make it visible | `/** Rename a thing. */` | The operation in the Testing tab and discovery; attrs from the select and from `event:attr` reads; function params, required/optional, and literal defaults from the signature. Types are `Any` |
| 2. Fill the gaps | `@attr` / `@param` for what derivation can't see | Attrs that are **forwarded** (`event:attrs` passed on and read by a later rule, e.g. `callback_eci`/`rcn` on `create_thing`); attrs read under a **computed name** (`event:attr(someVar)`); attrs read in the body that are actually **required** (derived ones are optional) |
| 3. Polish for callers | Types and per-field descriptions | Typed form fields in the Testing tab; precise JSON Schema and tool descriptions for MCP, where the model chooses tools by description |

Derived attrs that appear only in `event:attr` reads are listed by name, type `Any`, **optional** — the code doesn't say whether they are required. Attrs constrained by the select (`re#…#`, `where … == "lit"`) are required. Step 1 is enough for a developer's own Testing tab; step 3 matters most for rulesets meant to be called by agents and integrators.

**Which comments are annotations.** A `/** … */` comment is an annotation only when it **immediately precedes a rule or a shared function** (a global function named in `shares`, including an alias such as `establishRelationship = establishSubscription`, which gets its own entry with its own description and the aliased function's parameters). Everywhere else — before an unshared helper, a variable, inside a rule — it is an ordinary comment, with no warning. `/* … */` and `//` never mean anything. This keeps the JSDoc form agents already write, and leaves existing rulesets that use `/**` out of habit unchanged: `/* */` is the ordinary KRL block comment, so a `/**` on a helper is almost always muscle memory. An existing `/**` that does precede a rule or shared function becomes an annotation — its text becomes the description, which is harmless and usually what the author meant. Rulesets where that's wrong are fixed as we find them (as with `io.picolabs.manifold_pico`).

**Strict parsing.** Within an annotation, a **tag** is `@word` at the **start of a comment line** (after optional whitespace and `*`). A **recognized** tag (`@attr`, `@param`, `@returns`, `@example`) with invalid content (missing name, bad JSON in `@example`, unknown type in `@returns`) is a **compile error**. An **unrecognized** tag name (e.g. `@deprecated`, a misspelled `@atr`) is **ignored** and the compiler **warns** — it does not affect schema output. `@` anywhere else in a line — an email address, `@handle` in prose — is just description text.

**Parser work:** the tokenizer already emits `BLOCK-COMMENT`; `tdop.ts` currently skips it. Retain a leading `/**` token and attach it to the next `Rule` or global `Declaration` node as `doc`; the **compiler** keeps it only for rules and for declarations named in `meta.shares`, and drops it (no warning) otherwise, since `shares` is known from `meta` before `global` is compiled; parse tags in a small dedicated parser so errors carry line/column inside the comment.

#### What discovery derives from the `select when`

The event expression is already the most precise statement of what a rule responds to, so discovery **uses it rather than repeating it**. The compiler walks the expression AST and emits structured entry points:

| Select construct | Derived for discovery |
|------------------|-----------------------|
| `select when D T` | One entry point: event `D:T` |
| `… where event:attr("x") == "lit"` | Constraint `x = "lit"` (JSON Schema `const`); attr `x` required |
| `… where <other expr>` | Constraint carried as **source text** (shown to humans/agents; not enforced by generators) |
| `D T x re#pat# setting(v)` | Attr `x` required, constrained to `pattern` |
| `e1 or e2` | **Two** entry points, same rule — each a separate way in |
| `e1 and e2`, `e1 before e2`, `then`, `after`, `between`, `any N`, `count`, `repeat`, `within …` | **Sequence**: listed with its full expression text and component events; marked *not a single call* |

**What the rule emits** is derived the same way, scoped to the annotated rule only. A rule can emit many events, they can mean different things, and most are conditional, so `emits` is a **list**, and each entry records **what kind of effect it is** and **every condition it sits under**.

Three kinds, which mean different things to a caller:

| `via` | Code | Goes to | Meaning for a caller |
|-------|------|---------|----------------------|
| `raise` | `raise D event T [for rid]` in the postlude | This pico's own event bus | Internal. A caller sees its effect only through other rules that select it |
| `send` | `event:send({ eci, domain, type, … })` in the action block, directly or inside a `defaction` defined in this ruleset | Another pico (or a channel on this one) | Outbound. `target` is the ECI expression as source text; when it comes from an event attr (e.g. `event:attr("callback_eci")`, or an entity value stored from one), discovery marks it **`replyTo: "<attr>"`** — the caller will receive this event on the channel it supplied |
| `schedule` | `schedule D event T at … / repeat …` | This pico's own bus, later | Internal and deferred |

**`emits` lists possibilities, not promises.** A single rule may conditionally send several events from its action block, raise several in each arm of `fired { } else { }`, guard some of those with `if`, and schedule others. Which of them actually happen on a given event depends on the condition, the arm taken, the guards, and the pico's state at that moment; none of that is knowable statically. Derivation records each *possible* effect and the conditions it sits under; it never claims an effect will occur. Consumers must treat the list that way: a generated tool description may say "may send `community:thing_created` to `callback_eci`", never "sends". What *did* happen on a particular event is a runtime fact, reported by rule outcome reporting.

Each entry's **`when`** is the path of conditions from the outside in, every one as source text. It records structure, not prediction: entries whose paths end in `fired` and `else` are mutually exclusive, and entries under `sample` are alternatives, but whether a given path is taken is decided at run time:

| Condition | Comes from | Example `when` element |
|-----------|------------|------------------------|
| Rule condition | `if <expr> then` on the action block | `{ "condition": "child_eci && absoluteURL" }` |
| Action block type | `every` (all), `sample` (one at random), `choose <expr> { key => … }` | `{ "choose": "event:attr(\"kind\")", "key": "sms" }`, `{ "sample": true }` |
| Postlude branch | `fired`, `else`, `notfired`, `always`, `finally` | `{ "branch": "fired" }` |
| Statement guard | `raise … if <expr>` / `schedule … if <expr>` | `{ "if": "needWrapper" }` |
| Loop | `foreach <expr> setting(v)`; `on final` | `{ "foreach": "initializationRids" }`, `{ "onFinal": true }` |

Example: Manifold's `fireThingCreatedCallback` derives to

```json
"emits": [
  { "via": "send", "domain": "community", "type": "thing_created",
    "target": "cb{\"callback_eci\"}", "replyTo": "callback_eci",
    "when": [ { "condition": "cb" }, { "every": true } ] },
  { "via": "send", "domain": "community", "type": "thing_completed",
    "target": "cb{\"callback_eci\"}", "replyTo": "callback_eci",
    "when": [ { "condition": "cb" }, { "every": true } ] }
]
```

Limits of derivation, stated rather than guessed:

| Case | Derived as |
|------|------------|
| Domain or type computed, not literal (`raise event ev_type`, `event:send(msg)` with `msg` built elsewhere) | Entry with the expression as source text; `domain`/`type` null |
| Send inside a **module** action (`use module … alias m`, then `m:doThing()`) | `{ "via": "action", "name": "m:doThing" }` — opaque; the module's own schema describes it |
| `replyTo` through entity state (`ent:pending_callbacks{id}{"callback_eci"}`) | Detected only when the stored value is written from an event attr in the same ruleset; otherwise `target` source text only |

Cascade effects in *other* rules are deliberately not followed: they depend on state and on other rulesets, so they belong in the description.

This is what solves "one event, several operations": Manifold's `child_initialized where event_name == "manifold_create_thing"` and `… == "manifold_new_community"` become two distinct entry points with different `const` constraints, without the author writing anything. Generators (MCP tools, discovery bindings) expose **single-event entry points only**; sequences appear in discovery and the Testing tab with their expression, but are never turned into one tool call.

#### Events are not operations

Rules have functionality; events do not. A given event may or may not have an effect depending on the full event expression, the rule's condition, and the pico's state. `install_thing_ruleset` selects `wrangler child_initialized` only `where event_name == "manifold_create_thing"`, acts only if `child_eci && absoluteURL`, and its effect depends on where the pico is in the create-thing cascade.

| Layer | What it is | Source | What it can promise |
|-------|------------|--------|---------------------|
| **Event** | A message shape | Derived | Only that the attrs are well-formed |
| **Rule** | Event expression × condition × state → effects | Code | Which rules *could* fire — never whether they *will* |
| **Operation** | An annotated rule: the contract the author offers | Annotation + derived select | What the author promises in words; prechecks and emits derived from the code |

Annotating the **rule** (not the event) makes the operation and its entry point the same thing. For an annotated rule, discovery includes the rule's **condition** as source text, so an agent or developer can see what gates it. Neither preconditions nor synchronous directives are annotated: a condition can be arbitrarily complex, and restating it next to the rule only creates a second copy that drifts. Instead, state-dependence is handled two derived ways:

- **Prechecks from the condition.** If the condition calls shared functions (`if canCreateThing() then …`), the compiler lists them as `prechecks`. An author who wants a checkable precondition writes the condition that way; the check *is* the code.

  **`condition` vs `prechecks`.** `condition` is the whole gate as source text, for reading: a person or agent sees what must be true. `prechecks` is the part a caller can **act on in advance** — the functions in the condition it can query itself before sending the event. It is a subset of the condition, filtered to what is callable from outside, and to calls that are themselves **true/false terms** of the condition: a top-level `&&` term, possibly negated (`if canCreateThing() && …`, `if not isFull() then …`). A shared function used as a *value* inside a comparison is not a precheck — in `createRxBus`, `wellKnown_Rx(){"id"}` is compared against an attr, and querying it in advance tells the caller nothing about whether the rule will act.

  | Function called in the condition | Listed in `prechecks`? |
  |----------------------------------|------------------------|
  | Used as a value (inside a comparison, an argument, a path) rather than as a true/false term | **No.** It remains visible in `condition` |
  | Shared, every arg traceable to an event attr (directly or through a `pre` binding) | Yes, with the arg → attr mapping: `{ "fn": "isAThing", "args": { "picoID": { "attr": "picoID" } } }` |
  | Shared, some arg not traceable (e.g. computed from entity state) | Yes, with the call as source text: `{ "fn": "isAThing", "call": "isAThing(picoID)" }` |
  | **Not shared** | **No.** A caller would get a policy error querying it. It remains visible in `condition` |
  | No function calls | `prechecks` is empty |

  Example: Manifold's `updateThingLocation` has `condition: "picoID && isAThing(picoID)"`, but `isAThing` is not in `shares`, so its `prechecks` is `[]`. If `isAThing` were shared, `picoID` is bound in `pre` from `event:attr("picoID")`, so the entry would carry the mapping `{ "picoID": { "attr": "picoID" } }`. If prechecks prove rare in practice, `condition` alone does most of the job and the field can be dropped later.

  **Reading them together.** An empty `prechecks` does **not** mean the rule is ungated — only that nothing in the gate can be checked before runtime; whether there *is* a gate is told by `condition` (absent → the rule acts whenever selected). Likewise a non-empty `prechecks` covers only part of the gate unless the condition consists solely of those calls. Whatever cannot be checked in advance is answered after the fact by rule outcome reporting.
- **Outcome reporting after the fact.** The engine already knows which rules an event selected and which fired. The event response reports, for each annotated rule, *selected → fired* or *selected → did not fire (condition false)*. This can't drift, has no check-then-send race, and turns silence into an answer (see 1.8 release plan, "Rule outcome reporting"). For an annotated rule whose entry event (domain and type) arrived but whose selector didn't match — an attr failed its `re#…#` pattern or a `where` was false — it reports *not selected* with the select text, so the one case where the rule never appears is covered too. Event attrs are **not** validated against `@attr`: the selector and condition already decide whether a rule runs.

#### Compiler output

Embedded on the ruleset module (replaces `__testing1`). Only annotated rules and functions appear:

```json
{
  "version": 1,
  "rid": "io.picolabs.manifold_pico",
  "rid_version": "draft",
  "description": "Creates and tracks thing and community picos for one owner.",
  "operations": [
    {
      "rule": "create_thing",
      "description": "Create a thing pico as a child of Manifold … not in the response.",
      "entry": [
        { "domain": "manifold", "name": "create_thing", "constraints": [] }
      ],
      "select": "manifold create_thing",
      "condition": "event:attr(\"name\") && canCreateThing()",
      "prechecks": [ { "fn": "canCreateThing", "args": {} } ],
      "attrs": [
        { "name": "name", "type": "String", "required": true, "description": "display name of the new thing" },
        { "name": "callback_eci", "type": "String", "required": false, "description": "channel to receive community:thing_created" },
        { "name": "rcn", "type": "String", "required": false, "description": "caller's correlation id, echoed in the callback" }
      ],
      "emits": [
        { "via": "raise", "domain": "wrangler", "type": "new_child_request",
          "when": [ { "condition": "event:attr(\"name\") && canCreateThing()" }, { "branch": "fired" } ] }
      ],
      "alsoSelectedBy": []
    }
  ],
  "queries": [
    {
      "name": "findThings",
      "description": "Things this Manifold pico has created whose name matches `name`, keyed by pico id.",
      "args": [
        { "name": "name", "type": "String", "required": true, "description": "name or name prefix to match" },
        { "name": "exact", "type": "Boolean", "required": false, "default": false, "description": "match the whole name rather than a prefix" }
      ],
      "returns": "Map"
    },
    { "name": "canCreateThing", "description": "True when Manifold is below its max_picos child limit.", "args": [], "returns": "Boolean" }
  ]
}
```

**`alsoSelectedBy`** lists the other rules **in the same ruleset** that select the same entry event, each with its `select` and `condition` as source text. One logical operation is often split across rules — Manifold's `remove_thing` is handled by `removeThingSubscription` (annotated), `removeThingOrphan`, and `removeThingOrphanChild`. The author annotates one; discovery still shows every rule that will see the event, so the gating picture is complete without annotating the rest. Rules in other rulesets are not listed (their order relative to this one is undefined).

**Engine on install:** read compiled discovery JSON for the installed URL/RID → merge into the pico-level aggregate. Two rulesets annotating rules on the same event remain separate operations in ruleset schema (keyed by `rid:rule`); the pico schema groups by entry event.

#### Compiler checks

| Check | Action |
|-------|--------|
| Malformed **recognized** tag (e.g. `@attr` without a name, invalid `@example` JSON) | **Error** |
| Unrecognized tag name (not attr, param, returns, example) | **Warn** (ignored) |
| `@attr x` that the rule never reads (`event:attr`, `setting`, select capture) | **Warn**, unless the rule forwards `event:attrs` (raise or send with `event:attrs`): attrs are often consumed by a later rule in the cascade (e.g. Manifold `createThing` forwards `callback_eci`/`rcn` to `stashThingCallback`) |
| `@param x` not in the function's parameter list | **Error** |
| Annotated global function not in `meta.shares` or `meta.provides` | **Warn** — it will not appear in `rulesetSchema` queries or be queryable/exported |
| `@example` JSON map invalid | **Error** (parse time) |
| `@example` key not an attr (rule) or parameter (function) | **Warn** |

Unannotated rules and functions produce **no** warnings. Annotation is the author's choice.

#### `shares` and `provides`

Unchanged. `shares` decides queryability, `provides` decides module exports, annotations decide discoverability. No deprecation and no migration of existing rulesets.

#### Discovery alignment

Replace hand-written `bindings()` maps with:

```krl
bindings = function() {
  wrangler:schemaBindings(meta:rid)
}
```

`schemaBindings(rid)` returns the annotated operations and queries; `channelSchema(caller_eci)` intersects them with the caller's channel policy. Single source of truth: the annotations plus the code; single authorization gate: channel policy.

#### Alternatives considered: `meta.schema`

An earlier draft declared events and queries in a `schema { events { … } queries { … } }` block in `meta`. Rejected because (a) it is a second copy of every event and function, far from the code, and will drift; (b) it describes events, but functionality lives in rules, so it needed an extra "operation" concept and an attr-discriminator syntax to say what the `select when` already says; (c) it had to subsume `shares`, forcing a deprecation. Annotations on rules and functions avoid all three.

#### Deprecation timeline for `__testing`

| Release | Behavior |
|---------|----------|
| **N** | Annotations parsed; pico schema API live; `__testing` = compiled discovery slice (compat), falling back to the legacy extract for RIDs with no annotations |
| **N+1** | Manual global `__testing` → compile warning |
| **N+2** | Remove `__testing1` injection; remove `__testing` query unless legacy RS flag |

#### Wrangler migration

Replace ~30-line hand `__testing` global in `io.picolabs.wrangler.krl` with `/** */` annotations on the rules and shared functions worth discovering. One-time port; stays in sync because it sits on the code.

---

## UI / integrator backlog

| ID | Item |
|----|------|
| **U1** | Testing tab: per-RID view from `rulesetSchema(rid)` showing operations with `select`, `condition`, `alsoSelectedBy`, `emits`; read-only pico surface from `picoSchema()` on **About** (not Testing) |
| **U2** | Typed form fields from schema (number, boolean, JSON) |
| **U3** | Show which RIDs contribute each event/query |
| **U4** | HA / MCP generator consumes `picoSchema()` (never ruleset schemas directly) or its JSON Schema export |
| **U5** | Channel policy editor shows which allowed events are annotated operations (informational only: unannotated events are legitimate, just not discoverable) |
| **U6** | **Docs view (done in UI).** **Docs** next to each installed RID on the Rulesets tab opens a modal reference from live `rulesetSchema(rid)`; layout/wording matches `krl-schema --format markdown` ("Acts when", "May emit (possible, not guaranteed)", "Other rules on the same event"). Unannotated rulesets explain opt-in and link to `/docs/#/krl/discovery` |
| **U7** | **Try it (done in UI).** Docs is reference-only: **Try it** / **Try in Testing** links open the Testing tab (`?rid=&rule|query=&example=`) with shared `SchemaFormField`, `SchemaEventTryForm`, `SchemaQueryTryForm` |
| **U8** | **Docs site.** Generate a Markdown reference page per bundled ruleset into `packages/pico-engine/public/docs/` (rendered by the existing docsify site) and into `llms-full.txt`; a CI check regenerates them and fails on a diff |
| **U9** | **Testing tab history and saved requests** (1.8; see [live-pico-ui.md](./live-pico-ui.md)). Stored in the pico (`io.picolabs.pico-engine-ui` entity, keyed by rid), with each entry's outcome from rule outcome reporting. Promotion path: history → saved request (this pico) → `@example` (the ruleset source, for everyone; and with doctests, a regression check) |

---

## Relationships to other work

| Work | Link |
|------|------|
| **Discovery bindings** | Channel schema = filtered view; bindings generated from annotations via `schemaBindings` |
| **Pico mirrors / replay** | ROADMAP §1 logging flags live on schema entries (`logged`, `replaySafe`) |
| **LLM per pico** | `llm:context()` includes pico schema; NL→event uses schema for extract validation |
| **Channel policy fix** | Independent of the schema: policy authorizes, annotations advertise. A channel may allow unannotated events (they are legitimate, just not discoverable); `channelSchema(eci)` shows only the annotated subset a channel allows |

---

## Open questions

1. **Engine store vs recompute on read?** — *resolve during P2.* **Wrangler entity ruled out.** Each installed ruleset's compiled schema lives in the ruleset cache (keyed by URL); the engine either **materializes** a pico-level aggregate on install/uninstall or **recomputes** from installed RIDs + cache on each read. Materialize if merge cost matters; recompute if simplicity wins. Either way, merge logic stays in the engine.
2. **Dynamic schemas?** — *deferred past 1.8.* Rulesets that register events at runtime (e.g. PDS keys). Annotations are static by design; nothing in 1.8 needs this.
3. ~~Versioning~~ — resolved: the ruleset cache already stores a KRL `hash` per URL; it is the ruleset schema's version. The pico schema changes on every merge, and `wrangler schema_updated` (S8) is the invalidation signal. No separate version scheme.
4. **Cross-pico schema** — *deferred past 1.8.* Expose a remote pico's schema over a relationship; naturally `channelSchema` over the relationship's channel, once `channelSchema` exists.
5. ~~`@returns` required?~~ — resolved: optional, default `Any`. A one-line description is a complete annotation.
6. ~~Event syntax~~ — resolved: event identity comes from `select when`; emitted events are derived from the rule.
7. ~~Strict validation default~~ — resolved: no event-attr validation (S4 dropped). The selector and condition gate rules; outcome reporting explains why one didn't run. `@attr` `required` is descriptive, for discovery and generated tool schemas.
8. ~~`@guard` semantics~~ — resolved: no `@guard` tag. Prechecks are derived from shared functions called in the rule condition; outcomes are reported in the event response.
9. ~~Operation granularity~~ — resolved: annotate the rule; `where event:attr("x") == "lit"` in the select becomes a derived `const` constraint, so each rule is its own entry point.
10. ~~Description syntax~~ — resolved: free text before the first tag in the `/** */`.
11. ~~Testing tab during migration~~ — resolved: no legacy fallback and no interim work. The bundled rulesets (wrangler, PDS, discovery, OAuth, portable_subtree) and the Manifold set are annotated as part of 1.8; a one-line description per discoverable rule or function is enough to restore the Testing tab.
12. **Sequence entry points** — *deferred past 1.8.* Testing tab helper to send each component of a `before` / `then` / `within` rule in order; sequences are already listed with their expressions.
13. ~~`/**` already used as an ordinary comment~~ — resolved: option (b). `/**` is an annotation only immediately before a rule or a shared function; elsewhere it is an ordinary comment, with no warning. Tags are `@word` at the start of a comment line. Existing rulesets are fixed as found.

---

## Known gaps (P2)

Found by annotating the bundled rulesets and `io.picolabs.manifold_pico`, and by rendering their reference pages with `krl-schema --format markdown` (October 2026). Items below were gaps between this design and the first P2 pass; **fixed in the compiler/parser** unless noted. Gaps in the schema change event are listed under [Schema change event](#schema-change-event).

**Derivation** — addressed in `krl-compiler` (`deriveSchema.js`, `deriveEmits.js`, `rulesetSchema.js`):

| Topic | Status |
|-------|--------|
| `alsoSelectedBy` empty for `or` selects / missing unannotated siblings | **Fixed:** index every active rule per derived entry point (each `or` alternative is its own key); peers include rules without `/**` (e.g. subscription `createRxBus*` family) |
| Select `re#…#` not in `constraints` | **Fixed:** `{ attr, op: "pattern", pattern }` on each entry point |
| Prechecks from shared calls used as values | **Fixed:** only shared calls at the root of each `&&` / `\|\|` condition term |
| Ruleset `description` line breaks from `<< >>` | **Fixed:** chevron text keeps newlines (trim per line, collapse spaces only) |
| Select pattern overriding `@attr … optional` | **Fixed:** `@attr` required/optional wins; select pattern applies only when there is no `@attr` for that name |
| Function params without defaults always required | **Author fix:** add KRL defaults (e.g. `function(key = null, value = null)`); derivation is correct |

**Annotation lint** — **fixed** in `derivedAttrNamesFromRule` + lint: `event:attrs{"x"}` (map is a `DomainIdentifier`, not an `Application`), whole-map `event:attrs` on `raise`/`schedule` (`event_attrs` field), read/forward/assign, `foreach(…)` expressions, attrs read inside globals the rule calls, and attrs read only in an **`alsoSelectedBy` sibling** (same entry point family).

**Parser and API**

| Topic | Status |
|-------|--------|
| `/**` on unshared globals | **Fixed:** parser attaches `doc` only for names in `meta.shares` / `meta.provides` |
| Shared **alias** annotations | **Fixed:** resolve alias to target function for query schema |
| `rulesetSchema()` without rid | **Fixed:** `ctx:rulesetSchema()` returns a map keyed by installed rid (S2) |

**Tooling note (unchanged).** Rewriting KRL files programmatically can silently change line endings: `io.picolabs.wrangler.krl` is CRLF. Generators and annotation tools must preserve the file's existing line endings.

## Implementation touchpoints

| Layer | Package / file | Change |
|-------|----------------|--------|
| **Parser** | `packages/krl-parser/src/tdop.ts`, `types.ts` | Retain `/**` `BLOCK-COMMENT`; attach `doc` to rule / shared function |
| **Compiler** | `packages/krl-compiler/src/c/Ruleset.js` | Emit ruleset schema JSON on module; retire `__testing1` (phased) |
| **Compiler lint** | `packages/krl-compiler/src/compile.js` | `eventScope` + annotation tag lint |
| **Engine** | `packages/pico-engine-core` / `pico-engine` `ctx` | Merge on **every** install path (`ctx:install`, default/bundled installs, portable import); `picoSchema`, `rulesetSchema`, `channelSchema`, `schemaBindings`; engine-owned event when installed rulesets change (S8); Sky queries |
| **Wrangler** | `packages/pico-engine/krl/io.picolabs.wrangler.krl` | Delegate queries; select engine install event → `wrangler:schema_updated`; port hand `__testing` → `/** */` annotations |
| **UI** | `packages/pico-engine-ui/.../Testing.tsx` | `rulesetSchema(rid)`; optional pico panel via `picoSchema()` |
| **Tests** | parser, compiler, engine install/merge, wrangler delegate | Parse + compile + merge/conflicts + policy ∩ schema |

---

## Phasing

| Phase | Deliverable |
|-------|-------------|
| **P0** | **Sign off annotation tags** (this doc) + parser attach-doc-to-node |
| **P1** | Compiler: schema JSON on RS module; author-time lint vs shares/rules |
| **P2** | Engine: merge on install/uninstall; **`ctx:picoSchema()`**, **`rulesetSchema`**, **`channelSchema`**, **`schemaBindings`**; wrangler delegates + **`schema_updated`** |
| **P3** | **Done (1.8).** Testing tab, Docs UI, history/saved, About `picoSchema()` — see [`pico-schemas-1.8.md`](pico-schemas-1.8.md) |
| **P4** | **Deferred.** `logged` / `replaySafe`; JSON Schema export |
| **P5** | **Done (1.8)** platform RS annotations; **`__testing` injection removal → 1.9** |

---

## References

- Compiler: `packages/krl-compiler/src/c/Ruleset.js`, `compile.js` (`getTestingJSON`)
- UI: `packages/pico-engine-ui/src/components/PicoTabs/Testing.tsx`
- Wrangler manual schema: `packages/pico-engine/krl/io.picolabs.wrangler.krl` (`__testing` global)
- Discovery: `test-rulesets/io.picolabs.discovery_test.krl`, `filterBindingsForCaller`
- ROADMAP: `MEMORY.md` §1 (event schema + logging)
