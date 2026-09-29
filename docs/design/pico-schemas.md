# Pico schemas (events, queries, attributes)

**Status:** explore / TODO (2026-09-18) · **Target release: 1.8** (with channel policy fix)

## Summary

Each pico exposes a **surface** of events and queries determined by its **installed rulesets**.
Integrators, the Testing tab, mirrors, LLM tools, and validation need a reliable **pico-level
schema** — aggregated at the pico boundary, typed, and programmatically queryable.

### Design decision (2026-09-18)

**Extend KRL with a declarative `schema` block inside `meta`.** Do **not** extend the `__testing`
global or compiler-injected `__testing1` JSON — that path was a **kludge** (hidden global, heuristic
attrs, manual wrangler maintenance, drift).

| Canonical | Role |
|-----------|------|
| **`meta.schema { events { … } queries { … } }`** | Authoritative per-ruleset declaration (parser + compiler) |
| **Wrangler `picoSchema()`** | Merged pico-level registry on install/uninstall |
| **`public` markers + `wrangler:schemaBindings(rid)`** | Discovery integrator subset — generated from meta, not hand-written |
| **Compiler `eventScope` extract** | Lint only (“undeclared select when”, “missing schema entry”) |
| **`__testing` global / query** | **Deprecated** — compat alias, then removed |

**Today:** The Testing tab calls `GET /c/{eci}/query/{rid}/__testing` per ruleset. That is useful
but **imperfect** and **not a pico schema**. See [What exists today](#what-exists-today).

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

Filtered by `wrangler:filterBindingsForCaller(bindings, caller_eci, rid)` for least-privilege
exposure to a **specific channel** — not the full pico surface.

**Limits:**

- Opt-in per app ruleset; not automatic for wrangler/PDS/platform RSs.
- No arg/attr **types**; `publicTo` / relationship filtering is separate from schema registry.
- Discovery answers “what can **this caller** do?” not “what is **this pico**?”.

### 4. ROADMAP §1 (MEMORY.md)

Deferred work: pico-level schema at the boundary, validation, logging/replay flags. **Mechanism
chosen:** `meta.schema` + wrangler registry (this doc). Covers **events and queries**.

---

## Target: pico schema

A **pico schema** is the aggregated, deduplicated description of the pico's **external surface**
given current installs:

```
picoSchema(picoId) → {
  version: 1,
  rulesets: [ { rid, version?, contributed: { events, queries } } ],
  events: [ { domain, name, attrs: [ { name, type?, required?, description? } ], sources: [rid] } ],
  queries: [ { rid, name, args: [ { name, type?, required?, default? } ], returns?, sources: [rid] } ],
  notifications?: [ ... ]   // optional: outbound subscription interest
}
```

**Unit of record:** the **pico boundary** (like channel policy), because multiple rulesets react to
one raised event.

**Layers:**

| Layer | Audience | Contents |
|-------|----------|----------|
| **Full schema** | Owner, Testing tab, mirrors, LLM context | All registered events/queries |
| **Public schema** | Discovery, OAuth-scoped integrators | Filtered by caller ECI / relationship (today: `filterBindingsForCaller`) |
| **Channel schema** | Webhook/posting | Intersection of pico schema + channel event policy |

---

## Why `meta.schema` (not `__testing`)

The `__testing` mechanism was a compile-time workaround:

- Schema lived in a **global variable** shadowing compiler output, not in `meta` with `shares`.
- Event attrs were **inferred** from rule bodies (`event:attr`), not declared.
- Wrangler and legacy RSs **hand-maintained** large JSON maps that drift from actual rules.
- Testing tab and discovery had **no shared source of truth** with bindings.

Putting schema in **`meta`** matches how KRL already declares the public contract (`shares`,
`provides`, `use module`). The compiler validates schema against shares and rules; wrangler merges
compiled JSON into the pico registry; discovery reads `public` entries via `schemaBindings`.

**Migration:** compiler emits normalized schema JSON from `meta.schema`; `__testing` query becomes a
thin alias (one release) then removed; wrangler replaces its hand-maintained `__testing` global with
`meta.schema`.

---

## Registration sources (priority)

| ID | Source | When | Trust |
|----|--------|------|-------|
| **R1** | **`meta.schema`** | Compile / flush | **Authoritative** |
| **R2** | **Compiler extract** | Compile | Lint / “did you forget to declare?” warnings only |
| **R3** | **Manual `__testing` global** | Compile | **Deprecated** — warn on flush |
| **R4** | **`bindings()` function** | Runtime | Generated from schema `public` markers, or linted against R1 |
| **R5** | **Engine install hook** | RS install/uninstall | Wrangler merges into pico schema store |
| **R6** | **Observed traffic** (optional) | Runtime | Debug overlay only |

**Goal:** R1 + R5 as canonical; Testing tab and integrators read **pico schema API**.

---

## KRL / programmatic API (backlog)

| ID | Item | Shape |
|----|------|--------|
| **S1** | **Pico schema query** | `wrangler:picoSchema()` or `GET /c/{eci}/query/io.picolabs.wrangler/picoSchema` |
| **S2** | **Schema for one RID** | `wrangler:rulesetSchema(rid)` — contribution slice |
| **S3** | **Public schema for caller** | `wrangler:publicSchema(caller_eci)` — discovery-aligned filter |
| **S4** | **Validate event attrs** | Engine optional strict mode before dispatch |
| **S5** | **Validate query args** | Engine rejects unknown args / type mismatch (soft warn first) |
| **S6** | **Register on install** | Wrangler hook merges RS meta into store |
| **S7** | **Unregister on uninstall** | Remove RID contribution; recompute |
| **S8** | **Schema change event** | `wrangler:schema_updated` with diff summary — rules/integrators react |
| **S9** | **Conflict detection** | Same `domain:name`, incompatible attr defs across RIDs → warn |
| **S10** | **JSON Schema export** | `picoSchemaAsJsonSchema()` for OpenAPI/MCP/HA generators |

### Proposed KRL syntax: `meta.schema`

New **`schema`** key in `rulesetMetaProperty` (parser + AST + compiler). Nested blocks for
**events**, **queries**, and optional **notifications**. Event names use the same **domain type**
pair as `select when` (two symbols). Query names must match **`shares`** entries (compiler verifies).

```krl
ruleset io.picolabs.example {
  meta {
    name "Example app"
    shares lastReading, ping

    schema {
      events {
        sensor reading {
          temperature Number required
          humidity Number optional
          unit String default "C"
        }
        wrangler new_child_request public {
          name String required
          backgroundColor String optional
        }
      }
      queries {
        lastReading {
          since String optional
          returns Map
        }
        ping {
          returns String
        }
      }
      notifications {
        sensor threshold_exceeded public
      }
    }
  }

  global {
    lastReading = function(since) { … }
    ping = function() { "pong" }
  }

  rule on_reading {
    select when sensor reading
    …
  }
}
```

#### Schema field grammar (sketch)

Inside `schema { … }`:

| Construct | Form | Notes |
|-----------|------|--------|
| **Event** | `DOMAIN TYPE [MODIFIERS] { ATTR … }` | Modifiers: `public`, `raise-only`, `logged`, `replaySafe false` |
| **Attribute** | `NAME TYPE [required\|optional] [default EXPR]` | Types: `String`, `Number`, `Map`, `Array`, `Boolean`, `Any` |
| **Query** | `NAME { ARG … [returns TYPE] }` | Args same shape as attributes; must exist in `shares` |
| **Notification** | `DOMAIN TYPE [public]` | Outbound interest (subscription / discovery) |

Event identifiers use the same **`DOMAIN TYPE`** token pair as `select when` (two symbols), not
`domain:type` string syntax — keeps parser consistent with rules.

`public` → included in discovery bindings for this RID. `logged` / `replaySafe` → mirror/replay
policy (ROADMAP §1).

**Parser work:** new branch in `rulesetMetaProperty` for `schema` → `schemaBody()` recursive descent
(similar to `withExprBody` / rule blocks). New AST nodes: `SchemaDecl`, `SchemaEvent`, `SchemaQuery`,
`SchemaField`.

**Compiler output:** embed normalized JSON on the ruleset module (replace `__testing1`):

```json
{
  "version": 1,
  "events": [
    {
      "domain": "sensor",
      "name": "reading",
      "public": false,
      "attrs": [
        { "name": "temperature", "type": "Number", "required": true },
        { "name": "unit", "type": "String", "default": "C" }
      ]
    }
  ],
  "queries": [
    {
      "name": "lastReading",
      "args": [{ "name": "since", "type": "String", "required": false }],
      "returns": "Map"
    }
  ]
}
```

**Wrangler on install:** read compiled schema from each RID → merge into pico-level store keyed by
`domain:name` and `rid:queryName`.

#### Compiler checks (author-time)

| Check | Action |
|-------|--------|
| Query in schema but not in `shares` | **Error** |
| Shared query missing from schema | **Warn** (strict mode: error) |
| Rule `select when D T` with no schema event | **Warn** |
| Schema event never selected in any rule | **Warn** (may be raise-only — allow with `raise-only` flag?) |
| `bindings()` disagrees with `public` markers | **Warn** on flush or runtime lint |

#### Raised-but-not-selected events

Optional modifier on event decl:

```krl
sensor calibration_needed raise-only {
  reason String required
}
```

Documents events the RS **raises** (or accepts from others) without a local `select when`.

#### Discovery alignment

Replace hand-written `bindings()` maps with:

```krl
bindings = function() {
  wrangler:schemaBindings(meta:rid)
}
```

`schemaBindings(rid)` returns `{ version, queries, events, notifications }` filtered to
`public: true` — single source of truth in `meta.schema`.

#### Deprecation timeline for `__testing`

| Release | Behavior |
|---------|----------|
| **N** | `meta.schema` parsed; pico schema API live; `__testing` = compiled schema slice (compat) |
| **N+1** | Manual global `__testing` → compile warning |
| **N+2** | Remove `__testing1` injection; remove `__testing` query unless legacy RS flag |

#### Wrangler migration

Replace ~30-line hand `__testing` global in `io.picolabs.wrangler.krl` with equivalent
`meta.schema` block (events + shared queries). One-time port; stays in sync with rules.

---

## Interim work (before `meta.schema` ships)

Optional short-term improvements to the legacy `__testing` path; **superseded** once `meta.schema`
is authoritative.

| ID | Fix | Status after meta.schema |
|----|-----|--------------------------|
| **T5** | Dedupe Testing tab at pico level in UI | Replaced by `picoSchema` query |
| **T6** | Lint `"event"` vs `"events"` in manual `__testing` | N/A — manual `__testing` removed |

Compiler extract (**R2**) may still warn when `select when` lacks a matching `meta.schema` entry.

---

## UI / integrator backlog

| ID | Item |
|----|------|
| **U1** | Testing tab: single **Pico schema** view + optional per-RID drill-down |
| **U2** | Typed form fields from schema (number, boolean, JSON) |
| **U3** | Show which RIDs contribute each event/query |
| **U4** | HA / MCP generator consumes `picoSchema` or JSON Schema export |
| **U5** | Channel policy editor cross-checks against schema (“event not declared”) |

---

## Relationships to other work

| Work | Link |
|------|------|
| **Discovery bindings** | Public schema = filtered view; bindings should be generated from meta schema or linted against it |
| **Pico mirrors / replay** | ROADMAP §1 logging flags live on schema entries (`logged`, `replaySafe`) |
| **LLM per pico** | `llm:context()` includes pico schema; NL→event uses schema for extract validation |
| **Channel policy fix** | Schema ceiling: channel cannot allow events outside pico schema (optional strict) |

---

## Open questions

1. **Engine store vs wrangler entity?** Schema registry in LevelDB (engine) vs wrangler-maintained map?
2. **Dynamic schemas?** Rulesets that register events at runtime (e.g. PDS keys) — static vs dynamic section?
3. **Versioning** — schema `version` bump when RS upgraded; integrators cache invalidation?
4. **Cross-pico** — `skyQuery` / subscription: expose remote pico schema via relationship?
5. **`returns TYPE` on queries** — required on every query decl, or optional (default `Any`)?
6. **Event syntax** — confirm `DOMAIN TYPE` (two symbols, like `select when`) vs alternate `domain:type` form — **leaning two symbols**.
7. **Strict mode default** — warn vs error when shared query missing from schema?

---

## Implementation touchpoints

| Layer | Package / file | Change |
|-------|----------------|--------|
| **Parser** | `packages/krl-parser/src/krl.ts` | `case "schema":` in `rulesetMetaProperty`; new AST types in `types.ts` |
| **Compiler** | `packages/krl-compiler/src/c/Ruleset.js` | Emit schema JSON; validate vs `shares`; retire `__testing1` (phased) |
| **Compiler lint** | `packages/krl-compiler/src/compile.js` | Keep `eventScope` for undeclared-event warnings |
| **Wrangler** | `packages/pico-engine/krl/io.picolabs.wrangler.krl` | `picoSchema`, `rulesetSchema`, `schemaBindings`; port hand `__testing` → `meta.schema` |
| **Engine** | install/uninstall hooks | Merge schema on RS lifecycle |
| **UI** | `packages/pico-engine-ui/.../Testing.tsx` | Consume `picoSchema`; typed fields |
| **Tests** | `packages/krl-parser/test/`, `packages/krl-compiler/test/` | Schema parse + compile + lint cases |

---

## Phasing

| Phase | Deliverable |
|-------|-------------|
| **P0** | **Sign off `meta.schema` syntax** (this doc) + parser/AST |
| **P1** | Compiler: schema JSON on RS module; author-time lint vs shares/rules |
| **P2** | Wrangler: install/uninstall merge; **`picoSchema()`** query; **`schemaBindings(rid)`** |
| **P3** | Testing tab + UI channel lint; `__testing` compat alias |
| **P4** | Validation (warn → strict); `logged` / `replaySafe` on events; JSON Schema export |
| **P5** | Remove `__testing` injection; wrangler + platform RSs fully on `meta.schema` |

---

## References

- Compiler: `packages/krl-compiler/src/c/Ruleset.js`, `compile.js` (`getTestingJSON`)
- UI: `packages/pico-engine-ui/src/components/PicoTabs/Testing.tsx`
- Wrangler manual schema: `packages/pico-engine/krl/io.picolabs.wrangler.krl` (`__testing` global)
- Discovery: `test-rulesets/io.picolabs.discovery_test.krl`, `filterBindingsForCaller`
- ROADMAP: `MEMORY.md` §1 (event schema + logging)
