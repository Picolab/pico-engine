# Pico move: design notes

**Status:** draft (2026-07-17)  
**Context:** Bruce's enhancement requests — [export ruleset + entity vars (#664)](https://github.com/Picolab/pico-engine/issues/664), [move channel between picos (#665)](https://github.com/Picolab/pico-engine/issues/665), and the umbrella [import/export pico (#659)](https://github.com/Picolab/pico-engine/issues/659). Related PLAN items: [PLAN#32](https://github.com/Picolab/PLAN/issues/32), [PLAN#34](https://github.com/Picolab/PLAN/issues/34).

---

## What we are trying to enable

The two proposed primitives are stepping stones toward a larger goal: **relocating a pico** — same engine under a different parent, or a different engine entirely — while preserving as much behavior and as many relationships as practical.

**Export ruleset + entity variables (#664)** is the easy slice. Entity state is ruleset-local: no change to pico identity or tree topology. Bruce's proposal — a new `ctx` primitive that exports a ruleset's installed representation plus its `ent` values as encrypted JSON, and a matching import that installs the ruleset and hydrates entity vars — is analogous to today's install (where entity vars start empty) with a state bundle attached. That alone does not *move* a pico, but it lets a pico **reconstruct its configuration** elsewhere if the surrounding structure is recreated.

**Move channel (#665)** is harder. A channel is not just an ECI string; it carries tags, event/query policy, OAuth webhook binding, subscription endpoints, and references from other picos and external systems. Moving a channel to another pico without remapping those references is incomplete; moving it *with* remapping is a small migration program. Issue #665 is best understood as part of full pico export/import (#659), not a standalone one-liner.

**Move pico (#659)** is the real target. In practice that almost certainly means moving a **subtree**: parent/child links, wrangler bookkeeping, subscriptions, scheduled jobs, and installed rulesets are all part of how the pico behaves. Even a complete subtree export/import does not solve **parent coupling**: descendants often assume the parent provides rulesets, shared subscriptions, DID routes, or policy templates. Re-parenting under a different pico (or engine) may leave the subtree running but functionally broken unless those dependencies were designed as portable or the parent moves with it.

---

## ECI vs DID: why identity matters

Today an ECI is simultaneously a **local routing address** and, in practice, a **capability identifier** (URLs, channel policies, stored references in rulesets and external integrators). Changing an ECI breaks every peer, UI link, and webhook that still holds the old value. That is the main reason "move the pico and keep the same ECIs" is fraught from both security and operability standpoints.

A DID-first model separates concerns:

| Concern | Today (ECI-centric) | Target (DID-centric) |
|--------|---------------------|----------------------|
| Stable pico identity | implicit (pico id + ECIs) | **did:webvh** SCID + portable log |
| Pairwise relationships | subscription + ECI pair | **did:peer** + DIDComm connection |
| Engine-local routing | ECI | fresh ECIs minted on each host |
| External references | often bare ECIs | resolve via DID; ECIs are ephemeral |

**Relocation** in the target model: export state → import under new parent → publish a DID log update (new host/path) → re-establish or rotate did:peer subscription relationships → mint fresh ECIs locally while peers resolve the same DID.

We can prototype subtree move **before** full DID maturity by documenting that **ECIs will not be preserved** and supplying an explicit old→new ECI map for in-mesh rewiring. That is a deliberate interim phase with known security and consistency gaps, not the end state. See [MEMORY.md §5](../../MEMORY.md) (Pico identity: DID/DIDComm) and the R1T adoption scenario in the identity section.

---

## Parent dependencies and what "move the tree" implies

Moving a single pico without its descendants loses relationships that are part of the pico's function (child management, UI layout maps, subscription graphs). Moving the full subtree is necessary for most real cases but still insufficient when:

- the subtree **depends on parent rulesets** (shared OS services, Manifold platform subscriptions, DID routing on the parent);
- **cross-subtree subscriptions** point at siblings or cousins outside the exported pack;
- **external systems** (Home Assistant, webhooks, OAuth clients) hold ECIs or engine URLs directly.

The export format should make these dependencies explicit — e.g. a manifest of required parent rulesets, inbound subscription peers, and external channel tags — and support one of:

1. **Portable pack** — only rulesets and relationships that can be satisfied without the original parent;
2. **Move with parent slice** — include designated parent services in the export (partial parent clone);
3. **Re-parent + migration hooks** — wrangler events on import so rulesets can rewrite stored ECIs and re-subscribe.

Atomicity and rollback (move half-completes), tombstones/forwarding on the source, and consent on both meshes remain open problems; they align with network-mirror machinery ([MEMORY.md §3](../../MEMORY.md)) made federation-aware.

### Donor mesh services — importer's responsibility (1.7)

Portable export/import copies **the subtree only**. It does **not** clone ancestors or the platform services those ancestors provided in the **donor mesh**.

Many picos implicitly depend on capabilities installed or configured on parents above the exported root — shared rulesets, platform subscriptions, query/event routes, OAuth mesh policy, Manifold catalog services, and similar “framework” behavior that lives on an ancestor rather than on the pico being copied. After import, the subtree is attached under a **new parent in the recipient mesh**; that parent (and its ancestors) may not offer the same services.

**The importer is responsible** for ensuring the recipient mesh can satisfy those dependencies before expecting the imported pico to behave as it did on the donor mesh. Concretely:

| Concern | Who owns it |
|--------|-------------|
| Subtree rulesets, `ent`, channels, schedules, Layer 2 identity | Export pack + import pipeline (implemented) |
| Platform / framework rulesets on ancestors (e.g. Manifold) | **Importer** — install the same framework on the adoptive parent (or an ancestor) in the recipient mesh |
| Subscriptions to siblings or cousins outside the exported pack | **Importer** — re-establish or accept broken behavior |
| External integrators holding old ECIs or engine URLs | **Importer / operator** — update out-of-band |

**Example — Manifold:** A thing or app pico developed under Manifold often assumes Manifold rulesets and parent-provided services exist above it in the tree. Importing that subtree under a bare wrangler root on another engine may “work” at the wrangler level but will not behave like a Manifold pico until Manifold (or equivalent services) is present on the **adoptive parent** in the recipient mesh. Prefer importing under a parent that already runs the same framework stack as the donor context.

The engine does not yet emit an automatic **parent dependency manifest** in the export blob (see optional manifest in Phase B). Until then, operators should document or inspect what the subtree relied on in the donor mesh and reproduce that context at import time.

---

## Proposed phasing

### Phase A — Ruleset state export/import (#664)

- `ctx:exportRulesetState(rid, secret)` → encrypted JSON (ruleset url/rid + `ent` snapshot + optional config).
- `ctx:importRulesetState(blob, secret)` → install (or flush) ruleset + set entity vars.
- No topology change, no channel move, no ECI preservation.
- Validates the crypto + packaging story Bruce outlined.

### Phase B — Subtree export/import (#659, minimal)

- Export: pico id, installed rulesets, entity vars, children (recursive), channels (policy + tags, **not** preserving ECIs), subscriptions (logical endpoints), schedules.
- Import: mint new ECIs everywhere; attach under nominated parent; emit old→new ECI map; remap ECIs embedded in `ent` (including `ent:_schedule` and subscription buses); reload schedule jobs; fire wrangler `pico_imported` with `{ eciMap, picoIdMap, oldRootPicoId, newRootPicoId }` for ruleset migration hooks.
- Optional **parent ruleset manifest** — fail or warn if non-portable dependencies detected.
- Legacy note: pre-1.x had `engine:exportPico` / `engine:importPico` ([CHANGELOG](../../CHANGELOG.md)); any revival should be DID-aware and multi-root-safe.

#### Ruleset source policy (reference vs inline)

**Do not embed KRL** when the ruleset can be **retrieved by reference** on the destination. Phase A blobs carry `url` + config + `ent`; Phase B adds KRL inline only when reference fetch will fail after move.

| Source | Export pack | Import on destination |
|--------|-------------|------------------------|
| **`https:`** (or other remote URL) | **URL only** — re-fetch on import | `flush` + `load(url)` |
| **Engine-bundled OS KRL** (wrangler, subscription, …) | **URL or rid** — no inline KRL | Remap via `resolveBundledKrlUrl()` to running engine's `krl/` (already works across different absolute `file:` paths on same engine class) |
| **Local `file:`** (dev tree, invite bootstrap, machine-specific path) | **Inline KRL required** (from `rulesets-db` cache or read at export time) | Register under pack-local or engine-home URL; do not preserve source path |
| **Unreachable at export** | Fail or warn — cannot move portably | — |

Rationale: keeps packs small and avoids stale forks of rulesets that have a canonical remote source; only pay the bytes cost where reference retrieval is impossible (the cross-machine `file:` case).

### Phase C — Channel "move" (#665)

- Prefer **clone + retire** over literal ECI transfer: create equivalent channel on target pico, copy policy/tags/ent-backed OAuth state, update subscriptions to new endpoint, deprecate source.
- Literal channel ECI move only where same pico engine instance and all referrers can be updated atomically (narrow case).

### Phase D — DID-native portable move

- **Implemented:** `dido:relocateWebvhAfterMove()` appends a did:webvh log entry (SCID unchanged; `portable: true` only at inception). Optional `renewIngress: true` mints a fresh DIDComm ingress ECI (post-import move).
- **Implemented:** `dido:notifyPeersOfWebvhRotation()` / `completePortableMove()` send SKY `…/rotate` DIDComm messages; peers update identity store + `ent:established` `Tx_host` via `wrangler:webvh_peer_rotated`.
- **Implemented:** `from_prior` on rotate messages when the did:webvh identifier changes; `pendingRotations` stored on recipients.
- **Implemented:** Identity snapshots in subtree export (webvh log/keys, peer subscriptions); `IdentityService.exportPortableSubtree()` / `importPortableSubtree()` runs import → per-pico relocate → `completePortableMove` on the moved root.
- **Implemented:** `test/portableMoveDemo.ts` — two engines, three meshes, cross-mesh subscriptions survive moving a hub pico + dependent.
- **Implemented:** optional ruleset **`io.picolabs.portable_subtree`** (not autoloaded) — install on exporting parent or adopting parent; `exportSubtree` query + `import` event wrap the full pipeline.
- Peers follow **DID**, not ECI; engine mints new local ECIs as routing handles only.

### Using `io.picolabs.portable_subtree` (demo / utility)

Copy is intentional: import does **not** delete the source subtree; remove it manually after peers have cut over.

1. **Source engine** — on the parent of the subtree to copy, install `io.picolabs.portable_subtree` (Rulesets tab → engine KRL catalog, or `/krl/io.picolabs.portable_subtree.krl`).
2. **Export** — from a channel on that parent, query:
   - `io.picolabs.portable_subtree:exportSubtree(subtreeRootPicoId, secret)` → encrypted blob string.
3. **Transfer** the blob to the destination (paste, file, HTTP — your choice; not built into wrangler yet).
4. **Destination engine** — adopt under a parent that provides the services the subtree expects. For a **thing pico on someone’s Manifold**, use normal Manifold bootstrap (owner → Manifold app pico already exists); opt in once with `raise manifold event "enable_portable_thing"` (installs engine `io.picolabs.portable_subtree` + `io.picolabs.manifold_portable_thing` from manifold-api).
5. **Import** — on the Manifold app channel:
   - `raise manifold event "import_portable_thing" attributes { "blob", "secret", "name", "donorQueryEci", "renewIngress" }` → `import_portable_thing_done` (includes `thingQueryEci` when `donorQueryEci` is set).
   - Generic (no Manifold registration): `raise portable_subtree event "import" attributes { "blob", "secret" }` on a pico that has `io.picolabs.portable_subtree`.
6. **Clean up** — delete the old subtree on the source when no longer needed.

**Cross-engine club gear demo (`docker-compose.cross-engine.yml`):** donor Engine A uses gitignored `io.picolabs.club_gear_demo` only to build the club and export bike #7; recipient Engine B uses standard Manifold bootstrap + steps 4–5 only (no demo ruleset). Optional `io.picolabs.ride_coordinator_demo` on B opens a Layer 2 subscription to the moved bike; the **owner approves** the pending subscription on the thing pico (`pending_subscription_approval` with the inbound `Id`) — Manifold things do not use subscription auto-accept.

**Relationships after import (expectations):**

| Edge | In the export blob? | After cross-engine import |
|------|---------------------|---------------------------|
| Manifold ↔ thing (destination) | No — created by `import_portable_thing` on B | **New** subscription on the imported pico |
| Thing ↔ Trail Ride Community (community may stay on engine A) | Yes — subscription `ent:established` + identity peers | **Survives** like other Layer 2 relationships: export upgrades the bus to `Tx_did`, import relocates the bike’s did:webvh, SKY rotate updates the community’s `Tx_host` / `Tx_did`. Communities must call **`subscription:queryOnSub`** (not raw `picoQuery(Tx_did)`) so traffic follows the subscription after move. Delete the **donor** bike copy on A after import so the engine does not shortcut to a stale local pico with the same DID. |
| Ride coordinator ↔ bike (Layer 2, pre-export) | Yes — `ent:established` + identity `peerSubscriptions` on the bike | **Should survive** — same SCID + rotate notices + local peer reconcile on the engine; re-run coordinator setup only if the relationship was never established before export |
| Peer / Layer 2 services (same SCID) | Yes — identity `peerSubscriptions` + subscription buses | **Survive**; peers get SKY rotate + `webvh_peer_rotated` to update `Tx_host` |

Import hydrates all ruleset `ent` vars (including relationship buses) and re-applies subscription/thing entity after wrangler bootstrap finishes, so community links on the **bike pico** are not dropped silently.

---

## Security notes (interim phase)

Until Phase D, treat exported blobs and ECI remap tables as **capability-bearing secrets**. Encrypted ruleset export (#664) is necessary but not sufficient: subscription re-establishment, OAuth secrets, and webhook URLs in entity vars may leak authority if imported onto a hostile parent. Import should require an explicit parent/pico policy gate (e.g. wrangler event + session/auth on engine API if invoked from UI).

Do **not** reuse ECIs across engines or accounts to "make move easy" — that conflates identity with capability and bypasses channel policy boundaries.

---

## Related work

- [MEMORY.md §7 — Pico migration / portability](../../MEMORY.md)
- [MEMORY.md — Worked scenario: cross-mesh pico adoption (R1T)](../../MEMORY.md)
- Historical: `engine:exportPico` / `engine:importPico` (removed; see CHANGELOG 0.x entries)
