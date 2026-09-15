# Delegated admin relationship — follow-up note

**Status:** follow-up (2026-08-17)  
**Context:** Bruce Conrad's [1.5 shared-engine post](https://picostack.blogspot.com/2026/08/recent-updates-sharing-pico-engine.html) and internal discussion on passkeys vs co-control. See [pico-relationships.md](./pico-relationships.md), [MEMORY.md §8](../../MEMORY.md) (Fuse two-owners), [MEMORY.md §9](../../MEMORY.md) (passkeys).

---

## Problem

**Passkeys bind one human account to one root mesh** for developer UI access. That is correct for tenant isolation on a shared engine (1.5 invites → separate meshes). It is **not** a model for:

- Spouse / co-founder co-admin of **the same** mesh
- IT delegate who can manage a subtree without owning the root passkey
- Host operator helping a tenant **without** full cross-mesh visibility (Bruce's downside, but scoped)

**Sharing passkeys is not acceptable** — same credential, no per-delegate revoke, bad recovery. Multiple passkeys on one account (supported today) are for **one person, multiple devices**, not co-owners.

**Target model:** everyone has their **own pico** (root + mesh). All sharing — including administrative sharing — goes through **relationships**, not shared login.

---

## Design direction

Separate two planes (already in MEMORY §8):

| Plane | Mechanism | Examples |
|-------|-----------|----------|
| **Hierarchy admin** | Passkey → root pico → parent/child tree | Create child, install ruleset, delete subtree |
| **Conferred / delegated rights** | **Relationship** + Rx policy (+ optional tags) | Owner, co-owner, delegate, support, borrower |

**Delegated admin** is a **relationship type** (domain or wrangler-level), not a second passkey on the same account.

Rough intent:

- **Grantor** (root or admin pico) forms a relationship to **grantee's pico** (always did:webvh / layer2 in new code).
- Relationship carries a role such as `admin_delegate`, `co_admin`, or domain-specific `mesh_admin`.
- **Rx (and possibly scoped Tx) policy** on that edge defines what the delegate may do: e.g. wrangler child ops, ruleset install, query established relationships — **not** passkey registration or account takeover.
- **Developer UI** (future): session still from grantee's passkey; UI shows meshes/trees they may admin **because** an established delegate relationship exists — not because they share the grantor's account.

This mirrors Fuse: **owner is a relationship**; two owners = two relationships, not two passwords.

---

## What 1.5–1.6 gives us vs gaps

| Have today | Gap |
|------------|-----|
| One account ↔ one root ↔ passkey(s) | No “admin this other mesh/subtree” without new account + awkward linking |
| Invites → new mesh on shared engine | Not “join my mesh as admin” |
| Relationships + Rx policy (generic) | No **`admin_delegate`** (or similar) preset, lifecycle, or UI |
| OAuth integrator access to channels | Automation, not human developer UI co-admin |
| `filterBindingsForCaller`, roles on bus | Policy at door; no first-class delegate formation UX |

---

## Open questions (for a future design pass)

1. **Granularity** — Delegate to whole mesh (root subtree) vs specific child pico vs tag-scoped subtree?
2. **Wrangler vs domain** — Is `admin_delegate` a wrangler **`relationship_type`** preset (like `peer`) or purely domain RS (Manifold/Fleet)?
3. **UI session model** — Single login, multiple “contexts” (my mesh vs delegated meshes)? Or always act via grantee pico querying/administering through relationship?
4. **Introduction / consent** — Grantor initiates; grantee accepts pending relationship? Revoke = cancel relationship?
5. **Support / break-glass** — Time-limited delegate role for host operators (Bruce scenario) vs long-lived co-admin?
6. **Engine enforcement** — Beyond Rx policy: does developer UI `/c/*` need relationship-aware authorization, or is channel policy enough?
7. **Manifold exposition** — e.g. `manifold add_admin(delegate_did, scope)` → `wrangler:relationship` + delegate template.

---

## Suggested phasing

| Phase | Deliverable |
|-------|-------------|
| **Design** | Role name(s), policy preset for delegate admin, consent flow, UI sketch |
| **Wrangler/community** | Delegate Rx template; optional `relationship_type` hook |
| **Engine/UI** | Relationship-aware admin context (which trees a logged-in user may manage) |
| **Manifold** | Example: co-admin or IT delegate on a mesh without shared passkeys |

---

## One-line summary for external docs

> Passkeys authenticate **you to your agent** (root pico). **Delegated admin** is a **relationship** from your pico to someone else's agent with an admin policy bundle — not shared passwords.

---

## Cross-references

- [pico-relationships.md](./pico-relationships.md) — graph edges, ReBAC, `peer` preset
- [MEMORY.md §8](../../MEMORY.md) — admin (tree) vs conferred (relationship + policy)
- Bruce Conrad — shared engine, admin cannot see other tenants' picos (by design); delegate support is a different axis
