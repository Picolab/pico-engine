# Managing channels

## What are pico channels?

A pico receives events and answers queries on its channels. A channel is one stream of communication with a pico, and a pico can have any number of them. Each channel has a policy that says which events and queries it accepts.

A channel is identified by its ECI (event channel identifier), a unique string such as `ckiz680qq000a7u2r8myeezof`. To use a channel you need only the ECI and the address of the pico's engine. Then you send events and queries to it [over HTTP](/exp/), or from KRL with `event:send` and `wrangler:picoQuery`. [Relationships](/wrangler/relationships) between picos are built on channels too.

## Why channels

Imagine a pico for a lamp. It lets some parties check whether the lamp is on, and others turn it on and off.

For each party that may control the lamp, the lamp pico makes a channel that accepts `lamp:on` and `lamp:off` events, and gives that party the ECI. For parties that may only check, it makes channels that allow only an `isLampOn` query.

Because each party has its own channel, the lamp pico can restrict or delete one party's channel, say one that flashes the light too fast, without affecting anyone else.

## Kinds of channels

Every channel has an ECI, one or more tags, and a policy. Tags are how you find a channel without knowing its ECI. The policy says what the channel may be used for. A pico's **Channels** tab in the developer UI lists them all.

### Family channels

Family channels have the tag `system`. They can only be used inside the engine, by the right pico, and they allow any event or query from it:

- **Self** (`system, self`): every pico has one, and its ECI is the pico's id. It identifies the pico.
- **Child** (`system, child`): every pico except the root has one. Its parent uses it to send this pico events and queries.
- **Parent** (`system, parent`): a pico has one for each child. The child uses it to reach its parent.

### Other channels Wrangler makes

Every pico also has these:

- **Developer UI** (`engine, ui`): what the developer UI uses for this pico. It allows the UI's own events and queries.
- **Discovery** (`discovery`): lets anyone ask what the pico can do.
- **DIDComm ingress** (`didcomm, ingress`): where DID-based relationship traffic from other engines arrives.
- **Well-known** (`wellknown_rx, tx_rx`): accepts requests for classic (ECI-based) relationships.
- **PDS** (`pds`): `pds` events and `io.picolabs.pds` queries; see [Pico data store](/wrangler/pds).

### External channels

Every other channel can be used by other picos on the same engine, picos on other engines, or any system on the internet. Each external channel defines an API for the pico: the rulesets installed decide what the pico can do, and the channel's policy decides how much of that this channel can reach.

## Creating a channel

### In the developer UI

The **Channels** tab has a form for a new channel: tags, an event policy, and a query policy. The engine assigns the ECI. Check the box beside a channel to see its policies.

For the lamp, one channel might allow `lamp:*` events, for trusted parties. Another might allow only the `isLampOn` query and could be shared more widely. If a party misbehaves, delete its channel and make a new one; give the new ECI only to the parties who should still have it.

### From KRL, synchronously

`wrangler:createChannel(tags, eventPolicy, queryPolicy)` creates a channel and returns it. The ruleset needs `use module io.picolabs.wrangler alias wrangler`.

```krl
rule create_limited_use_channel {
  select when lamp read_only_channel_needed
  pre {
    tags = ["lamp", "read-only"]
    eventPolicy = {"allow": [], "deny": [{"domain": "*", "name": "*"}]}
    queryPolicy = {"allow": [{"rid": meta:rid, "name": "isLampOn"}], "deny": []}
  }
  every {
    wrangler:createChannel(tags, eventPolicy, queryPolicy) setting(channel)
    send_directive("new channel", {"eci": channel{"id"}})
  }
}
```

The directive gives the new ECI to whoever sent the event: a trusted page, say, that builds a link for checking the lamp.

A ruleset often creates its channel when it's installed, from a rule that selects its own `wrangler:ruleset_installed`. See the [Bootstrap and channels](/cookbook/bootstrap/) demo, which also updates the channel instead of making a duplicate when the rule runs again.

### From KRL, asynchronously

Raise `wrangler:new_channel_request`. Any attributes you add are passed through to `wrangler:channel_created`, which carries the new `channel`:

```krl
raise wrangler event "new_channel_request" attributes {
  "tags": ["lamp", "read-only"],
  "eventPolicy": {"allow": [], "deny": [{"domain": "*", "name": "*"}]},
  "queryPolicy": {"allow": [{"rid": meta:rid, "name": "isLampOn"}], "deny": []},
  "co_id": meta:rid
}
```

```krl
rule on_new_channel {
  select when wrangler channel_created where event:attr("co_id") == meta:rid
  pre {
    channel = event:attr("channel").klog("New channel")
  }
  always {
    ent:read_only_eci := channel{"id"}
  }
}
```

The channel looks like this:

```json
{
  "id": "ckj081v5a0093fi2r9es49i77",
  "tags": ["lamp", "read-only"],
  "eventPolicy": {"allow": [], "deny": [{"domain": "*", "name": "*"}]},
  "queryPolicy": {"allow": [{"rid": "lamp_ruleset", "name": "isLampOn"}], "deny": []},
  "familyChannelPicoID": null
}
```

## Updating a channel

Sometimes a channel should change rather than be replaced: tighter or looser policies as trust changes, different tags, or the `oauth-webhook` tag for OAuth client credentials. Updating keeps the ECI, so anything that already uses the channel (links, relationships, stored credentials) keeps working.

Family channels (tagged `system`) can't be updated; the engine manages them. Channels you created can.

### In the developer UI

On the **Channels** tab, check the box beside a channel. Editable channels have an **Edit channel** form: tags (comma-separated, with a shortcut for `oauth-webhook`), and the event and query policies. With the `oauth-webhook` tag, a **Webhook OAuth** panel appears below the form, for creating credentials and minting tokens.

### From KRL, synchronously

`wrangler:updateChannel(eci, tags, eventPolicy, queryPolicy)` replaces the channel's tags and policies and returns the updated channel. All four arguments are required: it replaces, it doesn't merge, so pass the whole policies even to change one thing. This adds the `oauth-webhook` tag and keeps the rest:

```krl
rule protect_webhook_channel {
  select when myapp webhook_protection_needed
  pre {
    eci = event:attr("eci")
    chann = wrangler:channels().filter(function(c) { c{"id"} == eci }).head()
  }
  if chann then every {
    wrangler:updateChannel(eci, chann{"tags"}.append("oauth-webhook"), chann{"eventPolicy"}, chann{"queryPolicy"}) setting(updated)
    send_directive("channel updated", {"eci": updated{"id"}, "tags": updated{"tags"}})
  }
}
```

Adding `oauth-webhook` makes the channel require an access token. Until you create credentials for it, in the developer UI or with [`io.picolabs.oauth`](/wrangler/oauth), outside requests on it are refused.

### From KRL, asynchronously

Raise `wrangler:channel_update_request` with `eci`, `tags`, `eventPolicy`, and `queryPolicy`. Wrangler raises `wrangler:channel_updated`, with your attributes passed through and the updated `channel`.

### Update, or delete and recreate?

To revoke a party's access, deleting the channel and making a new one is simplest. To change what a channel allows, while the people using it keep using it, update it.

## Deleting a channel

`wrangler:deleteChannel(eci)` deletes a channel. Or raise `wrangler:channel_deletion_request` with its `eci`:

```krl
raise wrangler event "channel_deletion_request" attributes {"eci": old_eci, "co_id": meta:rid}
```

Wrangler raises `wrangler:channel_deleted` with the same attributes. To delete channels by their tags, find them first with `wrangler:channels(tags)`.

## Channel attributes

| Attribute | Meaning |
|-----------|---------|
| `id` | The ECI: a globally unique identifier. Anyone who knows it and can reach the engine can send the channel events and queries, so treat it as a capability |
| `tags` | One or more tags, for finding the channel. `wrangler:channels(tags)` finds the channels with exactly those tags |
| `eventPolicy` | Which events the channel accepts |
| `queryPolicy` | Which queries the channel accepts |

## Policies

A policy has an `allow` list and a `deny` list. An event policy's rules name a `domain` and a `name`; a query policy's rules name a `rid` and a `name`. Every rule needs both fields, and `"*"` matches anything. An event or query is accepted if it matches a rule in `allow` and none in `deny`. `deny` wins.

Allow only `foo:bar`:

```json
"eventPolicy": {
  "allow": [{"domain": "foo", "name": "bar"}],
  "deny": []
}
```

Allow every `foo` event except `foo:bar`, and also `aaa:bbb`:

```json
"eventPolicy": {
  "allow": [
    {"domain": "foo", "name": "*"},
    {"domain": "aaa", "name": "bbb"}
  ],
  "deny": [
    {"domain": "foo", "name": "bar"}
  ]
}
```

| Event | Result |
|-------|--------|
| `foo:foo`, `foo:wat` | Allowed |
| `foo:bar` | Denied: it matches `deny` |
| `aaa:bbb` | Allowed |
| `aaa:ccc`, `zzz:wat` | Denied: nothing in `allow` matches |

Allow everything except `system` events and `danger:nuke`:

```json
"eventPolicy": {
  "allow": [{"domain": "*", "name": "*"}],
  "deny": [
    {"domain": "system", "name": "*"},
    {"domain": "danger", "name": "nuke"}
  ]
}
```

Query policies work the same way, with `rid` instead of `domain`. A channel that allows everything:

```json
{
  "eventPolicy": {"allow": [{"domain": "*", "name": "*"}], "deny": []},
  "queryPolicy": {"allow": [{"rid": "*", "name": "*"}], "deny": []}
}
```

Give each channel the least it needs. A pico's schema can build a policy that allows exactly its documented API; see the [Bootstrap and channels](/cookbook/bootstrap/) demo and `wrangler:channelSchema(eci)`.

## Using channels

- **Over HTTP**: events at `/sky/event/<eci>/...` and queries at `/sky/query/<eci>/...`. See the [Event Exchange Protocol](/exp/).
- **`event:send`**, from KRL, to a channel on this engine or another.
- **`wrangler:picoQuery`**, from KRL, to call a function on another pico. See [The wrangler ruleset](/wrangler/wrangler).
- **The developer UI's Testing tab**, which sends events and queries on a channel you pick.
- **`raise`** in a postlude, which is handled on the same pico, as if it came in on the channel of the event being handled (`meta:eci`).

For every channel event and function, see the [wrangler API reference](/rulesets/io.picolabs.wrangler).
