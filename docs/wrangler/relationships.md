# Relationships

*For KRL developers and engine operators. Engine 1.6 and later (DID-based relationships); the classic ECI path is still supported. Ruleset: `io.picolabs.subscription`, installed on every pico.*

A relationship is a pairwise connection between two picos. Before engine 1.6.2, relationships were called subscriptions. Relationships are formed with `wrangler:relationship` (or the older `wrangler:subscription`). Their state lives in `io.picolabs.subscription`, which keeps that name for compatibility.

New rulesets can load it under the new name:

```krl
use module io.picolabs.subscription alias relationship
```

| Prefer (1.6.2 and later) | Still works |
|--------------------------|-------------|
| `wrangler:relationship` | `wrangler:subscription` |
| `relationship:established()` (module alias) | `subscription:established()` |
| The **Relationships** tab | The `/subscriptions` URL |

## What is a relationship?

The two picos in a relationship may be in the same mesh, in different meshes, or on different engines. A parent and its children talk through family channels and don't need one. Relationships are for picos that aren't related that way, such as your pico and a community pico, two peer meshes, or a service and its clients, so they can exchange events and queries under explicit channel policy.

Each side keeps a relationship record: who the other party is, how to reach it, and which local channel (`Rx`) enforces what the other party may do. A relationship goes from outbound pending (on the side that asked) and inbound pending (on the side asked) to established, when both sides agree.

## Identity: three identifiers

Since engine 1.6, relationships use two kinds of DID as well as ECIs:

| Identifier | Role | When you use it |
|------------|------|-----------------|
| `did:webvh` | The pico's portable identity: who the actor is | To start a DID-based relationship (`target_did`); public intro |
| `did:peer` | The relationship's private identity, for this pair | After the introduction is approved, for ongoing encrypted traffic |
| ECI (channel id) | The local policy gate on this engine | The `Rx` channel on each pico; the other side's `Tx` ECI in classic relationships |

New relationships use DIDs; ECIs are for existing applications. Use the `did:webvh` for introductions and `did:peer` for everything after. Don't start a new relationship with a peer DID or a well-known ECI.

Every pico publishes its `did:webvh` at `GET /picos/{picoId}/did.jsonl`. In KRL it's `wrangler:myDid()`; in the developer UI, it's in the **Relationships** tab's **Identity** panel. To be reached across meshes or engines by its DID, a pico needs **public intro** turned on.

## The lifecycle

| State | The side that asked | The side asked |
|-------|---------------------|----------------|
| Outbound pending | Waiting for the other side | — |
| Inbound pending | — | Approve or ignore |
| Established | Connected | Connected |

## DID-based relationships (recommended)

DID-based relationships are the default for new work. They form with an introduction handshake, and the established relationship stores `Tx_did` and `Rx_did` instead of the other side's ECI.

### Forming one

The side that asks raises `wrangler:relationship`:

| Attribute | Value |
|-----------|-------|
| `layer2` | `true` |
| `target_did` | The other pico's `did:webvh` (`wrangler:myDid()` there, or from its UI) |
| `name` | Optional label, shown in the established list |
| `Tx_role`, `Rx_role` | Optional roles: the other side's and this side's |
| `channel_type` | Usually `Tx_Rx` |

The side asked approves with `wrangler:pending_relationship_approval`, or by an auto-accept rule (see [Accepting relationship requests](/patterns_and_tips/accepting-relationship-requests)).

Don't pass `wellKnown_Tx` on a DID-based request, or a `did:peer`: the engine makes the pairwise DIDs during the introduction.

| You have the other pico's… | DID-based request | Classic request |
|-----------------------------|-------------------|-----------------|
| `did:webvh` | ✅ `target_did` | ❌ |
| `wellKnown_Rx` ECI | ❌ | ✅ `wellKnown_Tx` |
| `did:peer` | ❌ | ❌ |

On the same engine, the engine resolves the `did:webvh` locally and runs the introduction without HTTP.

### The established relationship

| Field | Meaning |
|-------|---------|
| `Id` | The relationship's id, the same on both sides |
| `name` | Its label |
| `layer2` | `true` |
| `Tx_did` | The other side's `did:peer` |
| `Rx_did` | This side's `did:peer` for this relationship |
| `Rx` | This side's ECI: where policy is enforced |
| `Tx_host` | Set when the other pico is on another engine |

### Sending queries and events

Query the other pico by DID, or through the relationship:

```krl
// By DID: wrangler finds the established relationship
wrangler:picoQuery(other_did, "io.picolabs.wrangler", "id", {})

// By relationship Id
relationship:queryOnSub(sub_id, "io.picolabs.wrangler", "id", {})
```

Send an event by DID, or with the relationship record:

```krl
event:send({"did": other_did, "domain": "myapp", "type": "ping", "attrs": {}})
event:send({"sub": bus, "domain": "myapp", "type": "ping", "attrs": {}})
```

For a DID-based relationship, the engine delivers locally when both picos are in the same mesh on this engine, and otherwise over DIDComm to the other pico's ingress.

## How traffic is routed

How a query or event reaches the other pico depends on three things: whether the relationship is DID-based or classic, whether the two picos are in the same mesh (the same passkey root on one engine), and whether the other pico is on this engine. Wherever it comes from, the other side's access is checked on this side's `Rx` channel.

| Relationship | Kind | Transport | Policy |
|--------------|------|-----------|--------|
| Parent and child | None (family) | Local | Family channel |
| Same mesh, same engine | DID-based or classic | Local | The relationship's `Rx` channel |
| Different meshes, same engine | DID-based | DIDComm to the ingress | The relationship's `Rx` channel |
| Different engines | DID-based | DIDComm to the other engine | The relationship's `Rx` channel |
| Classic | Classic | HTTP or `event:send` to `Tx` | `Tx` and `Rx` policies |

OAuth integrators are a separate path: HTTP to `/sky/*` with a bearer token, not a relationship.

To change what the other side may do, edit the `Rx` channel's policy on the **Channels** tab, or expand the relationship on the **Relationships** tab and follow its link to the channel.

## Across engines

- Each engine needs a stable address that the other can reach, `PICO_ENGINE_BASE_URL`. It is built into each pico's `did:webvh` when the pico is created.
- The side asked (often a root pico) has public intro on. Root picos default to on; child picos to off.
- The side that asks uses the other's `did:webvh` as `target_did`.

The handshake is the same as on one engine, but the introduction, its response, and the traffic after use encrypted DIDComm to `POST {peerBase}/sky/event/{ingressEci}/none/dido/didcomm_message`.

### Two engines on one machine

```sh
# Terminal 1
PICO_ENGINE_HOME=/tmp/pico-engine-a PORT=3001 npm start
# Terminal 2
PICO_ENGINE_HOME=/tmp/pico-engine-b PORT=3002 npm start
```

1. Register a passkey on both developer UIs.
2. On engine B, **Relationships** → **Identity**: copy the `did:webvh`.
3. On engine A, **Relationships** → **New relationship** (DID-based): paste B's DID and submit.
4. On B, under **Inbound pending**, approve it.
5. On A, the established relationship shows `Tx_did`, `Rx_did`, and `Tx_host`.

### Debugging

| Symptom | Check |
|---------|-------|
| The introduction never arrives | Public intro on the side asked; ports and firewalls |
| DID resolution failed | Fetch `{base}/picos/{id}/did.jsonl` |
| 401 on DIDComm | Approve the relationship again; check that the ingress channel exists |

## Classic (ECI-based) relationships

The original relationship model is still fully supported for existing rulesets and tutorials:

- The side asked has a well-known channel, `wellKnown_Rx` (shown in the **Identity** panel).
- The side that asks raises `wrangler:relationship` with `wellKnown_Tx` set to that ECI, and no `layer2`.
- The established relationship has `Tx` and `Rx` ECIs, and `layer2` is false.

The [Two picos talking](/cookbook/two_picos/) and [Collection](/cookbook/collection/) demos use classic relationships.

## The Relationships tab

The developer UI's **Relationships** tab manages a pico's relationships:

- **Identity**: the pico's `did:webvh`, with a copy button; the classic `wellKnown_Rx` ECI; and the **Public intro** checkbox.
- **Established**, **Inbound pending**, and **Outbound pending** lists. Expand a row to see its DIDs and `Rx` policy, send a test event, approve, cancel, or delete it.
- **New relationship**: DID-based or classic, with `target_did` or `wellKnown_Tx`, `name`, `Rx_role`, `Tx_role`, `channel_type`, and an optional password.

Give relationships names, so the lists stay readable. The `Id` is still shown, for debugging.

## The KRL API

Relationships live in two rulesets on every pico. `io.picolabs.subscription` keeps the relationship records and runs most of the lifecycle. `io.picolabs.wrangler` has the identity functions and `picoQuery`. You raise `wrangler` events to create, approve, and cancel relationships, and query `io.picolabs.subscription` for their state.

### Identity

| Function or event | Purpose |
|-------------------|---------|
| `wrangler:myDid()` | This pico's `did:webvh`: give it to the other side as its `target_did` |
| `wrangler:publicIntro()` | Whether this pico accepts introductions on its DID |
| `wrangler:set_public_intro` event, with `enabled` | Turn public intro on or off |
| `wrangler:callerDid()` | On an incoming cross-pico event, the sender's `did:webvh`, when the engine has it |

### Reading relationships

| Function | Returns |
|----------|---------|
| `relationship:established()` | The established relationships |
| `relationship:established("Tx_role", "owner")` | Only those whose field matches (any field works) |
| `relationship:inbound()` | Requests waiting for this pico's approval |
| `relationship:outbound()` | Requests waiting for the other side |
| `relationship:wellKnown_Rx()` | The well-known channel, for classic relationships |
| `relationship:autoAcceptConfig()` | The auto-accept rules |

Each relationship is a map with `Id`, `name`, `Tx_role`, `Rx_role`, the local `Rx`, and either `Tx_did` and `Rx_did` (DID-based) or `Tx` and `Tx_host` (classic).

### Creating a relationship

DID-based:

```krl
raise wrangler event "relationship" attributes {
  "layer2": true,
  "target_did": other_did,
  "name": "battery-monitor",
  "Rx_role": "sensor",
  "Tx_role": "controller",
  "channel_type": "Tx_Rx"
}
```

Classic:

```krl
raise wrangler event "relationship" attributes {
  "wellKnown_Tx": other_well_known_eci,
  "name": "legacy-link",
  "Rx_role": "client",
  "Tx_role": "server"
}
```

Either takes an optional `password`, if the other side's auto-accept configuration uses one. The relationship ruleset creates the local `Rx` channel, records the outbound request, and runs the handshake.

### Approving, rejecting, and canceling

| Event | When | Key attributes |
|-------|------|----------------|
| `wrangler:pending_relationship_approval` | Accept an inbound request | `Id` (or `Rx` or `Tx`) |
| `wrangler:inbound_rejection` | Decline an inbound request | `Id` |
| `wrangler:outbound_cancellation` | Withdraw an outbound request | `Id` |
| `wrangler:relationship_cancellation` | End an established relationship | `Id` |

Each raises companion events that other rulesets can select, such as `wrangler:relationship_added` and `wrangler:relationship_removed` (and their older names, `subscription_added` and `subscription_removed`).

### Talking to the other pico

1. `wrangler:picoQuery(target, rid, name, args)`, where the target is a `did:webvh`, a `did:peer`, or a classic `Tx` ECI. The engine finds the established relationship and routes the query.
2. `relationship:queryOnSub(Id, rid, name, args)`, by relationship `Id`.
3. `event:send({"did": ..., ...})` or `event:send({"sub": relationship, ...})`.
4. To several relationships at once, raise `wrangler:send_event_on_subs` with a `subID`, or a `Tx_role` or `Rx_role`, and the `domain`, `type`, and `attrs` to send.

### Quick reference

| Goal | API |
|------|-----|
| This pico's portable DID | `wrangler:myDid()` |
| List established relationships | `relationship:established()` |
| Start a DID-based relationship | `wrangler:relationship` with `layer2` and `target_did` |
| Start a classic relationship | `wrangler:relationship` with `wellKnown_Tx` |
| Approve a request | `wrangler:pending_relationship_approval` with `Id` |
| End a relationship | `wrangler:relationship_cancellation` with `Id` |
| Query the other pico | `wrangler:picoQuery(did, rid, name, args)` or `relationship:queryOnSub(...)` |
| Send it an event | `event:send({"did": ...})` or `event:send({"sub": relationship, ...})` |

Authorization is the same for both kinds: the other side's access is enforced on your `Rx` channel's event and query policy. DID-based relationships change how messages are addressed, not who is allowed.

## Public intro

Public intro decides whether a pico accepts an unsolicited introduction: someone starting a DID-based relationship by sending an introduction to its `did:webvh`, without a well-known channel. That matters across engines and meshes, where the asking side may know only the DID. With public intro off, the engine drops the introduction, and it never reaches the inbound pending list.

It answers "may strangers introduce themselves by DID?" It doesn't replace approval: after an introduction arrives, you still approve it (unless auto-accept matches), and the `Rx` policy still governs what the other pico may do.

Root picos default to on, so other engines can reach your mesh's root by DID. Child picos default to off.

| How | What to do |
|-----|------------|
| Developer UI | **Relationships** → **Identity** → **Public intro** |
| Query | `wrangler:publicIntro()` |
| Event | `raise wrangler event "set_public_intro" attributes {"enabled": true}` |

Leave it on for root picos that should receive requests from other engines, and for picos that partners will reach by DID. Turn it off for picos that should be reached only through their parent or a classic well-known channel, or that you don't want to be discoverable by DID.

Once a DID-based relationship is established, public intro can be turned off: the relationship uses its `did:peer` from then on.

## Roles and policy

`Tx_role` and `Rx_role` describe each side's part, such as `controller` or `member`. They label relationships; they don't prove anything. Authorization is the local `Rx` channel's policy, as it always was. Frameworks such as Manifold confer rights through relationships plus channel policy; DID-based relationships change how you address the other pico, not how policy works.

## Not yet implemented

- Migrating classic relationships to DID-based ones automatically (create new relationships instead)
- Authorization based on verifiable credentials over relationships
- `did:peer:4` (engine 1.6 uses `num_algo` 2)

Moving a pico to another engine is implemented: its `did:webvh` and its DID-based relationships move with it. See [Portable subtrees](/wrangler/portable-subtree).

## Related pages

- [Engine 1.6 release notes](/release/1.6)
- [Managing channels](/wrangler/channels): `Rx` policy
- [Identity libraries](/design/pico-identity-libraries) and [relationships design](/design/pico-relationships)
- [SKY over DIDComm](/design/sky-didcomm-protocol)
