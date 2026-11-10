# io.picolabs.subscription

Pico-to-pico relationships (Tx/Rx). User-facing term: relationship.  
Ruleset RID io.picolabs.subscription is stable; prefer module alias relationship.

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Operations:** [wrangler:cancel_subscriptions](#wranglercancel_subscriptions) · [wrangler:subscription](#wranglersubscription--wranglerrelationship) · [wrangler:pending_subscription_approval](#wranglerpending_subscription_approval--wranglerpending_relationship_approval) · [wrangler:subscription_cancellation](#wranglersubscription_cancellation--wranglerrelationship_cancellation) · [wrangler:inbound_rejection](#wranglerinbound_rejection--wranglerinbound_relationship_rejection) · [wrangler:outbound_cancellation](#wrangleroutbound_cancellation--wrangleroutbound_relationship_cancellation) · [wrangler:send_event_on_subs](#wranglersend_event_on_subs--wranglersend_event_on_relationships) · [wrangler:autoAcceptConfigUpdate](#wranglerautoacceptconfigupdate)  
**Queries:** [established](#establishedkey-value--array) · [outbound](#outboundkey-value--array) · [inbound](#inboundkey-value--array) · [wellKnown_Rx](#wellknown_rx--map) · [autoAcceptConfig](#autoacceptconfig--map) · [queryOnSub](#queryonsubsubid-rid-name-args--any)

## Operations

Events you can send to a pico with this ruleset installed. Whether an operation acts, and what it emits, depends on its condition and the pico's state when the event arrives.

### `wrangler:cancel_subscriptions`

Cancel every relationship this pico has: established ones are cancelled, inbound requests rejected, and outbound requests withdrawn, notifying the other picos. Used before deleting a pico.

**Send:** `wrangler:cancel_subscriptions`  
**Rule:** `cancel_all_subscriptions`

No attributes.

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:cancel_relationships` on this pico — always

<details><summary>Select expression</summary>

```krl
select when wrangler cancel_subscriptions
```

</details>

### `wrangler:subscription` · `wrangler:relationship`

Request a relationship with another pico. Legacy (default): give the other pico's well-known channel as wellKnown_Tx. Layer 2: set layer2 true and give the other pico's DID as target_did; the request goes over DIDComm. The request is recorded in outbound() until the other side approves (or auto-accepts), then moves to established() and wrangler:subscription_added is raised. A request to this pico itself, or one missing wellKnown_Tx / target_did, raises self_relationship_failure, wellKnown_Tx_format_failure, or target_did_format_failure instead.

**Send:** `wrangler:subscription`, or `wrangler:relationship`  
**Rule:** `createRxBus`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `wellKnown_Tx` | String | no | legacy: the other pico's well-known channel id (its wellKnown_Rx) |
| `layer2` | Boolean | no | true for a DID-based Layer 2 relationship |
| `target_did` | String | no | Layer 2: the other pico's DID |
| `name` | String | no | relationship name (random word if omitted) |
| `Rx_role` | String | no | this pico's role in the relationship |
| `Tx_role` | String | no | the other pico's role |
| `channel_type` | String | no | channel type for the new channel (default Tx_Rx) |
| `Tx_host` | String | no | legacy: the other pico's engine URL, if on a different engine |
| `password` | String | no | for the other pico's auto-accept config |
| `Id` | Any | no |  |
| `picoID` | Any | no |  |

**Examples:**

- **same engine:** `{"wellKnown_Tx":"<eci>"}`
- **same engine, with roles:** `{"wellKnown_Tx":"<eci>","name":"<name>","Rx_role":"<my role>","Tx_role":"<their role>"}`
- **another engine:** `{"wellKnown_Tx":"<eci>","Tx_host":"https://other.example"}`
- **auto-accept password:** `{"wellKnown_Tx":"<eci>","password":"<password>"}`
- **Layer 2:** `{"layer2":true,"target_did":"<did>"}`

**Acts when:** `not layer2 && pending_entry{"wellKnown_Tx"} && (pending_entry{"wellKnown_Tx"} != wellKnown_Rx(){"id"})`

**May emit** (possible, not guaranteed):

- raises `wrangler:subscription_request_needed` on this pico — when it acts
- raises `wrangler:outbound_pending_subscription_added` on this pico — when it acts
- raises `wrangler:outbound_pending_relationship_added` on this pico — when it acts

**Other rules on the same event:**

- `createRxBusLegacySelfFailure` — selects only `wrangler subscription where (not event:attr("layer2") == true) && (event:attr("wellKnown_Tx") == wellKnown_Rx(){"id"}) or wrangler relationship where (not event:attr("layer2") == true) && (event:attr("wellKnown_Tx") == wellKnown_Rx(){"id"})`
- `createRxBusLegacyFailure` — acts when `not layer2 && not hasWellKnown`
- `createRxBusLayer2` — acts when `layer2 && target_did && (target_did != wrangler:myDid())`
- `createRxBusLayer2SelfFailure` — selects only `wrangler subscription where (event:attr("layer2") == true) && (event:attr("target_did") == wrangler:myDid()) or wrangler relationship where (event:attr("layer2") == true) && (event:attr("target_did") == wrangler:myDid())`
- `createRxBusLayer2Failure` — acts when `layer2 && not target_did`

<details><summary>Select expression</summary>

```krl
select when wrangler subscription
    or
    wrangler relationship
```

</details>

### `wrangler:pending_subscription_approval` · `wrangler:pending_relationship_approval`

Approve a pending inbound relationship request (one listed in inbound()). The requesting pico is notified, and both sides raise wrangler:subscription_added once it is established. Works for legacy and Layer 2 requests.

**Send:** `wrangler:pending_subscription_approval`, or `wrangler:pending_relationship_approval`  
**Rule:** `approveInboundPendingSubscription`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Id` | String | no | relationship id; or identify it by Rx or Tx instead |
| `Rx` | String | no | this pico's channel for the relationship |
| `Tx` | String | no | the other pico's channel for the relationship |

**Examples:**

- **by id:** `{"Id":"<relationship id>"}`

**Acts when:** `(not bus{"layer2"} == true) && bus`

**May emit** (possible, not guaranteed):

- sends `wrangler:outbound_pending_subscription_approved` to `bus{"Tx"}`
- raises `wrangler:inbound_pending_subscription_approved` on this pico — when it acts
- raises `wrangler:inbound_pending_relationship_approved` on this pico — when it acts

**Other rules on the same event:**

- `approveInboundPendingSubscriptionLayer2` — acts when `bus{"layer2"} == true`

<details><summary>Select expression</summary>

```krl
select when wrangler pending_subscription_approval
    or
    wrangler pending_relationship_approval
```

</details>

### `wrangler:subscription_cancellation` · `wrangler:relationship_cancellation`

End an established relationship. It is removed on both picos, and the other pico is notified (over DIDComm for Layer 2). wrangler:subscription_removed is raised when done.

**Send:** `wrangler:subscription_cancellation`, or `wrangler:relationship_cancellation`  
**Rule:** `cancelEstablished`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Id` | String | no | relationship id; or identify it by Rx or Tx instead |
| `Rx` | String | no | this pico's channel for the relationship |
| `Tx` | String | no | the other pico's channel for the relationship |

**Examples:**

- **by id:** `{"Id":"<relationship id>"}`
- **by this pico's channel:** `{"Rx":"<eci>"}`

**Acts when:** `(not bus{"layer2"} == true) && bus`

**May emit** (possible, not guaranteed):

- sends `wrangler:established_removal` to `bus{"Tx"}`
- raises `wrangler:established_removal` on this pico — when it acts

**Other rules on the same event:**

- `cancelEstablishedLayer2` — acts when `bus{"layer2"} == true`

<details><summary>Select expression</summary>

```krl
select when wrangler subscription_cancellation
    or
    wrangler relationship_cancellation
```

</details>

### `wrangler:inbound_rejection` · `wrangler:inbound_relationship_rejection`

Reject a pending inbound relationship request (one listed in inbound()). The requesting pico is notified and removes it from its outbound().

**Send:** `wrangler:inbound_rejection`, or `wrangler:inbound_relationship_rejection`  
**Rule:** `cancelInbound`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Id` | String | no | relationship id; or identify it by Rx or Tx instead |
| `Rx` | String | no | this pico's channel for the relationship |
| `Tx` | String | no | the other pico's channel for the relationship |

**Examples:**

- **by id:** `{"Id":"<relationship id>"}`

**Acts when:** `(not bus{"layer2"} == true) && bus`

**May emit** (possible, not guaranteed):

- sends `wrangler:outbound_removal` to `bus{"Tx"}`
- raises `wrangler:inbound_removal` on this pico — always

**Other rules on the same event:**

- `cancelInboundLayer2` — acts when `bus{"layer2"} == true`

<details><summary>Select expression</summary>

```krl
select when wrangler inbound_rejection
    or
    wrangler inbound_relationship_rejection
```

</details>

### `wrangler:outbound_cancellation` · `wrangler:outbound_relationship_cancellation`

Withdraw a relationship request this pico sent that hasn't been approved yet (one listed in outbound()). The other pico is notified and removes it from its inbound().

**Send:** `wrangler:outbound_cancellation`, or `wrangler:outbound_relationship_cancellation`  
**Rule:** `cancelOutbound`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `Id` | String | no | relationship id; or identify it by Rx or Tx instead |
| `Rx` | String | no | this pico's channel for the relationship |
| `Tx` | String | no | the other pico's channel for the relationship |

**Examples:**

- **by id:** `{"Id":"<relationship id>"}`

**Acts when:** `(not bus{"layer2"} == true) && bus`

**May emit** (possible, not guaranteed):

- sends `wrangler:inbound_removal` to `bus{"wellKnown_Tx"}`
- raises `wrangler:outbound_removal` on this pico — always

**Other rules on the same event:**

- `cancelOutboundLayer2` — acts when `bus{"layer2"} == true`

<details><summary>Select expression</summary>

```krl
select when wrangler outbound_cancellation
    or
    wrangler outbound_relationship_cancellation
```

</details>

### `wrangler:send_event_on_subs` · `wrangler:send_event_on_relationships`

Send an event to the picos at the other end of established relationships, selected by relationship id and/or by role. Each match receives the event on its channel (over DIDComm for Layer 2). If nothing matches, or domain or type is missing, raises wrangler:failed_to_send_event_to_relationship instead.

**Send:** `wrangler:send_event_on_subs`, or `wrangler:send_event_on_relationships`  
**Rule:** `sendEventToSubCheck`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | String | yes | domain of the event to send |
| `type` | String | yes | type of the event to send |
| `attrs` | Map | no | attributes of the event to send |
| `subID` | String | no | send on this relationship |
| `Tx_role` | String | no | send on every relationship where the other pico has this role |
| `Rx_role` | String | no | send on every relationship where this pico has this role |

**Examples:**

- **one relationship:** `{"subID":"<relationship id>","domain":"<domain>","type":"<type>","attrs":{}}`
- **everyone with a role:** `{"Tx_role":"<their role>","domain":"<domain>","type":"<type>","attrs":{}}`

**Acts when:** `(subs.length() > 0) && event:attr("domain") && event:attr("type")`

**May emit** (possible, not guaranteed):

- raises `wrangler:send_event_to_subs` on this pico — when it acts
- raises `wrangler:failed_to_send_event_to_sub` on this pico — when it doesn't act
- raises `wrangler:failed_to_send_event_to_relationship` on this pico — when it doesn't act

<details><summary>Select expression</summary>

```krl
select when wrangler send_event_on_subs
    or
    wrangler send_event_on_relationships
```

</details>

### `wrangler:autoAcceptConfigUpdate`

Add, replace, or delete an auto-accept config. An incoming relationship request is approved automatically when, for any config, one of its entries matches: an entry maps an attr name to a list of regexes, and matches when the request's attr matches any of them. Give the whole config as config, or its parts as configName, regexMap, and password. Raises wrangler:auto_accept_config_updated, or autoAcceptConfigUpdate_failure when there is no config name.

**Send:** `wrangler:autoAcceptConfigUpdate`  
**Rule:** `autoAcceptConfigUpdate`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `configName` | String | no | name of the config to set or delete |
| `regexMap` | String | no | the entries, JSON-encoded: { <attr>: [regex, …] } |
| `config` | Map | no | the whole config instead: { configName, password, entries } |
| `password` | String | no | stored with the config; not currently checked |
| `delete` | Boolean | no | true to delete the named config |

**Examples:**

- **accept a role:** `{"config":{"configName":"<name>","entries":{"Tx_role":["^<role>$"]}}}`
- **delete:** `{"configName":"<name>","delete":true}`

**Acts when:** `givenName.klog("configName")`

**May emit** (possible, not guaranteed):

- raises `wrangler:auto_accept_config_updated` on this pico — when it acts
- raises `wrangler:autoAcceptConfigUpdate_failure` on this pico — when it doesn't act

<details><summary>Select expression</summary>

```krl
select when wrangler autoAcceptConfigUpdate
```

</details>

## Queries

### `established(key?, value?)` → Array

Established relationships, optionally only those whose field `key` equals `value` (e.g. key "Tx_role", value "manifold_thing"). Each has Id, Rx (this pico's channel), Tx (the other pico's channel), roles, name, and, for Layer 2 relationships, layer2 and the peer DIDs.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | String | no |  | field to filter on, e.g. Id, Tx_role, Rx_role |
| `value` | Any | no |  | value the field must equal |

**Examples:**

- **all:** `{}`
- **by role:** `{"key":"Tx_role","value":"<their role>"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/established?key=…&value=…`, or `<alias>:established(key?, value?)` from KRL with `use module io.picolabs.subscription alias <alias>`

### `outbound(key?, value?)` → Array

Relationship requests this pico has sent that are still waiting for the other side to approve. Optional filter as for established().

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | String | no |  | field to filter on |
| `value` | Any | no |  | value the field must equal |

**Examples:**

- **all:** `{}`
- **by id:** `{"key":"Id","value":"<relationship id>"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/outbound?key=…&value=…`, or `<alias>:outbound(key?, value?)` from KRL with `use module io.picolabs.subscription alias <alias>`

### `inbound(key?, value?)` → Array

Relationship requests other picos have sent to this one that are waiting for approval (approve with wrangler:pending_relationship_approval). Optional filter as for established().

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | String | no |  | field to filter on |
| `value` | Any | no |  | value the field must equal |

**Examples:**

- **all:** `{}`
- **by id:** `{"key":"Id","value":"<relationship id>"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/inbound?key=…&value=…`, or `<alias>:inbound(key?, value?)` from KRL with `use module io.picolabs.subscription alias <alias>`

### `wellKnown_Rx()` → Map

This pico's well-known channel: the one other picos send relationship requests to (give its id as wellKnown_Tx when requesting a relationship with this pico).

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/wellKnown_Rx`, or `<alias>:wellKnown_Rx()` from KRL with `use module io.picolabs.subscription alias <alias>`

### `autoAcceptConfig()` → Map

Auto-accept rules for incoming relationship requests, keyed by config name. A request is accepted automatically when any config's entries match: each entry maps an attr name to a list of regexes tested against that attr.

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/autoAcceptConfig`, or `<alias>:autoAcceptConfig()` from KRL with `use module io.picolabs.subscription alias <alias>`

### `queryOnSub(subId, rid, name, args)` → Any

Query a function on the pico at the other end of an established relationship. Layer 2 relationships go over DIDComm (or verified local dispatch); legacy ones query the other pico's Tx channel. Null if no relationship has that id.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `subId` | String | yes |  | relationship id |
| `rid` | String | yes |  | ruleset id on the other pico |
| `name` | String | yes |  | shared function to call |
| `args` | Map | yes |  | arguments for the function |

**Examples:**

- **other pico's name:** `{"subId":"<relationship id>","rid":"io.picolabs.wrangler","name":"name"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.subscription/queryOnSub?subId=…&rid=…&name=…&args=…`, or `<alias>:queryOnSub(subId, rid, name, args)` from KRL with `use module io.picolabs.subscription alias <alias>`
