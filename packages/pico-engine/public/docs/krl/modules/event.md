# event

The `event` module provides access to the current executing event. These return `null` if the code is running when there is no event i.e. query.

## event:eci

Get the event channel id. `String` or `null`

## event:domain

Get the event domain. `String` or `null`

## event:name

Get the event name. `String` or `null`

## event:attrs

Get the event attributes. `Map` or `null`

## event:eid

Get the event transaction id. `String` or `null`

## event:time

Get the event timestamp as number of milliseconds since epoch. `Number` or `null`

## event:send

Send an event to another pico. Action.

```krl
event:send({
  "eci": "<channel id>",           // local or remote ECI
  "domain": "wrangler",
  "type": "ping",                  // alias: "name"
  "attrs": { "key": "value" }
}, host)                           // optional host for remote ECI
```

**Layer 2 (1.6+) — send by DID** (requires an established layer2 subscription):

```krl
event:send({
  "did": "did:peer:2....",         // or did:webvh:...
  "domain": "wrangler",
  "type": "ping",
  "attrs": {}
})
```

**Layer 2 — send via subscription bus record** (from `subscription:established()` etc.):

```krl
event:send({
  "sub": bus,                      // established subscription map
  "domain": "wrangler",
  "type": "ping",
  "attrs": {}
})
```

When `bus.layer2` is true, routing uses `Tx_did` and DIDComm (or verified local dispatch on the same engine). Legacy subscriptions use `bus.Tx` and optional `bus.Tx_host` as before.

## event:attr

Get a single attribute by name. `Function(name)` → value or `null`
