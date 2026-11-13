# Pico data store

*Ruleset: `io.picolabs.pds`, installed on every pico. For every event and function, see the [API reference](/rulesets/io.picolabs.pds).*

[Relationships](/wrangler/relationships) answer "how do two picos talk to each other?" The pico data store (PDS) answers "where does a pico keep its data, and how do rulesets read and write it consistently?"

Without PDS, each application ruleset makes its own entity variables (`ent:contactInfo`, `ent:thingInfo`, …). Display names end up in Wrangler, contact cards in one ruleset, configuration in another. PDS is one shared data service on every pico, with three layers:

| Layer | Entity variable | Purpose |
|-------|-----------------|---------|
| Profile | `ent:profile` | This pico's display identity: name, description, photo. A person's profile only if this pico stands for a person |
| General | `ent:general` | Namespaced key-value data for apps and domains |
| Settings | `ent:settings` | Per-ruleset configuration, keyed by rid |

Design principles:

- **PDS owns the data.** Apps don't write `ent:profile`, `ent:general`, or `ent:settings` themselves. They raise `pds` events; PDS rules store the data and announce the change.
- **Reads go through shared functions.** Other rulesets `use module io.picolabs.pds` and call its functions (`profile`, `items`, `config_value`, …).
- **Writes are events.** Raise `pds:updated_profile`, `pds:new_data_available`, and so on; select `pds:profile_updated`, `pds:data_added`, and so on to react.
- **One PDS per pico.** The engine installs it on the root pico, and Wrangler installs it on every child.

PDS doesn't replace relationships, channels, or Wrangler; it complements them. Relationships are the wire; PDS is the notebook each pico keeps about itself. Not everything belongs in it: see the next section.

## What belongs in PDS (and what doesn't)

PDS is a pico's shared data plane, but application rulesets still have their own entity variables. Use PDS when the data is shared, queried, or part of the pico's display identity. Keep data in the app's ruleset when it is private, derived, short-lived, or changes very often.

### Profile, on every pico

Put in the profile (`pds:updated_profile`, read with `pds:profile()`):

| Data | Examples |
|------|----------|
| Display name | Labels for things, communities, owners, and registries in UI lists and notifications |
| Short description | A community's blurb, a thing's subtitle |
| Photo or avatar | An owner's photo, a thing's icon |
| Contact details (on an owner's pico) | Email and phone, for notifications |

The profile is the stable surface other picos read: frameworks, notifications, and peers use `wrangler:picoQuery(eci, "io.picolabs.pds", "profile", …)` without knowing each app's layout. When PDS is installed, it copies the Wrangler name into the profile if the profile has none.

In application rulesets, prefer `pds:profile("name")` to `wrangler:name()` for anything shown to people.

### General data

Put in general (`pds:new_data_available`, by namespace and key):

| Situation | Example |
|-----------|---------|
| Two or more rulesets on the same pico need the data | A contact card read by a lost-and-found app and by a public query channel |
| Other picos read it with `picoQuery(..., "io.picolabs.pds", "items", …)` | A registry's ECI stored on a thing, for tag lookup |
| A namespace documented for others to rely on | `general.safeandmine.contact`, `general.sensor.last_reading` |

Keep in the app's own entity variables (and raise the app's own events):

| Situation | Example |
|-----------|---------|
| One ruleset writes it and nothing else reads it | An internal list of channels, pending UI state |
| A cache rebuilt from relationships and PDS reads | `ent:thingInfo` on a thing pico |
| An index rebuilt from Wrangler events | A hub's list of the things and communities it holds (the canonical name is in each child's profile) |
| Short-lived UI state | Layout, colors, badge counts, notification inbox rows |
| High-volume telemetry | Raw sensor readings. Use PDS general only if other rulesets must query the latest value |

### Settings

Put in settings (`pds:add_settings`, keyed by ruleset rid):

- Per-app configuration and feature flags (`shareEmail`, thresholds, notification switches).
- Data the owning ruleset reads with `pds:config_value("key")`, which uses the calling ruleset's rid.

Keep operational state (the last run's id, timers, in-flight maps) in the app's ruleset, unless another ruleset must read it.

### A checklist

- Needs a stable API that other rulesets or picos read? PDS: profile, general, or settings, by shape.
- The pico's display identity in UIs or notifications? The profile.
- Only this ruleset touches it? The app's own entity variables.
- Rebuilt from relationship, Wrangler, or framework events? A derived cache in the app's ruleset, not duplicated in PDS.
- Layout, cache, or scratch state? The app's own entity variables.

### Mirroring (planned)

Mirrors of a pico (copies kept elsewhere) are planned around a selective event log: replaying Wrangler, framework, and `pds` events, plus events apps opt in, rebuilds a pico's state. `pds` writes are good events for that log. A PDS snapshot (profile, general, settings, and installed rulesets) is a simpler export. App entity variables are views rebuilt on replay. Don't move data into PDS only for mirroring; move it when it is shared.

## Using PDS in KRL

In a ruleset that reads PDS data on the same pico:

```krl
meta {
  use module io.picolabs.pds alias pds
}
```

To read PDS on another pico, query it with `wrangler:picoQuery` on a channel whose query policy allows `io.picolabs.pds`:

```krl
displayName = wrangler:picoQuery(thing_eci, "io.picolabs.pds", "profile", {"key": "name"}){"profile"}
```

When PDS is installed, it creates a channel tagged `pds` that allows `pds` events and `io.picolabs.pds` queries, for HTTP access. On the root pico, it also makes sure the channel exists each time the engine starts. The developer UI's channel doesn't allow PDS queries.

## Reading data

The functions return a map with `status` (`"success"` or `"failed"`) and the data under `profile`, `general`, or `settings`.

### Profile

`profile(key)` reads this pico's profile: how the pico presents itself. Each pico has its own. A thing's name isn't its owner's name unless an app copies it there.

| Call | Returns |
|------|---------|
| `profile()` | The whole profile |
| `profile("name")` | One field, under `profile` |

```krl
allProfile = pds:profile(){"profile"}
name = pds:profile("name"){"profile"}
```

An empty profile looks like this; the default `photo` is a placeholder image, as a `data:` URI:

```json
{"name": "", "description": "", "photo": "data:image/svg+xml;base64,..."}
```

### General items

`items(namespace, key)`:

| Call | Returns |
|------|---------|
| `items(null, null)` | All of `ent:general` (use sparingly) |
| `items("myapp", null)` | Every key in the `myapp` namespace |
| `items("myapp", "contact")` | One value |

```krl
card = pds:items("safeandmine", "contact"){"general"}
allTags = pds:items("safeandmine", null){"general"}
```

### Settings

| Function | Purpose |
|----------|---------|
| `settings(rid, key, detail)` | A ruleset's settings entry, or part of it |
| `setting_data(rid)` | The `Data` map for a ruleset |
| `setting_data_value(rid, setKey)` | One key in it |
| `config_value(setKey)` | One key of the calling ruleset's own data |

`config_value` lets a ruleset read its own preferences without naming its rid:

```krl
threshold = pds:config_value("threshold")
```

## Writing data

### The profile

Raise `pds:updated_profile` with any of the profile's fields. It merges into the profile; fields you leave out keep their values. PDS sets `_created` on the first write and `_modified` on every one.

```krl
raise pds event "updated_profile" attributes {
  "name": "Blue Backpack",
  "description": "Phil's day pack",
  "photo": "https://example.com/photo.jpg"
}
```

PDS raises `pds:profile_updated` with a `_status` of `"success"` or `"failure"`.

```krl
rule on_profile_updated {
  select when pds profile_updated
  pre {
    name = event:attr("name")
    status = event:attr("_status")
  }
  if status == "success" then send_directive("profile saved", {"name": name})
}
```

On a thing or a community, you're setting that pico's identity, not its owner's. To change a person's contact details, write to the owner's pico.

### General data

Data is organized by namespace and key. Values can be anything, including maps. Use namespaces so apps don't collide (`safeandmine`, `sensor`, …).

Add or replace an item with `pds:new_data_available`. PDS raises `pds:data_added`:

```krl
raise pds event "new_data_available" attributes {
  "namespace": "safeandmine",
  "key": "contact",
  "value": {"email": "owner@example.com", "phone": "555-0100", "shareEmail": false}
}
```

Merge into a map item with `pds:updated_data_available`, whose `value` is the keys to change. PDS raises `pds:data_updated`:

```krl
raise pds event "updated_data_available" attributes {
  "namespace": "safeandmine",
  "key": "contact",
  "value": {"phone": "555-0199"}
}
```

Replace a whole namespace with `pds:map_item`, whose `mapvalues` is JSON-encoded. PDS raises `pds:new_map_added`:

```krl
raise pds event "map_item" attributes {
  "namespace": "safeandmine",
  "mapvalues": {"tag1": "eci-abc", "tag2": "eci-def"}.encode()
}
```

Remove one item with `pds:remove_old_data` (`namespace`, `key`), which raises `pds:data_deleted`, or a whole namespace with `pds:remove_namespace` (`namespace`), which raises `pds:namespace_deleted`.

### Settings

Settings are keyed by rid. Each entry has a `name`, the `rid`, a `data` map, and an optional `schema`. `pds:add_settings` sets one value, and PDS raises `pds:settings_added`:

```krl
raise pds event "add_settings" attributes {
  "name": "SafeAndMine",
  "keyed_rid": "io.picolabs.safeandmine",
  "schema": [],
  "data_key": "shareEmail",
  "value": true
}
```

### Reacting to changes

| Event | Raised when |
|-------|-------------|
| `pds:data_added` | An item was added |
| `pds:data_updated` | An item was merged into |
| `pds:data_deleted` | An item was removed |
| `pds:namespace_deleted` | A namespace was removed |
| `pds:new_map_added` | A namespace was replaced |
| `pds:profile_updated` | The profile changed |
| `pds:settings_added` | A settings entry changed |

```krl
rule contact_changed {
  select when pds data_updated
    where event:attr("namespace") == "safeandmine" && event:attr("keyvalue") == "contact"
  always {
    raise safeandmine event "contact_changed" attributes event:attrs
  }
}
```

### Clearing everything

`pds:clear_all_data` erases the profile, all general data, and all settings, with no confirmation. It is for tests and developer tools. When an app is uninstalled, remove only its namespace and its settings; the profile should usually stay.

## An example: an app on a thing pico

A lost-and-found app keeps its contact card in general data, uses the profile for the thing's name, and reads share flags from settings. Both `io.picolabs.pds` and the app are installed on the thing pico.

Save the card, through PDS:

```krl
rule information_update {
  select when safeandmine update
  pre {
    card = {
      "email": event:attr("email").defaultsTo("").substr(0, 100),
      "phone": event:attr("phone").defaultsTo("").substr(0, 100),
      "message": event:attr("message").defaultsTo("").substr(0, 250),
      "shareName": event:attr("shareName").as("Boolean").defaultsTo(false),
      "shareEmail": event:attr("shareEmail").as("Boolean").defaultsTo(false)
    }
  }
  always {
    raise pds event "new_data_available" attributes {"namespace": "safeandmine", "key": "contact", "value": card}
  }
}
```

Read the public view of it, combining the profile and the card:

```krl
rule get_information {
  select when safeandmine information_requested
  pre {
    card = pds:items("safeandmine", "contact"){"general"}.defaultsTo({})
    profileName = pds:profile("name"){"profile"}
    result = card.put("name", card{"shareName"} => profileName | null)
  }
  send_directive("contact info", result)
}
```

A notification uses the profile's name, not a copy in the app:

```krl
rule notify {
  select when safeandmine tag_scanned
  pre {
    thingName = pds:profile("name"){"profile"}
    tagID = event:attr("tagID")
  }
  if tagID && thingName then
    event:send({
      "eci": owner_eci,
      "domain": "notification",
      "type": "added",
      "attrs": {"thing": thingName, "message": "Your tag " + tagID + " has been scanned"}
    })
}
```

## The data model

Only PDS rules write these three entity variables.

`ent:profile` is one map per pico. A thing's:

```json
{
  "name": "Blue Backpack",
  "description": "Phil's hiking pack",
  "photo": "https://…",
  "_created": "20260609T120000+0000",
  "_modified": "20260609T153000+0000"
}
```

An owner's might also have `email` and `phone`. Any pico can have those fields.

`ent:general` is a tree of namespaces and keys:

```
"safeandmine"
  "contact"      → { email, phone, message, shareName, … }
  "registry_eci" → "<channel eci>"
"sensor"
  "last_reading" → { … }
```

In KRL, a path into it is `ent:general{[namespace, key]}`.

`ent:settings` is keyed by rid:

```json
{
  "io.picolabs.safeandmine": {
    "name": "SafeAndMine",
    "rid": "io.picolabs.safeandmine",
    "data": {"shareEmail": false, "threshold": 60},
    "schema": []
  }
}
```

Use predictable namespaces so apps coexist on one pico: the framework's (`manifold`), an app's (`safeandmine`), a domain's (`sensor`), or a ruleset's rid.

Don't store secrets in PDS general data unless the channels that can query it are restricted. Channel ECIs are capabilities; treat them as sensitive.

## The protocol

Writing:

1. An app's ruleset raises a `pds` event (`updated_profile`, `new_data_available`, …).
2. A PDS rule checks the attributes and updates its entity variable.
3. PDS raises a notification event (`profile_updated`, `data_added`, …) on the same pico.
4. Other rulesets select the notification to react.

Apps never assign `ent:profile`, `ent:general`, or `ent:settings` themselves, which keeps storage in one place.

Reading: on the same pico, use the ruleset as a module; from another pico, `wrangler:picoQuery(eci, "io.picolabs.pds", function, params)` on a channel that allows it.

| | Relationships | PDS |
|-|---------------|-----|
| Problem | Communication between picos | Data storage within a pico |
| Mechanism | Channels and the relationship ruleset | Events and shared queries |
| Identity | `Tx`, `Rx`, roles | Profile name, namespaces |
| Installed | On every pico | On every pico |

```
App ruleset                PDS                         Other rulesets on the pico
  |-- pds:updated_profile -->|                                    |
  |                          |-- merge ent:profile                |
  |                          |-- pds:profile_updated ------------>| (if they select it)
```

## Security

PDS is a data contract, not an authorization layer.

Entity variables belong to their ruleset, so another ruleset's `ent:contactInfo` is a different variable and can't overwrite PDS storage. Other rulesets reach PDS data by reading through the module or `picoQuery`, and by writing with `pds` events, which only PDS rules handle.

| Layer | Mechanism | What it protects |
|-------|-----------|------------------|
| Access from other picos | ECI and channel policy | Remote events and queries, including PDS queries |
| What runs on the pico | Who installs rulesets | Which rulesets run |
| Writes from the same pico | None today | — |

Any ruleset installed on a pico can raise `pds:updated_profile`, `pds:new_data_available`, `pds:clear_all_data`, and the rest. PDS doesn't check which ruleset raised them (it uses `meta:callingRID()` for settings reads, not for writes). So security depends on trusting every ruleset installed on the pico. Other picos need a channel that allows `pds` events or `io.picolabs.pds` queries; that's uncommon for writes.

Practical guidance:

- Install only rulesets you trust on production picos.
- Use namespaces consistently, so apps don't duplicate canonical data.
- Restrict query channels when general data includes sensitive fields.
- Treat `pds:clear_all_data` as destructive.

### Planned

- Write authorization: checking `meta:callingRID()` on writes, so only the owning app writes its namespace.
- Engine-level workload identity and policy before events reach rulesets.
- Channel templates and install allowlists that limit what application rulesets can declare.

## See also

- [Relationships](/wrangler/relationships): channels between picos, and roles
- [Managing channels](/wrangler/channels): ECIs and channel policies
