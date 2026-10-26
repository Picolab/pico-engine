# io.picolabs.wrangler

Wrangler Core Module,  
use example: "use module io.picolabs.wrangler alias wrangler".  
This Ruleset/Module provides a developer interface to the pico (persistent compute object).  
When a pico is created this ruleset will be installed to provide essential services.

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Operations:** [wrangler:install_ruleset_request (install_ruleset_relatively)](#wranglerinstall_ruleset_request-install_ruleset_relatively) · [wrangler:install_ruleset_request (install_ruleset_absolutely)](#wranglerinstall_ruleset_request-install_ruleset_absolutely) · [wrangler:uninstall_ruleset_request](#wrangleruninstall_ruleset_request) · [wrangler:rulesets_need_flushing](#wranglerrulesets_need_flushing) · [wrangler:new_channel_request](#wranglernew_channel_request) · [wrangler:channel_deletion_request](#wranglerchannel_deletion_request) · [wrangler:channel_update_request](#wranglerchannel_update_request) · [wrangler:new_child_request](#wranglernew_child_request) · [wrangler:name_changed](#wranglername_changed) · [wrangler:child_deletion_request](#wranglerchild_deletion_request) · [wrangler:set_public_intro](#wranglerset_public_intro)  
**Queries:** [picoQuery](#picoqueryeci-mod-func-params-_host-_path-_root_url--any) · [channels](#channelstags--array) · [discoveryChannel](#discoverychannel--map) · [rulesetConfig](#rulesetconfigrid--map) · [rulesetMeta](#rulesetmetarid--map) · [installedRIDs](#installedrids--array) · [picoSchema](#picoschema--map) · [rulesetSchema](#rulesetschemarid--map) · [channelSchema](#channelschemaeci--map) · [children](#children--array) · [parent_eci](#parent_eci--string) · [name](#name--string) · [myself](#myself--map) · [myDid](#mydid--string) · [publicIntro](#publicintro--boolean) · [id](#id--string)

## Operations

Events you can send to a pico with this ruleset installed. Whether an operation acts, and what it emits, depends on its condition and the pico's state when the event arrives.

### `wrangler:install_ruleset_request` (install_ruleset_relatively)

Install a ruleset that lives next to another one: the URL is built by replacing the last part of absoluteURL with <rid>.krl (pass meta:rulesetURI to install a sibling of the calling ruleset). Continues as an install by url.

**Send:** `wrangler:install_ruleset_request` with `absoluteURL` matches `re#(.+)#` and `rid` matches `re#(.+)#`  
**Rule:** `install_ruleset_relatively`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `absoluteURL` | String | yes | URL of a ruleset in the same directory |
| `rid` | String | yes | id of the ruleset to install |
| `config` | Map | no | configuration for the installed ruleset |

**Examples:**

- **sibling of this ruleset:** `{"absoluteURL":"<meta:rulesetURI>","rid":"<rid>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:install_ruleset_request` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler install_ruleset_request
        absoluteURL re#(.+)#
        rid re#(.+)#
        setting(absoluteURL, rid)
```

</details>

### `wrangler:install_ruleset_request` (install_ruleset_absolutely)

Install (or reinstall) a ruleset from a URL on this pico. The URL is fetched and compiled first, so this also picks up a new version. Raises wrangler:ruleset_installed with the installed rid.

**Send:** `wrangler:install_ruleset_request` with `url` matches `re#(.+)#`  
**Rule:** `install_ruleset_absolutely`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | String | yes | URL of the .krl file |
| `config` | Map | no | configuration for the installed ruleset |

**Examples:**

- **from a URL:** `{"url":"https://example.com/krl/<rid>.krl"}`
- **with config:** `{"url":"https://example.com/krl/<rid>.krl","config":{"<key>":"<value>"}}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:ruleset_installed` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler install_ruleset_request url re#(.+)# setting(url)
```

</details>

### `wrangler:uninstall_ruleset_request`

Uninstall a ruleset from this pico. Refused if another installed ruleset uses it as a module. Raises wrangler:ruleset_uninstalled.

**Send:** `wrangler:uninstall_ruleset_request` with `rid` matches `re#(.+)#`  
**Rule:** `uninstall_one_ruleset`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `rid` | String | yes | ruleset id |

**Examples:**

- **by rid:** `{"rid":"<rid>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:ruleset_uninstalled` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler uninstall_ruleset_request rid re#(.+)# setting(rid)
```

</details>

### `wrangler:rulesets_need_flushing`

Re-fetch and recompile every ruleset installed on this pico, so each picks up its latest source. Raises wrangler:rulesets_flushed when done.

**Send:** `wrangler:rulesets_need_flushing`  
**Rule:** `flush_all_rulesets`

No attributes.

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:rulesets_flushed` on this pico — when it acts, after the last iteration

<details><summary>Select expression</summary>

```krl
select when wrangler rulesets_need_flushing
```

</details>

### `wrangler:new_channel_request`

Create a channel on this pico. Raises wrangler:channel_created with the new channel (including its id).

**Send:** `wrangler:new_channel_request`  
**Rule:** `createChannel`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `tags` | Array | yes | tags for the channel, e.g. ["myapp", "webhook"] |
| `eventPolicy` | Map | yes | { allow: [ { domain, name } ], deny: [ … ] } |
| `queryPolicy` | Map | yes | { allow: [ { rid, name } ], deny: [ … ] } |

**Examples:**

- **webhook:** `{"tags":["<app>","webhook"],"eventPolicy":{"allow":[{"domain":"<app>","name":"*"}],"deny":[]},"queryPolicy":{"allow":[],"deny":[]}}`

**Acts when:** `tags && eventPolicy && queryPolicy`

**May emit** (possible, not guaranteed):

- raises `wrangler:channel_created` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler new_channel_request
```

</details>

### `wrangler:channel_deletion_request`

Delete a channel on this pico. Raises wrangler:channel_deleted.

**Send:** `wrangler:channel_deletion_request` with `eci` matches `re#^(.+)$#`  
**Rule:** `deleteChannel`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `eci` | String | yes | the channel to delete |

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:channel_deleted` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler channel_deletion_request eci re#^(.+)$# setting(eci)
```

</details>

### `wrangler:channel_update_request`

Replace a channel's tags and policies. Raises wrangler:channel_updated with the updated channel.

**Send:** `wrangler:channel_update_request`  
**Rule:** `updateChannel`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `eci` | String | yes | the channel to update |
| `tags` | Array | yes | new tags |
| `eventPolicy` | Map | yes | new event policy |
| `queryPolicy` | Map | yes | new query policy |

**Acts when:** `eci && tags && eventPolicy && queryPolicy`

**May emit** (possible, not guaranteed):

- raises `wrangler:channel_updated` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler channel_update_request
```

</details>

### `wrangler:new_child_request`

Create a child pico with wrangler, PDS, and relationships installed. Raises wrangler:new_child_created here with the child's family-channel eci and uiEci. Other attrs are passed to the child, and come back to this pico in wrangler:child_initialized once the child is set up (Manifold uses this, e.g. event_name, to tell its creations apart).

**Send:** `wrangler:new_child_request` with `name` matches `re#.+#` and `backgroundColor` (if given) matches `re#.*#`  
**Rule:** `createChild`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | yes | name for the child |
| `backgroundColor` | String | no | developer UI color, e.g. #87cefa |
| `policyCeiling` | Map | no | max channel policy for the child pico; must not exceed parent ceiling |

**Examples:**

- **named:** `{"name":"<name>"}`
- **with color:** `{"name":"<name>","backgroundColor":"#ffb347"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:new_child_created` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler new_child_request
        name re#.+#
        backgroundColor re#.*#
```

</details>

### `wrangler:name_changed`

Change this pico's wrangler name (what name() and myself() return).

**Send:** `wrangler:name_changed` with `name` matches `re#(.+)#`  
**Rule:** `take_note_of_name_change`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | yes | new name |

**Acts when:** always, once selected

<details><summary>Select expression</summary>

```krl
select when wrangler name_changed name re#(.+)# setting(name)
```

</details>

### `wrangler:child_deletion_request`

Delete a child pico and all of its descendants. Raises wrangler:child_deleted.

**Send:** `wrangler:child_deletion_request` with `eci` matches `re#^(.+)$#`  
**Rule:** `deleteOneChild`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `eci` | String | yes | the child's family-channel ECI (from children()) |

**Examples:**

- **by eci:** `{"eci":"<child family eci>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `wrangler:child_deleted` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when wrangler child_deletion_request eci re#^(.+)$# setting(eci)
```

</details>

### `wrangler:set_public_intro`

Turn on or off accepting unsolicited introduction messages (Layer 2 relationship requests) on this pico's did:webvh. See publicIntro().

**Send:** `wrangler:set_public_intro`  
**Rule:** `wrangler_set_public_intro`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `enabled` | Boolean | yes | true to accept introductions |

**Examples:**

- **accept:** `{"enabled":true}`
- **refuse:** `{"enabled":false}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

<details><summary>Select expression</summary>

```krl
select when wrangler set_public_intro
```

</details>

## Queries

### `picoQuery(eci, mod, func, params, _host, _path, _root_url)` → Any

Query a shared function on another pico. Picos on this engine are queried directly (which also works over parent/child family channels); a DID is queried over DIDComm; picos on another engine (_host) over HTTP. Querying one of this pico's own channels is refused. On failure, returns a map with error, httpStatus, and picoQueryError.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | channel on the other pico, or its DID |
| `mod` | String | yes |  | ruleset id on the other pico |
| `func` | String | yes |  | shared function to call |
| `params` | Map | yes |  | arguments for the function |
| `_host` | String | yes |  | the other pico's engine URL, if on a different engine |
| `_path` | String | yes |  | path prefix on that engine (default /sky/cloud/) |
| `_root_url` | String | yes |  | full query URL prefix, instead of _host and _path |

**Examples:**

- **child's name:** `{"eci":"<child family eci>","mod":"io.picolabs.wrangler","func":"name"}`
- **another engine:** `{"eci":"<eci>","mod":"<rid>","func":"<function>","params":{},"_host":"https://other.example"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/picoQuery?eci=…&mod=…&func=…&params=…&_host=…&_path=…&_root_url=…`, or `<alias>:picoQuery(eci, mod, func, params, _host, _path, _root_url)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `channels(tags)` → Array

This pico's channels, with their tags and event and query policies. With tags, only channels whose tags are exactly those (order and case don't matter).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `tags` | String | yes |  | comma-separated tags, or an array of tags |

**Examples:**

- **all:** `{}`
- **by tags:** `{"tags":"discovery"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/channels?tags=…`, or `<alias>:channels(tags)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `discoveryChannel()` → Map

This pico's discovery channel, which every pico has: integrators query it to learn what the pico can do.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/discoveryChannel`, or `<alias>:discoveryChannel()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `rulesetConfig(rid)` → Map

The configuration an installed ruleset was installed with, or null if it isn't installed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rid` | String | yes |  | ruleset id |

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/rulesetConfig?rid=…`, or `<alias>:rulesetConfig(rid)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `rulesetMeta(rid)` → Map

The meta block of an installed ruleset (name, description, shares, provides, …), or null if it isn't installed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rid` | String | yes |  | ruleset id |

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/rulesetMeta?rid=…`, or `<alias>:rulesetMeta(rid)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `installedRIDs()` → Array

Ids of the rulesets installed on this pico.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/installedRIDs`, or `<alias>:installedRIDs()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `picoSchema()` → Map

Everything discoverable on this pico: the annotated operations and queries of all installed rulesets, merged and grouped by event, with any attr type conflicts between rulesets. For discovery and generated tools (MCP).

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/picoSchema`, or `<alias>:picoSchema()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `rulesetSchema(rid?)` → Map

The discovery schema of one installed ruleset: its annotated operations (with their select, condition, prechecks, emits, and the other rules on the same event) and queries. What the Testing tab shows. Null if not installed.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `rid` | String | no |  | ruleset id |

**Examples:**

- **one ruleset:** `{"rid":"io.picolabs.pds"}`
- **all installed:** `{}`

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/rulesetSchema?rid=…`, or `<alias>:rulesetSchema(rid?)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `channelSchema(eci)` → Map

The part of picoSchema() a channel allows: what a caller holding this ECI can discover and use. Use the caller's own ECI for "what can I do here?", or any channel to check what it would expose.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | channel on this pico |

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/channelSchema?eci=…`, or `<alias>:channelSchema(eci)` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `children()` → Array

This pico's children, each with its family-channel ECI, name, and parent ECI.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/children`, or `<alias>:children()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `parent_eci()` → String

The family-channel ECI of this pico's parent; null for a root pico.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/parent_eci`, or `<alias>:parent_eci()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `name()` → String

This pico's wrangler name.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/name`, or `<alias>:name()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `myself()` → Map

This pico's wrangler name, id, and the ECI it was created with.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/myself`, or `<alias>:myself()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `myDid()` → String

This pico's portable did:webvh, the identity other picos and meshes use for Layer 2 relationships. It survives moving the pico to another engine.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/myDid`, or `<alias>:myDid()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `publicIntro()` → Boolean

True when this pico accepts unsolicited introduction messages (Layer 2 relationship requests) on its did:webvh. Change it with wrangler:set_public_intro.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/publicIntro`, or `<alias>:publicIntro()` from KRL with `use module io.picolabs.wrangler alias <alias>`

### `id()` → String

This pico's id.

**Call:** `GET /sky/query/<eci>/io.picolabs.wrangler/id`, or `<alias>:id()` from KRL with `use module io.picolabs.wrangler alias <alias>`
