# The wrangler ruleset

`io.picolabs.wrangler` manages a pico's life cycle: its child picos, the rulesets installed in it, and its channels. It also has the functions rulesets use to learn about the pico and to query other picos. For every event and function, see the [API reference](/rulesets/io.picolabs.wrangler). For what Wrangler is as a whole, see [Wrangler](/wrangler/).

The examples assume the ruleset uses Wrangler as a module:

```krl
meta {
  use module io.picolabs.wrangler alias wrangler
}
```

## Pico life cycle

The engine creates the first pico, the root pico, when it starts for the first time. Any pico can create child picos, and a pico can delete its children. The root pico can't be deleted.

### Creating a child pico

Raise `wrangler:new_child_request` in the pico that will be the parent, with a `name` and, optionally, a `backgroundColor` for the developer UI:

```krl
raise wrangler event "new_child_request" attributes {"name": "Kitchen", "task_id": "42"}
```

Wrangler's `createChild` rule creates the child pico with the developer UI ruleset and Wrangler installed, then sends the child three events in order:

1. `engine_ui:setup`: the developer UI ruleset creates the channel the UI uses for this pico.
2. `wrangler:pico_created`: Wrangler on the child records its name, parent, and id, and installs `io.picolabs.pds` and `io.picolabs.subscription`.
3. `engine_ui:box`: the UI ruleset stores the name and color the developer UI shows.

Then, in the parent, Wrangler raises `wrangler:new_child_created`, with the child's family channel (`eci`) and its UI channel (`uiEci`). When the child has finished setting up, it raises `wrangler:pico_initialized` for itself and sends `wrangler:child_initialized` to its parent.

Any other attributes on the request (`task_id` above) are passed through: they arrive on the child with `pico_created`, and come back to the parent with `new_child_created` and `child_initialized`. That's how a parent tells its new children apart. The parent selects `child_initialized` with a `where` on its own attribute, and gets the child's `eci` to send it more events, such as an `install_ruleset_request`. See the [Child pico tasks](/cookbook/child_tasks/) demo.

`new_child_request` also takes an optional `policyCeiling`: a map that limits the channel policies the child may ever have. It can't exceed the parent's own ceiling.

The developer UI's **About** tab creates children the same way: it sends `engine_ui:new`, which raises `wrangler:new_child_request`.

### While a pico exists

| Function | Returns |
|----------|---------|
| `parent_eci()` | The family channel this pico uses to reach its parent. `null` on the root pico |
| `children()` | An array of maps, one per child: `{"eci": ..., "name": ..., "parent_eci": ...}`. `eci` is this pico's family channel to the child |
| `myself()` | `{"name": ..., "id": ..., "eci": ...}` for this pico |
| `name()`, `id()` | This pico's name and id |
| `myDid()`, `publicIntro()` | This pico's portable `did:webvh`, and whether it accepts introductions on it. See [Relationships](/wrangler/relationships) |

`wrangler:name_changed` with a `name` changes the pico's name.

### Deleting a pico

A pico can only be deleted by its parent. A rule in the parent raises `wrangler:child_deletion_request` with `eci` set to the child's family channel, from `children()`:

```krl
raise wrangler event "child_deletion_request" attributes {"eci": child{"eci"}}
```

The child and all its descendants are deleted, and Wrangler raises `wrangler:child_deleted` in the parent with the same attributes.

A pico can ask to be deleted by raising `wrangler:ready_for_deletion`. Wrangler sends its parent the `child_deletion_request` for it. Finish any work in progress and release what the pico holds first.

There's no undo. When a pico is deleted, its state, channels, and relationships are gone.

The root pico can't be deleted. The only way to remove every pico, the root included, is to stop the engine and remove its database, `db/` in the engine's home directory (`~/.pico-engine` by default). That also removes passkey registrations and every pico's identity. The next start creates a new root pico, and the first visit registers a new passkey. Use it only as a last resort.

### Life cycle events

Events Wrangler selects:

| Event | Sent by | Attributes |
|-------|---------|------------|
| `wrangler:new_child_request` | The developer UI or a ruleset | `name`; optional `backgroundColor`, `policyCeiling`, and any others to pass through |
| `wrangler:pico_created` | Wrangler, to the new child (not for rulesets) | Those of the request |
| `wrangler:child_deletion_request` | The developer UI, a ruleset, or Wrangler on a child | `eci`, the family channel to the child |
| `wrangler:ready_for_deletion` | A ruleset on the pico to delete | None |
| `wrangler:name_changed` | A ruleset | `name` |

Events Wrangler raises:

| Event | Where | Attributes |
|-------|-------|------------|
| `wrangler:new_child_created` | In the parent | Those of the request, plus the child's `eci` and `uiEci` |
| `wrangler:pico_initialized` | In the child | Those of the request, plus the child's `eci` |
| `wrangler:child_initialized` | Sent from the child to the parent | Those of the request, plus `eci` |
| `wrangler:child_deleted` | In the parent | Those of the deletion request |

## Channels

A pico can have as many channels as it needs, and only a pico can create and delete its own. Channels and their policies are explained in [Managing channels](/wrangler/channels). This section is the Wrangler API for them.

### Creating a channel

`createChannel(tags, eventPolicy, queryPolicy)` is an action that creates a channel and returns it. Its `id` is the channel's ECI:

```krl
rule initialize {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  if ent:app_eci.isnull() then
    wrangler:createChannel(
      ["myapp", "app"],
      {"allow": [{"domain": "myapp", "name": "*"}], "deny": []},
      {"allow": [{"rid": meta:rid, "name": "*"}], "deny": []}
    ) setting(channel)
  fired {
    ent:app_eci := channel{"id"}
  }
}
```

Or raise `wrangler:new_channel_request` with `tags`, `eventPolicy`, and `queryPolicy`. When the channel exists, Wrangler raises `wrangler:channel_created` with the request's attributes plus `channel`, the new channel. Add an attribute of your own to recognize your channel when the event arrives:

```krl
rule ask_for_channel {
  select when myapp channel_needed
  always {
    raise wrangler event "new_channel_request" attributes {
      "tags": ["myapp", "app"],
      "eventPolicy": {"allow": [{"domain": "myapp", "name": "*"}], "deny": []},
      "queryPolicy": {"allow": [{"rid": meta:rid, "name": "*"}], "deny": []},
      "for_rid": meta:rid
    }
  }
}

rule remember_channel {
  select when wrangler channel_created where event:attr("for_rid") == meta:rid
  always {
    ent:app_eci := event:attr("channel"){"id"}
  }
}
```

### Finding channels

`channels()` returns all of this pico's channels. `channels(tags)` returns the channels whose tags are exactly those, in any order and case. The tags can be an array or a comma-separated string. This finds the family channel by which the pico's parent knows it:

```krl
my_child_eci = wrangler:channels("system,child").head(){"id"}
```

`discoveryChannel()` returns the pico's `discovery` channel, which every pico has, for finding out what a pico can do.

### Updating a channel

`updateChannel(eci, tags, eventPolicy, queryPolicy)` replaces a channel's tags and policies and keeps its ECI, so anything that already uses the channel keeps working. Pass the whole policy, not just the change. Or raise `wrangler:channel_update_request` with the same four attributes, and Wrangler raises `wrangler:channel_updated` with the updated `channel`.

### Deleting a channel

`deleteChannel(eci)` deletes a channel. Or raise `wrangler:channel_deletion_request` with the `eci`, and Wrangler raises `wrangler:channel_deleted` with the request's attributes.

### Rotating a channel

If a channel's ECI is being misused, replace it: make a channel with the same tags and policies, give the new ECI to the parties who should have it, and delete the old one. The old ECI then stops working.

```krl
rule rotate_channel {
  select when myapp rotation_needed
  pre {
    old = wrangler:channels(["myapp", "app"]).head()
  }
  if old then every {
    wrangler:createChannel(old{"tags"}, old{"eventPolicy"}, old{"queryPolicy"}) setting(channel)
    wrangler:deleteChannel(old{"id"})
    send_directive("rotated", {"eci": channel{"id"}})
  }
}
```

To change what a channel allows without changing its ECI, update it instead. Pico views have a helper for rotating an app channel, `ui:rotate_app_channel(tags)`; see [Pico views](/pico-views).

## Rulesets

A pico's behavior and state come from its rulesets. A ruleset is KRL source at a URL: `https://`, `file://` on the engine's machine, or the engine's own `/krl/` and `/krl/demos/` paths.

### Installing a ruleset

Raise `wrangler:install_ruleset_request` in one of two forms:

- With `url`: install the KRL at that URL.
- With `absoluteURL` and `rid`: install `<rid>.krl` from the same folder as `absoluteURL`. Pass `meta:rulesetURI` to install a ruleset that sits next to the one asking. An app of several rulesets can be installed this way by a single bootstrap ruleset; see the [Bootstrap and channels](/cookbook/bootstrap/) demo.

Either form takes an optional `config` map, which the installed ruleset reads as `meta:rulesetConfig`, and others can read with `wrangler:rulesetConfig(rid)`.

The engine fetches and compiles the source before installing it. If it doesn't compile, Wrangler raises `wrangler:ruleset_install_failed` with the `url`, `rid`, and the compiler's `errors` and `warnings`. If it installs, and the ruleset wasn't already on this pico, Wrangler raises `wrangler:ruleset_installed` with `rids`, an array holding the installed rid. Installing a ruleset that is already installed updates it to the latest source without raising `ruleset_installed`.

`ruleset_installed` is the first event a newly installed ruleset sees, so it's the place to set up state. Every ruleset on the pico sees the event when any ruleset is installed, so select only your own:

```krl
rule initialize_state {
  select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
  always {
    ent:items := {}
  }
}
```

### Information about installed rulesets

| Function | Returns |
|----------|---------|
| `installedRIDs()` | The rids of the rulesets on this pico |
| `rulesetMeta(rid)` | The ruleset's `meta` block: name, description, author, what it shares, and so on |
| `rulesetConfig(rid)` | The configuration it was installed with |
| `rulesetSchema(rid)` | Its schema: the events its documented rules select and the functions it documents and shares |
| `picoSchema()` | The schemas of all the pico's rulesets, merged |
| `channelSchema(eci)` | What a channel's policy allows, from the pico's schema |
| `rulesetWarnings(rid)` | The compiler's warnings for it |

When the set of rulesets on a pico changes, Wrangler raises `wrangler:schema_updated`.

### Flushing

When a ruleset's source changes, it has to be flushed: fetched and compiled again. Flush one on the **Rulesets** tab of the developer UI. From KRL, raise `wrangler:rulesets_need_flushing` to flush every ruleset on this pico. Wrangler raises `wrangler:rulesets_flushed` when it's done.

The engine compiles each URL once, so a flush affects every pico that installed a ruleset from that URL. Flushing doesn't raise `ruleset_installed` again, so rules that run on install don't run.

### Uninstalling

Raise `wrangler:uninstall_ruleset_request` with a `rid`. Wrangler raises `wrangler:ruleset_uninstalled` with the same attributes. A ruleset that another installed ruleset uses as a module can't be uninstalled.

## Querying other picos

`picoQuery(eci, rid, name, args)` calls a function another pico shares and returns its value:

```krl
rule ask {
  select when myapp question_asked
  pre {
    answer = wrangler:picoQuery(other_eci, "my.ruleset.id", "myFunction", {"arg1": "a"})
  }
  if answer{"error"}.isnull() then noop()
  fired {
    ent:answer := answer
  }
}
```

The target can be an ECI or a DID: a pico's `did:webvh`, or the `did:peer` of an established relationship. On the same engine, `picoQuery` calls the other pico directly. Otherwise it goes over HTTP, or over DIDComm for a DID.

On failure it returns a map with `error`, and for HTTP, `httpStatus` and the other pico's error as `picoQueryError`, `picoQueryErrorMsg`, and `picoQueryReturnValue`.

Optional parameters, for a pico on another engine:

| Parameter | Meaning |
|-----------|---------|
| `_host` | The other engine, with protocol and port, such as `https://picos.example.com`. Defaults to this engine (`meta:host`), and then the query doesn't use HTTP |
| `_path` | The path before the ECI. Default `/sky/cloud/` |
| `_root_url` | The whole URL before the ECI, instead of `_host` and `_path` |

A pico can't query itself: `picoQuery` returns an error ("Pico should not query itself"). A query waits for its answer, so avoid two picos that query each other at the same time. See [Querying another pico](/patterns_and_tips/querying-another-pico).

`skyQuery`, the older version, is still there for old rulesets. It always uses HTTP, which can't use family channels. It takes the same parameters in the same order, so switching to `picoQuery` is a rename.
