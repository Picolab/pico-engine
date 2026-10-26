# Engine hang postmortem — October 2026 (1.7 / club gear portable move)

**Status:** Working notes (facts as we know them; not every episode was instrumented).  
**Context:** Repeated “engine hung” symptoms while building the **cross-engine portable move** demo (club gear → Manifold → bike export/import), mostly on **Docker Engine A** with **multiple root picos (meshes)** on one process.

**Related:** [`docs/release/1.7.md`](../release/1.7.md) (demo footguns), [#493](https://github.com/Picolab/pico-engine/issues/493) (UI forest deadlock), [`pico-move.md`](./pico-move.md), manifold-api `subscription_added` routing fixes.

---

## Executive summary

| Question | Answer |
|----------|--------|
| Is “one bad `picoQuery()`” supposed to freeze **one pico**? | **Yes** — per-pico FIFO queue is intentional (pico-framework). |
| Did we also see **all meshes / whole UI** stop? | **Yes (operator report)** — consistent with **process-wide** effects, not only one queue. |
| Root cause fully proven with logs? | **Partially.** Several **known deadlock / storm** patterns match; we did **not** always capture parallel `curl` to a second root during a hang. |
| Fix size | **Tiered:** KRL/engine discipline + framework guardrails (medium); true mesh isolation needs separate processes (larger). |

---

## Architecture facts (what “hang” can mean)

1. **Per pico:** One transaction (event or query) at a time (`PicoQueue` → `Pico.doTxn`). A blocked txn blocks **that pico’s** queue only.
2. **One Node process:** All meshes share one **JavaScript event loop**, one **LevelDB**, one **global schedule module** (`Scheduler` in `pico-engine-core` schedule init).
3. **Therefore “whole engine”** can still happen when:
   - Code **never yields** (tight synchronous loop in a rule or in schedule `onTime` burst).
   - **Many picos** are wedged or saturated at once (subscription/Manifold chains).
   - **UI / HTTP** fans out serial waits across picos or blocks on one hot path (Manifold app pico, root UI).
   - **Global maintenance** walks every pico (`refreshAllUiChannelPolicies` in `provisionRoot.ts`).

---

## Episodes (facts as we know them)

### E1 — Developer UI “forest” deadlock (pre-1.4; fixed)

| | |
|---|---|
| **Symptom** | UI load never finished; felt like engine frozen. |
| **Cause** | `box()` / forest layout used **cross-pico `ctx:query`** from inside queries → queue deadlock. |
| **Fix** | [#493](https://github.com/Picolab/pico-engine/issues/493): cache child UI ECIs in `ent:child_ui_ecis`; **no cross-pico query from UI ruleset queries**. |
| **Lesson** | **Most visible hangs are UI-shaped** even when the bug is queue semantics. |

### E2 — Layer 2 SKY intro / subscription txn wedge (1.6–1.7; fixed in engine)

| | |
|---|---|
| **Symptom** | Subscription / intro path stuck; Tx side never completed. |
| **Cause** | `eventWait` on a pico still inside the **outbound subscription transaction** that triggered intro (same-queue deadlock). |
| **Fix** | `skyIntro.ts`: queue `sky_intro_response` with **`pf.event`** (fire-and-forget), not `eventWait`. Test: `skyIntro.ts` “autoAccept does not deadlock Tx pico”. |
| **Scope** | Single-pico queue; can **block UI** if that pico is on the critical path. |

### E3 — Manifold `subscription_added` on well-known Rx (manifold-api; fixed)

| | |
|---|---|
| **Symptom** | Manifold/club gear **setup** appeared hung; txn with **no rules selected** in UI logs. |
| **Cause** | Heavy work on **`subscription_added`** raised to **well-known Rx channel** → channel policy / queue interaction; work needed to run on **Manifold app channel** (`ent:app_channel_eci`). |
| **Fix** | manifold-api: **defer** subscription side-effects; `event:send` to **`manifoldAppEci()`**; **`getThings` / `getCommunities`** from **`subscription:established()`** (not nested `acc.put` bug). |
| **Operator note** | After engine upgrade, **flush/reinstall** `io.picolabs.manifold_pico` on **each** Manifold app pico. |

### E4 — Club gear demo `setup` stuck in `ent:stage == "creating"` (demo KRL; mitigated)

| | |
|---|---|
| **Symptom** | `setup` txn with **no rules**; stage `creating` from a **failed** earlier run; rules only allowed `idle`. |
| **Cause** | Demo state machine + failed partial setup (not necessarily engine bug). |
| **Mitigation** | Allow `creating` in setup rules; **cleanup** event resets stage; prefer **callbacks** over timers. |
| **Status** | Demo lives in **gitignored** `demos/`; not shipped in engine repo. |

### E5 — Schedule / `time:add` footgun (documented; engine TODO)

| | |
|---|---|
| **Symptom** | Engine or pico **never settles**; tight re-entrancy. |
| **Cause** | `schedule … at time:add(…, {"seconds": expr})` — **expr not evaluated** in map → delay **`time:0`** → immediate re-fire (see `1.7.md`). |
| **Mitigation** | Literal seconds in `time:add`, or **Manifold callbacks** (`callback_eci`, completion events). |
| **Engine TODO** | Reject/warn **`time <= now`** at schedule time. |

### E6 — Same-pico `ctx:query` during Manifold cleanup (documented; mitigated in demo)

| | |
|---|---|
| **Symptom** | Manifold pico queue **never completes** (infinite wait). |
| **Cause** | Event on Manifold pico calls `ctx:query(..., "io.picolabs.manifold_pico", "getThings")` → query waits behind **same** event txn. |
| **Mitigation** | Store **`ent:cleanup_bike_id` / `ent:cleanup_community_id`** at subscription time; do not live-query during cleanup. |
| **Engine TODO** | Same-pico **reentrancy fail-fast** (framework). |

### E7 — “Entire engine hung, including other meshes” (operator report; **not fully instrumented**)

| | |
|---|---|
| **Symptom** | Switching meshes in UI, other roots unresponsive; Docker single engine with **multiple root picos**. |
| **What we did not capture** | CPU high vs idle; **`curl` to root B UI ECI** while root A wedged; txnId stuck in logs across picos. |
| **Plausible explanations (compatible with architecture)** | (a) **Event-loop starvation** — one txn or schedule storm; (b) **many picos** in `eventWait`/`picoQuery` chains; (c) **UI** serial loads (relationships forest, `event-wait` tabs) all blocked on shared hot picos; (d) **misread** — only the **session’s** mesh UI stuck, process still serving other ECIs. |
| **Next time** | See [Reproduce checklist](#reproduce-checklist-if-it-happens-again) below. |

---

## Why the UI is the canary

The developer UI is **not** a separate service. It drives the engine over HTTP:

- Many actions use **`/c/.../event-wait/...`** or **`event/.../query/...`** (block until txn completes).
- Forest / relationships load **many queries** (per-box `box`, `established`, etc.).
- After passkeys (1.5+), **all** `/c/*` traffic needs a **session** — if the one UI channel or root path is wedged, **everything visible** stops.

So “UI hung” ≠ “every pico queue wedged,” but it **does** mean the operator cannot recover without restart or CLI.

**Already shipped UI-side mitigation:** #493 (no cross-pico query in `pico-engine-ui` ruleset for layout).

**Remaining UI risk:** Serial fan-out without timeouts (`relationships.js` loops boxes); any tab waiting on a wedged Manifold/child ECI blocks that view.

---

## Fixes already shipped (relevant to hangs)

| Area | Change |
|------|--------|
| UI forest | #493 — cached UI ECIs |
| SKY intro | Fire-and-forget intro response queueing |
| Manifold API | App-channel routing; subscription-backed `getThings` |
| Export | `portableExportPrepare` — no `pf.query` during export query (deadlock comment) |
| Import bootstrap | `subtreeWrangler` — avoid blocking **parent** queue where possible |
| Shutdown | `PicoEngine.shutdown()`, SIGTERM/SIGINT in CLI; LevelDB LOCK recovery (1.6.4+) |

---

## Open work (resilience epic — draft priority)

1. **Framework:** Same-pico query during event → **error or bounded nested run** (not infinite wait).
2. **Framework:** Optional **per-txn timeout** (query + event); surface as HTTP 504 / structured error.
3. **Schedule:** Fail fast on **zero / past** `at` times; fix `onTime` to reschedule remaining futures safely.
4. **Engine audit:** Replace risky **`eventWait`** on local-dispatch paths where callee may share queue (ingress SKY still uses `eventWait` on Rx — document timeout).
5. **UI:** Parallel queries with **timeouts**; don’t serial-walk all boxes on one failure.
6. **Global walks:** `refreshAllUiChannelPolicies` — avoid blocking entire engine on one bad pico (chunk + timeout).
7. **Observability:** `/api/health` + **queue depth / current txn per pico** (debug endpoint).
8. **Blast radius:** Document that **multi-mesh on one process** is convenience, not isolation; production option = **one engine per tenant** or worker pool (larger).

---

## Soft reset vs restart (SIGHUP and friends)

**Today:** CLI installs **SIGTERM** and **SIGINT** only → **`engine.shutdown()`** (close HTTP, rulesets DB, main DB) → exit. Full restart required to serve again.

**Idea:** **SIGHUP** or **SIGUSR1** “soft reset” without exiting the process, e.g.:

- Cancel in-flight HTTP with 503;
- **Clear pending txn waiters** with error (dangerous — can corrupt KRL assumptions);
- Or lighter: **reset global scheduler timer**, expose **admin “abort txn id”** (needs txn registry);
- Or **reload rulesets only** (does not fix wedged queues).

**Assessment:** **Probably overkill for Docker/ECS** where restart is cheap and state lives on the volume. More valuable:

- **Timeouts** so HTTP requests fail instead of hanging forever;
- **Health** that reports wedged pico + txnId;
- **Documented `docker restart`** + preserve `PICO_ENGINE_HOME`.

If we add a signal later, prefer **SIGUSR1 = dump queue/txn snapshot to log** (debug) before **SIGUSR2 = experimental cancel** — not SIGHUP (traditionally reload config; we have no safe reload semantics).

---

## Reproduce checklist (if it happens again)

While “frozen”:

1. **`top` / Activity Monitor** — Node CPU **high** (loop) vs **low** (blocked waits)?
2. **Direct query another mesh** (replace ECI):
   ```bash
   curl -sS -b cookies.txt "http://localhost:3000/c/<ROOT_B_UI_ECI>/query/io.picolabs.pico-engine-ui/box"
   ```
3. **Logs** — one txnId stuck at `txnStart` with no `txnDone` on which **picoId**?
4. **Browser network tab** — which URL pending (`event-wait`, `query`, `/api/ui-context`)?
5. Note **action** (setup, cleanup, flush, subscription, portable export).

Record in a comment on this doc or a GitHub issue.

---

## References

- pico-framework: `PicoQueue.ts`, `Pico.ts` (`doTxn`, single-threaded comment)
- Engine: `provisionRoot.ts` (`refreshAllUiChannelPolicies`), `schedule.ts` (`Scheduler.onTime`)
- KRL: `io.picolabs.wrangler.krl` (`picoQuery` → `ctx:query` same host)
- UI: `packages/pico-engine-ui` — Channels/Rulesets/Relationships tabs → `event-wait` / `query`

**Maintainers:** Update this file when a hang is root-caused or when resilience work lands.
