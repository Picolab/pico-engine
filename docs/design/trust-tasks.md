# Trust Tasks on picos

**Status:** brainstorm (2026-11-18). Not scheduled; kept so the idea shapes nearby work (schemas, relationships, delegated admin, harness).
**Context:** With did:webvh, did:peer:4, and SKY over DIDComm in place, picos have the identity and transport that the Trust over IP **Decentralized Trust Graph Working Group (DTGWG)** assumes for its **Verifiable Trust Agents (VTAs)** and **Trust Tasks**. This doc records how those ideas map onto picos, the one place they conflict with the pico model, and where each piece would live in the stack.

**Related:** [pico-overview.md](./pico-overview.md) · [sky-didcomm-protocol.md](./sky-didcomm-protocol.md) · [pico-relationships.md](./pico-relationships.md) · [delegated-admin-relationship.md](./delegated-admin-relationship.md) · [pico-schemas.md](./pico-schemas.md) · [agent-harness-on-mesh.md](./agent-harness-on-mesh.md) · [logging-tab.md](./logging-tab.md) · [MEMORY.md §5 identity](../../MEMORY.md) · [Way of the Pico](../developing/way-of-the-pico.md)

**External:** [trusttasks.org](https://trusttasks.org/) and its [framework spec](https://trusttasks.org/SPEC.md) · [OpenVTC overview](https://openvtc.github.io/wiki/overview) · [VTI lab](https://lf-decentralized-trust-labs.github.io/labs/lfdt/verifiable_trust_infrastructure.html) · [first.openvtc.net](https://first.openvtc.net/) (a running VTC) · [First Person white paper](https://www.firstperson.network/white-paper)

---

## Summary

- A **pico can play the VTA role**: always on, holds its own keys (engine-held, not KRL-readable), keeps its own state and history, and acts for its principal. VTI pictures one VTA per principal. Picos give **one per entity** ("One Entity, One Pico"): the person, the truck, the sensor, the community. That is what picos add.
- **Trust Tasks** are the DTGWG wire format: a self-contained JSON document asking a counterparty to achieve an outcome. They are **commands**. The Way of the Pico says **events report facts**. So tasks stay at the edge: a task arrives as the fact **`trust_task:received`**, a binding ruleset validates and authorizes it, domain rules decide, and the reply leaves as the fact **`trust_task:responded`**.
- Discovery comes from **pico schemas**, the same source as MCP tools. Authorization stays in **channel policy and relationships**, never in the document's claims.
- **Relationships map to DTG credentials** (relationship, delegation, authority). A Manifold **community maps to a Verifiable Trust Community (VTC)**.
- Terminology: picos are **actors** that *implement the VTA role*. We don't call a pico a VTA or an agent.

---

## 1. Background

### Trust Tasks (framework spec, DTGWG)

A Trust Task is a single JSON object, transport-agnostic, between **two parties** (multi-party exchanges are linked bilateral tasks).

| Member | Meaning |
|--------|---------|
| `id` | Instance id (UUIDv4 recommended). Consumers reject a duplicate `id` with different content |
| `type` | Type URI with version, e.g. `https://trusttasks.org/spec/acl/change-role/0.1`. No fragment or `#request` = request; `#response` = success; reserved `trust-task-error` = failure; `trust-task-next-step` = continuation |
| `payload` | Task-specific body, schema defined by the task spec |
| `threadId` / `parentThreadId` | Correlation; DIDComm `thid` / `pthid` map onto these |
| `issuer` / `recipient` | Verifiable identifiers; authoritative over transport-derived identity. A document with a proof must name its `recipient` |
| `issuedAt` / `expiresAt` | Acceptance window |
| `proof` | W3C Data Integrity; baseline `eddsa-jcs-2022` (what our did:webvh logs already use) |
| `ceremony` | Membership in a multi-step ceremony. Content of ceremony definitions is **deferred** in the spec |

**Lifecycle states:** `received`, `validated`, `accepted`, `executing`, `suspended`, then terminal `responded`, `errored`, `cancelled`, `expired`. Silence signals nothing.

**Reserved tasks we care about:** `trust-task-discovery` (which types do you support; advisory, grants nothing), `trust-task-control` (cancel / suspend / resume; proof required; doesn't roll back completed effects).

**Rules that matter for us:**

- Authorization is **separate** from identity and proof validation, and must be **re-checked before each irreversible effect**.
- Ceremony membership is an assertion, **not** a grant of authority.
- Task specs declare **side-effect and exposure classes** (`destructive` = irreversible).
- Proof may be omitted only where a binding documents its security properties; hop authentication alone isn't enough. The HTTPS binding gives no end-to-end guarantee.

### VTI / OpenVTC

- **VTA:** always-on signing oracle and holder's system of record (keys, credential vault, personas, app state), with a hash-chained audit log. Usually cloud-hosted, optionally in an enclave.
- **DTG credentials:** Membership (pair), Relationship (one each direction), Delegation (grant + required acceptance), Authority (attenuable down a digest-linked chain), Statement (`endorses/1`, `vetted/1`, …), Persona, Invitation.
- **VTC:** a community that issues membership credentials, publishes a status list, keeps a chained audit trail, and recognizes other communities' credentials through a trust registry.
- **Transport:** TSP is VTI's default; **DIDComm v2 is kept for interoperability**. Since the Eucalyptus release every call into the VTI stack is a signed Trust Task.

---

## 2. Why picos fit

| VTA / DTG concept | Pico today |
|-------------------|------------|
| Always-on agent per principal | Persistent identity, state, availability |
| Keys never leave the agent | Engine-held keys, not KRL-readable |
| Holder's system of record | Entity state + PDS in the pico; no external DB |
| Hash-chained audit | did:webvh log; transaction log ([logging-tab.md](./logging-tab.md)); selective logging & replay roadmap |
| DID-to-DID protocol | SKY over DIDComm v2, did:peer:4 per relationship, did:webvh per pico |
| Relationship credential pair | Typed, pairwise relationship (Tx/Rx roles) |
| Delegation credential | [delegated-admin-relationship.md](./delegated-admin-relationship.md) |
| Attenuable authority | Lending with reduced rights; introduction pattern |
| VTC | Manifold community pico |
| Agents as credential holders | [agent-harness-on-mesh.md](./agent-harness-on-mesh.md): durable pico + ephemeral model |

Way of the Pico principles that support this: **One Entity, One Pico** (a trust role for every entity, not just people); **Rights Are Relationships** (DTG edges are relationships); **Picos Should Be Able to Leave** (credentials anchored to the SCID move with the pico).

---

## 3. The conflict and the resolution: tasks at the edge, facts inside

The Way of the Pico: *events say what happened* (`sensor:new_readings`, not `update_sensor`). A Trust Task type such as `acl/change-role` is a command. Mapping a task type URI directly onto an event type would bring commands onto the event bus.

Resolution: the task enters and leaves as **facts about the task**, and only a binding ruleset reads the command.

```
 counterparty                         pico
 ───────────                          ─────────────────────────────────────────────
 Trust Task ──DIDComm / HTTPS──▶  trust_task:received        (fact: a document arrived)
                                     │  binding ruleset: envelope, payload schema,
                                     │  expiry, recipient, proof, duplicate id, authority
                                     ▼
                                  trust_task:accepted        (fact: binding admitted it)
                                     │
                                     ▼  handler rule (domain ruleset) decides
                                  <domain fact>  e.g. acl:role_changed
                                  trust_task:outcome         (fact: handler reached a result)
                                     │  binding builds #response or trust-task-error,
                                     │  signs, sends, records state
                                     ▼
 response ◀──────────────────────  trust_task:responded      (fact: reply sent)
```

| Event | Raised by | Meaning |
|-------|-----------|---------|
| `trust_task:received` | Transport (sky event on the task channel / DIDComm unpack) | A document arrived on a channel that admits tasks |
| `trust_task:accepted` | Binding ruleset | Validated, proof checked, authorized for this type; handlers may act |
| `trust_task:suspended` | Binding or handler | Waiting (human approval, step-up, external input) |
| `trust_task:outcome` | Handler rule | Result reached: `{id, payload}` or `{id, error}` |
| `trust_task:responded` | Binding ruleset | Response or error sent; terminal state recorded |

Only `received` and `responded` cross the pico's boundary; the others are internal. Handler rules stay ordinary KRL: they select on `trust_task:accepted` with a type match and raise their own domain fact alongside `outcome`, so other rulesets can react to `acl:role_changed` without knowing a Trust Task was involved. That keeps "rules have functionality; events do not."

### Sketch (illustrative, not final)

```krl
/** Change a member's role in this pico's ACL.
 * @trusttask https://trusttasks.org/spec/acl/change-role/0.1
 * @effect stateful
 */
rule change_role {
  select when trust_task accepted type re#/acl/change-role/0\.1$#
  pre {
    task = event:attr("task")
    subject = task{["payload", "subject"]}
    toRole = task{["payload", "toRole"]}
  }
  if subject && toRole then noop()
  fired {
    ent:roles{subject} := toRole
    raise acl event "role_changed" attributes {"subject": subject, "role": toRole}
    raise trust_task event "outcome" attributes {"id": task{"id"}, "payload": {}}
  } else {
    raise trust_task event "outcome" attributes {"id": task{"id"}, "error": "invalidPayload"}
  }
}
```

---

## 4. Binding: Trust Tasks over Sky

The framework requires each binding to specify carriage, identity mapping, consistency checks, thread correlation, security profile, deserialization order, error delivery, and lifecycle mapping. Draft answers:

| Concern | DIDComm (SKY) | HTTPS `/sky/event` |
|---------|---------------|--------------------|
| Carriage | Full Trust Task document as the DIDComm body (check for a published DTGWG DIDComm binding first and adopt it) | Document as the JSON body of `trust_task:received` on a task channel |
| `issuer` / `recipient` | Must agree with DIDComm `from` / `to` (did:peer of the relationship, or did:webvh for public intro) | Taken only from the document |
| Proof | Optional under authcrypt to the pico (document the security properties); required for anything a third party must verify later | **Required** |
| Threading | `thid` ↔ `threadId`, `pthid` ↔ `parentThreadId`; agree when both present | `threadId` only |
| Correlation inside the mesh | Task `id` used as the `rcn` / correlation id for callbacks | Same |
| Errors | `trust-task-error` document sent back on the relationship | Same, via the issuer's service endpoint; HTTP status says nothing about task state |

**Lifecycle mapping** (transport facts are not task states; a 202 is not `accepted`):

| Task state | Pico fact |
|------------|-----------|
| `received` | `trust_task:received` admitted by channel policy |
| `validated` | Binding finished envelope, payload schema, expiry, recipient, proof, duplicate-id checks |
| `accepted` | `trust_task:accepted` raised (authorization passed) |
| `executing` | A handler rule selected the accepted task |
| `suspended` | `trust_task:suspended` |
| `responded` / `errored` | `trust_task:responded` with a `#response` or `trust-task-error` |
| `cancelled` | `trust-task-control` cancel accepted; `effects` lists what already happened |
| `expired` | `expiresAt` passed. Checked when the task is admitted and again before commit; no `schedule` and hope |

Task state lives in the binding ruleset's entity variables (`ent:tasks{id}` with type, digest, state, thread), so it moves with the pico and survives a move. The duplicate-id rule needs the digest.

---

## 5. Discovery from schemas

- A handler declares the task type it serves with an annotation, e.g. `@trusttask <type URI>` (exact tag name TBD with [pico-schemas.md](./pico-schemas.md)).
- Wrangler answers `trust-task-discovery` from `channelSchema`, filtered by the channel the request came in on, exactly as MCP tools are. One source of truth for MCP tools, Home Assistant bindings, and Trust Task discovery.
- Ties to the planned DIDComm Discover Features work ([sky-didcomm-protocol.md §17](./sky-didcomm-protocol.md#17-didcomm-discover-features-planned)).
- Discovery is advisory: it never widens a channel's policy.

---

## 6. Authorization

- **Channel policy first.** Only channels meant for tasks admit `trust_task:received`. Per-type admission is a policy rule, not an `if` in KRL ("if a rule checks a caller's identity to decide what they may do, that decision probably belongs in a channel policy").
- **Relationships and credentials confer rights**, never the task document. A presented Authority or Delegation credential becomes an input to policy evaluation at the engine door (MEMORY §5 "Authorization": capabilities via VCs + relationship tags; Cedar/OPA still a candidate evaluator).
- **Side-effect classes in schemas.** Annotate handlers with the spec's class (e.g. `@effect destructive`). The binding re-checks authority before a destructive handler runs and can **suspend** it for step-up approval by the owner (passkey on the root pico, or an approver device).
- **Ceremony membership grants nothing.**

---

## 7. Control, suspension, and the harness

`trust-task-control` (cancel / suspend / resume) gives a standard shape to work that already exists in the harness design: the model **proposes**, the pico **decides**. An LLM-originated action becomes a task held in `suspended` until rules or a human approve it, and the response records who approved. A sub-actor pico running a model holds a **Delegation credential** from its owner's root pico, so what it may do is verifiable outside the mesh too.

---

## 8. Relationships as DTG credentials (wrangler)

| Pico construct | DTG credential |
|----------------|----------------|
| Relationship established | Relationship credential pair, one each direction, subjects = the two did:peer (or did:webvh) DIDs |
| Delegated admin relationship | Delegation credential (grant + acceptance) |
| Lending with reduced rights | Authority credential, attenuated from the owner's |
| Introduction pattern | Invitation credential |

Issued on establishment, revoked with the relationship. Because continuity lives in the SCID, the credentials remain valid after a pico moves; peers learn the new location through DIDComm DID Rotation.

---

## 9. Communities as VTCs (Manifold)

- A community pico issues **membership credentials**, publishes a **status list**, and keeps a **chained decision log**.
- Cross-community recognition is a **relationship between community picos**, not a shared directory. A community's trust registry is a statement published by that one pico; it must not grow into a map of everyone (Way of the Pico: picos should not serve as a central registry).
- Vocabulary (member, vetter, community) stays in `manifold-api`.

---

## 10. Beyond the engine

- **picolabs.io engine registry as a VTC:** registered engine operators are members; witness and watcher duties are tasks. Same open-source, multi-domain stance as the registry design.
- **External key custody:** a root pico could delegate signing to its owner's VTA (enclave-backed) and keep engine-held keys for ordinary picos.
- **Dogfooding:** Picolabs joins a VTC such as first.openvtc.net, with contributor commits signed and checked through VGI.

---

## 11. Layer placement

| Piece | Layer |
|-------|-------|
| `@trusttask` / `@effect` annotations, schema merge, step-up hook | Engine (schema) |
| Binding ruleset (`trust_task:*` events, validation, proof, state, responses), discovery responder | Wrangler-adjacent ruleset shipped with the engine |
| Relationship → DTG credential issuance, delegation credentials | Wrangler |
| Community as VTC, membership, status list, cross-community recognition | Manifold |
| Engine registry VTC | Separate service (registry repo) |

---

## 12. Possible phasing (when picked up)

| Phase | Scope |
|-------|-------|
| 0 | Track the spec (ceremonies, bindings); check for an official DIDComm binding |
| 1 | Binding ruleset over SKY/DIDComm and HTTPS; `@trusttask`; discovery from `channelSchema` |
| 2 | `@effect` classes; suspend / resume; step-up approval on the root pico; `trust-task-control` |
| 3 | DTG credential pairs on relationships; delegated admin as a Delegation credential |
| 4 | Manifold community as VTC; interop test against a VTI community |

---

## 13. Open questions

- Is there a DTGWG DIDComm v2 binding to adopt, or do we write one? Is a TSP binding worth doing given VTI defaults to TSP?
- Proof over authcrypt DIDComm: omit by default, or always sign so responses are evidence a third party can check later?
- Event names: `trust_task:outcome` vs a handler-specific completion fact the binding watches for.
- Should `received` map to its own channel per relationship (capability-style), or one task channel per pico with per-type policy?
- Mediators: SKY 1.0 excludes them, but picos behind NAT (a Pi) need delivery. Use VTI mediators, or let the engine mediate for its picos?
- VTI personas and "faces" vs per-relationship channels and child picos: same idea, different shape?
- Where do held credentials live: PDS, engine-owned identity state, or an external VTA vault?
- Should a task-handling transaction's log be hash-chained so a response can cite evidence (ceremony receipts)?
