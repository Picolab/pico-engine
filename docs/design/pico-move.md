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

---

## Proposed phasing

### Phase A — Ruleset state export/import (#664)

- `ctx:exportRulesetState(rid, secret)` → encrypted JSON (ruleset url/rid + `ent` snapshot + optional config).
- `ctx:importRulesetState(blob, secret)` → install (or flush) ruleset + set entity vars.
- No topology change, no channel move, no ECI preservation.
- Validates the crypto + packaging story Bruce outlined.

### Phase B — Subtree export/import (#659, minimal)

- Export: pico id, installed rulesets, entity vars, children (recursive), channels (policy + tags, **not** preserving ECIs), subscriptions (logical endpoints), schedules.
- Import: mint new ECIs everywhere; attach under nominated parent; emit old→new ECI map; fire wrangler `pico_imported` (or similar) for ruleset migration hooks.
- Optional **parent ruleset manifest** — fail or warn if non-portable dependencies detected.
- Legacy note: pre-1.x had `engine:exportPico` / `engine:importPico` ([CHANGELOG](../../CHANGELOG.md)); any revival should be DID-aware and multi-root-safe.

### Phase C — Channel "move" (#665)

- Prefer **clone + retire** over literal ECI transfer: create equivalent channel on target pico, copy policy/tags/ent-backed OAuth state, update subscriptions to new endpoint, deprecate source.
- Literal channel ECI move only where same pico engine instance and all referrers can be updated atomically (narrow case).

### Phase D — DID-native portable move

- did:webvh log update (host/path) with SCID continuity (`portable: true` at inception).
- DIDComm DID Rotation for peer/service subscriptions that must survive.
- Peers follow **DID**, not ECI; engine mints new local ECIs as routing handles only.

---

## Security notes (interim phase)

Until Phase D, treat exported blobs and ECI remap tables as **capability-bearing secrets**. Encrypted ruleset export (#664) is necessary but not sufficient: subscription re-establishment, OAuth secrets, and webhook URLs in entity vars may leak authority if imported onto a hostile parent. Import should require an explicit parent/pico policy gate (e.g. wrangler event + session/auth on engine API if invoked from UI).

Do **not** reuse ECIs across engines or accounts to "make move easy" — that conflates identity with capability and bypasses channel policy boundaries.

---

## Related work

- [MEMORY.md §7 — Pico migration / portability](../../MEMORY.md)
- [MEMORY.md — Worked scenario: cross-mesh pico adoption (R1T)](../../MEMORY.md)
- Historical: `engine:exportPico` / `engine:importPico` (removed; see CHANGELOG 0.x entries)
