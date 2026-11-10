# Logging tab: transaction log and inspector

**Status:** phase 1 UI started (2026-11-09). `logs` returns structured transactions. The Logging tab is a two-pane view: nested steps on the left, the selected step on the right, with search, ruleset, `domain:type`, errors-only, and klog-only filters. Filters is a dialog. Errors, klog, live, a ruleset substring, and `domain:type` are options there. Wrangler, PDS, subscription, and the developer UI are hidden until each is checked, including their rules inside an event. Testing bookkeeping is its own checkbox. A query's inspector shows the function, arguments, and (once the engine has logged it) the return value from `txnDone`. Replay opens the Testing form for that rule or query (event attributes are not filled in). Open ruleset expands that ruleset. The Logging tab follows new transactions over a live stream. An event's `txnDone` line carries the same rule-outcome list as the event response, and rules that were not selected appear in the log with their select text. A transaction that went through channel policy records which rule allowed it, or a short error transaction when the channel denied it. An `ent:` write is a step with the variable name and the value before and after, truncated at 2 KB. `event:send` is a step with the transport, target, and, for a send on this engine, the child transaction id. An event's `txnDone` line carries the directives it returned, and the done row shows how many. **2026-11-09:** do not propagate the trace id through `event:send` or `schedule`, and do not nest another pico's transaction under the send. A send still records the child transaction id. This ships in 1.9.0.
**Context:** The Logging tab shows one checkbox per transaction, and each one expands to preformatted text lines. The layout in Dick Hardt's AAuth demo (Insecure Agents, AAuth Night, Oct 2026), with a nested request log on the left and a detail view of the selected row on the right, is the model for this design. AAuth's rows are HTTP calls between parties. Here the rows are events, queries and rules moving through picos.

**Related:** [live-pico-ui.md](./live-pico-ui.md) (the inspector direction; this design fills its "Message trace / debugger" and "Activity" rows) · [pico-schemas-1.8.md](./pico-schemas-1.8.md) and [pico-schemas.md](./pico-schemas.md) (rule outcome reporting) · [sky-didcomm-protocol.md](./sky-didcomm-protocol.md) · [pico-move.md](./pico-move.md) · `MEMORY.md` roadmap §2 (selective logging and replay)

---

## Summary

Turn the Logging tab into a **two-pane transaction view**:

- **Left: the log.** One row per step: an incoming event or query, each rule that ran, each `raise`, `event:send`, `schedule` and query out, and a closing row with the outcome and duration. Indentation shows cause and effect: rules under the event that selected them, raised events under the rule that raised them and, once trace context exists, a send to another pico with that pico's handling nested underneath.
- **Right: the inspector.** Everything about the selected row: channel and policy decision, attributes in, rule outcomes, state changes, klog values, directives out, and what it raised or sent, each linked to where it went.

There are three phases. **Phase 1** is mostly UI work on data the engine already logs. **Phase 2** adds a few log entries to the engine. **Phase 3** would propagate the event's eid through `event:send` and `schedule` so the log could follow a cascade across picos. That propagation is not being built. A send on this engine still records the child transaction id. Same-engine function calls already nest.

---

## Today

| Piece | Behavior |
|-------|----------|
| Sink | `packages/pico-engine/src/logging.ts`: JSON lines in `pico-engine.log` (rotating at 100 MB, 12 files), or stdout with a mirror file |
| Read path | The Logging tab reads an in-memory ring: the last N transactions per pico (`PICO_ENGINE_LOG_RING`, default 200), filled by the log writer. A restart clears it. `getPicoLogs(file, picoId)` still scans the active file (last 12 hours) and is no longer what the tab calls |
| Shaping | `ctx:logTransactions()` returns structured transactions from `assembleLogTransactions` (`packages/pico-engine-core/src/logTransactions.ts`). `ctx:logs()` is still the raw lines. `io.picolabs.pico-engine-ui` `logs()` filters out the developer UI's own queries |
| UI | `pico-engine-ui/src/components/PicoTabs/Logging.tsx`: two panes. The left lists each step, indented by `depth`. The right inspects the selected step (channel ECI and tags, input JSON, this rule's klog and raises, Replay, Open ruleset). Filters are client-side. Live (on by default) appends each finished transaction from `GET /api/picos/:eci/logs/live`. Refresh reloads the log |

**Already logged** for each transaction (all carry `picoId`, `txnId`, `time`, `level`):

| `msg` | Source | Carries |
|-------|--------|---------|
| `txnQueued` | `PicoEngineCore.onFrameworkEvent` | full `txn` (kind, event or query incl. eci, attrs or args) |
| `txnStart`, `txnDone` | same | (timing only) |
| `rule selected` | compiled rule (`krl-compiler/src/c/Rule.js`) | `rid`, `rule_name` |
| `fired` / `not fired` | compiled rule | `rid` (no `rule_name`; inferred from position) |
| `event added to schedule` | `onFrameworkEvent` | `rid`, the raised event |
| klog | `KrlLogger` level 40 | `val` |
| `txnError` | `onFrameworkEvent` | error, event/query summary, KRL line and column where known |

**Not logged:** where an incoming event came from. Query calls that leave the engine are not traced. An event's `txnDone` line carries the directives it returned (capped like a query result). An event's `txnDone` line carries `ruleOutcomes` (fired, not fired, and not selected, with the select text). A `policy decision` line carries `eci`, `allowed`, and the matching rule (`domain`/`name` or `rid`/`name`), or `default`, `family`, or `engine`. An `ent write` line carries the variable name, the previous value, and the new value (each truncated at 2 KB). A `send` line carries the transport (`local`, `http`, or `didcomm`), the target, the event, and the child transaction id for a local send.

---

## Layout

### Left pane: the log

| Row | Shows | Chips | Right-aligned |
|-----|-------|-------|---------------|
| Transaction in | time, `source → this pico`, `EVENT domain:type` or `QUERY rid/name` | attribute or argument names | — |
| Rule | rule name | ruleset id | `fired` / `not fired` / `not selected` |
| Raise | `raise domain:type` | attribute names | — |
| Send / query out | `send → target` and `domain:type` (or `query → target rid/name`) | transport: local, HTTP, DIDComm | — |
| klog | message | — | — |
| Done | `← done` | `ok` / `error`, `n fired`, `n directives` | duration |

- Rows for one transaction share an indent level. A raised event's rules nest under its raise row (raised events run in the **same** transaction, so this needs no new data).
- With trace context (phase 3), a send row can be expanded to show the target pico's transaction inline, nested one level deeper. The same applies to a `wrangler:picoQuery`, which behaves like his synchronous call chain.
- Error rows and `txnError` are tinted. Policy denials appear as transactions that stop right after `txnQueued`.
- Filter bar: errors only, klog only, ruleset, `domain:type`, text search, time range. Live toggle.

### Right pane: the inspector

| Section | Content | Available from |
|---------|---------|----------------|
| Header | step title, ruleset, transaction id, duration | phase 1 |
| Channel | ECI, tags, and **which policy rule allowed it** | ECI: phase 1 · policy decision: phase 2 |
| Input | event attributes or query arguments as a JSON tree (`_headers` hidden by default) | phase 1 |
| Rule outcomes | per rule: fired / not fired (condition false) / not selected, with the select text | phase 1 for fired/not fired; `not_selected` reuses `ruleOutcomes.ts` in phase 2 |
| State changes | `ent:` writes in this transaction: path, before → after | phase 2 |
| klog | values as JSON trees | phase 1 |
| Output | directives (event) or result (query) | query result: logged on `txnDone` (capped) and shown for a query · directives: phase 2 |
| Raised / sent | each with a link to its row, or to the target pico | raised: phase 1 · sent: phase 2 · linked across picos: phase 3 |
| Actions | Replay (opens Testing tab pre-filled), Open rule (Rulesets tab at the rule), Save as request (U9 history) | phase 1 |

Every ECI, pico ID and DID in the inspector is a link to that pico, following the "every reference is navigable" principle in live-pico-ui.md.

---

## Data

### Return structured entries

Replace `episode_line` string building with a structured response. The UI does all formatting.

```json
{
  "txnId": "ckx9…a41",
  "kind": "event",
  "start": "2026-11-06T16:21:04.118Z",
  "durationMs": 13,
  "outcome": "ok",
  "steps": [
    { "t": "…", "type": "in", "eci": "…", "event": {"domain": "lorawan", "name": "uplink", "attrs": {…}} },
    { "t": "…", "type": "rule", "rid": "io.picolabs.lht65.router", "rule": "decode", "result": "fired", "depth": 1 },
    { "t": "…", "type": "klog", "rid": "…", "rule": "decode", "msg": "decoded", "val": {…}, "depth": 1 },
    { "t": "…", "type": "raise", "rid": "…", "rule": "decode", "event": {…}, "depth": 1 },
    { "t": "…", "type": "rule", "rid": "io.picolabs.sensor.thresholds", "rule": "check", "result": "fired", "depth": 2 },
    { "t": "…", "type": "send", "rid": "…", "rule": "check", "to": {"eci": "…"}, "transport": "local", "event": {…}, "child": {"txnId": "…"}, "depth": 2 },
    { "t": "…", "type": "done", "fired": 2, "directives": [] }
  ]
}
```

`depth` is computed when steps are assembled from log entries (a raise opens a level; the rules it selects sit inside it). The engine doesn't need to know about depth.

Phase 1 also emits `log` (an explicit `log:` call) and `error` (`txnError`). `done` carries `outcome` and `fired`. `directives` waits until phase 2, when directives are actually logged. `_headers` is omitted from attributes and arguments.

Whether assembly happens in the UI ruleset's KRL or in TypeScript behind it is an implementation choice. TypeScript is simpler, and the ruleset query can stay a thin wrapper.

### Storage

The Logging tab reads an in-memory ring of the last N transactions per pico (default 200, `PICO_ENGINE_LOG_RING`), filled by the same writer that writes the log file. The file stays the durable record for operators. A restart clears the ring. It is not stored on the pico, so it does not move with one.

### Live updates

`GET /api/picos/:eci/logs/live` is a server-sent event stream. It uses the same owner session as the rest of the developer UI. When a transaction on that pico finishes (`txnDone` or `txnError`), the engine sends the assembled transaction. The Logging tab prepends it. The stream does not replay history; Refresh does that. Turning Live off closes the stream.

---

## Engine additions (phase 2)

All are additional `log.debug` entries in engine code. No KRL semantics change.

| Entry | Where | Fields |
|-------|-------|--------|
| `rule_name` on `fired` / `not fired` | `Rule.js` codegen | `rule_name` (makes rows self-describing) |
| `rule outcomes` | after the event is processed, alongside `collectRuntimeRuleOutcomes` | the same list the event response gets, including `not_selected` with select text |
| `policy decision` | where channel policy is evaluated (engine or pico-framework; to locate) | `eci`, `allowed`, matching policy rule or `default` |
| `ent write` | entity put/delete in `KrlCtx` | `rid`, path, previous value (truncated), new value (truncated) |
| `send` | `event:send` (all three branches) | target `eci` or DID, host, transport, `domain:type`, attrs, and the new transaction id for local sends (already returned as `eid`) |
| `query out` | `ctx:query`, `http:get` used by `picoQuery`, `dido:picoQuery` | target, `rid/name`, duration, ok/error |
| `directives` | end of event processing | directive list |

Value truncation (for example, 2 KB per value, with a "truncated" marker) keeps a large PDS write from blowing up the log.

---

## Trace context (phase 3)

### The eid is the trace ID

Sky events carry an **eid** so that an event can be followed as it propagates; that's the purpose of the `:eid` segment in `/sky/event/:eci/:eid/:domain/:type`. The current engine keeps only part of that:

| Today | Effect |
|-------|--------|
| pico-framework mints a fresh id (`genID()`) for every transaction; that id is the log's `txnId` and what `event:eid` returns | The caller's eid never becomes the transaction id |
| `/sky/event` copies the URL eid into attrs as `__eid` (unless it's `none` or already set) | The caller's eid survives, but only as an attribute, and nothing reads it |
| `/c/:eci/event/...` and `event:send` (all three transports) set no eid | Propagation stops at the first send |

So no new identifier is needed. **The eid that started a cascade is its trace ID**, carried as `__eid`:

- **Entering the engine.** `/sky/event` keeps its current behavior. Events arriving on `/c/`, from the UI or MCP, or with `eid` `none` get `__eid` set to their own transaction id, so every cascade has a trace ID from its first transaction.
- **`event:send`.** If the outgoing attrs have no `__eid`, the engine copies in the current event's `__eid`. A rule that wants to start a new trace sets its own.
- **`schedule`.** The scheduled event keeps the `__eid` of the transaction that scheduled it, so a later firing joins that trace.
- **`raise`.** Same transaction; nothing to do.
- **Logging.** `txnQueued` already logs the whole event, attrs included, so the receiving side records the trace ID with no new log code.

Because `__eid` travels **in the attrs**, it crosses every transport with no protocol work: a local send, HTTP to another engine, and DIDComm all carry attrs already. No `traceparent` header, no DIDComm extension header, no pico-framework change.

### Nesting: the parent link

A shared eid puts transactions in the same trace. Placing each one under the right send row also needs its parent:

- **Local sends:** no new data. `event:send` already gets the child's transaction id back from `rsCtx.event`, and the phase 2 `send` log entry records it.
- **HTTP and DIDComm sends:** the sender doesn't learn the remote transaction id, so carry the sending transaction's id as a second engine attr, `__parent_txn`. Without it, cross-engine rows fall back to time order within the trace.

### Same-engine function calls

A shared function that calls another function on this engine goes through `ctx:query`. The engine copies the caller's trace onto that query. From a rule, the trace id is the event's EID. From a query, it is the trace id that query arrived with, or that query's own id. The caller's transaction id is stored as `__parent_txn`. Both ride in the query arguments, and the assembler lifts them off the arguments the way it lifts `_headers`. The call itself is a `query out` step on the caller. The Logging tab nests a callee under its caller when both are in the same pico's log. A call to another pico on this engine shows as `query out` on the caller, with the same trace id on the callee's pico. Calls that leave the engine are not stamped.

### Rules for trace context

- **Advisory only.** `__eid` and `__parent_txn` are never used for authorization or routing. A sender can set them to anything; the worst result is a misleading nesting in someone's log.
- **Visible to KRL.** They're attrs, so rules can read them (`event:attr("__eid")`), which is the classic behavior and lets a ruleset tag its own records with the trace. A ruleset that forwards `event:attrs` into an `event:send` already propagates them.
- **Hidden by default in the UI.** The inspector puts `__`-prefixed attrs in a collapsed "engine attrs" row, as it already does for `_headers`.
- **Engine-only and domain-agnostic.** Nothing here knows about owners, things or communities (layering rule).

### Across engines

Each engine logs its own half. To show a cross-engine trace in one view, the UI needs to fetch the other engine's half: by eid, from a logs endpoint on the target engine, authorized as that engine's owner. A cross-engine send row shows "continued on `<host>`" with the trace ID. The tab does not fetch the other engine's log.

---

## Agents

The structured transaction record is also what the 1.8 MCP server should expose. `get_recent_txns(eci)` and `get_txn(txnId)` return the same JSON the inspector uses, so a coding agent debugging KRL sees exactly what the developer sees. The policy that applies is the same one as the console in live-pico-ui.md: owner-only, never on discovery, OAuth or app channels.

---

## Phases

| Phase | Scope | Engine change | Done when |
|-------|-------|---------------|-----------|
| **1** | Structured `logs` response; two-pane UI; nesting within a transaction; JSON trees; filters; links; Replay and Open rule | small: `rule_name` on fired entries | Logging tab shows the left/right layout for single-pico activity using only data logged today |
| **2** | Per-pico ring buffer and retention setting; live updates; new log entries (policy, outcomes, ent writes, sends, queries out, directives); inspector sections that use them | log calls only | Inspector shows channel policy, state changes and outputs; refresh no longer scans the log file |
| **3** | Skipped (2026-11-09). Do not set `__eid` on entry or copy it through `event:send` and `schedule`. Do not nest another pico's rows under the send. The section below is the design if this is picked up later. | none | — |

---

## Open questions

1. ~~Recent activity in memory or persisted in the pico (moves with it, costs a write per transaction)?~~ Resolved: memory only. A restart clears it. It does not move with the pico.
2. ~~Can events and queries carry trace context without a pico-framework change?~~ Resolved: the trace ID is the eid, carried as the `__eid` attr; queries don't propagate.
3. ~~Cross-engine trace query: build it, or show "continued on `<host>`" and stop there?~~ Resolved: name the other host and the trace id. Do not fetch the other engine's log.
4. ~~React or XMLUI for the new tab?~~ Resolved: this tab stays in the developer UI.
5. Should event responses (`/sky/event`) return the trace eid so external clients can link their own logs to the engine's? For `/sky/event` the client already chose it; for `/c/` it would be the new transaction id.
6. Should `__eid` become the transaction id itself (as in the classic engine), or stay an attr beside pico-framework's own id? Keeping both is simpler and keeps transaction ids unique per pico.
