# io.picolabs.pds

Pico Data Services (PDS), a common data base structure for all rulesets to use.

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Operations:** [pds:new_data_available](#pdsnew_data_available) · [pds:updated_data_available](#pdsupdated_data_available) · [pds:remove_old_data](#pdsremove_old_data) · [pds:remove_namespace](#pdsremove_namespace) · [pds:map_item](#pdsmap_item) · [pds:updated_profile](#pdsupdated_profile) · [pds:add_settings](#pdsadd_settings)  
**Queries:** [items](#itemsnamespace-key--map) · [get_keys](#get_keysnamespace--array) · [profile](#profilekey--map) · [settings](#settingsrid-key-detail--map) · [get_config_value](#get_config_valuesetkey--any) · [get_setting_data_value](#get_setting_data_valuesetrid-setkey--any) · [config_value](#config_valuesetkey--any) · [settings_names](#settings_names--array) · [getChannelEci](#getchanneleci--string)

## Operations

Events you can send to a pico with this ruleset installed. Whether an operation acts, and what it emits, depends on its condition and the pico's state when the event arrives.

### `pds:new_data_available`

Store one value in the general data under namespace and key, replacing any existing value. Raises pds:data_added.

**Send:** `pds:new_data_available`  
**Rule:** `add_item`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | yes | namespace, e.g. your app's name |
| `key` | String | yes |  |
| `value` | Any | yes | value to store |

**Examples:**

- **store a value:** `{"namespace":"<app>","key":"<key>","value":"<value>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:data_added` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds new_data_available
```

</details>

### `pds:updated_data_available`

Merge fields into a stored map: each entry of value is written under namespace / key / field, leaving other fields alone. Raises pds:data_updated once per field.

**Send:** `pds:updated_data_available`  
**Rule:** `update_item`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | yes |  |
| `key` | String | yes |  |
| `value` | Map | yes | fields to set on the stored map |

**Examples:**

- **set fields:** `{"namespace":"<app>","key":"<key>","value":{"<field>":"<value>"}}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:data_updated` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds updated_data_available
```

</details>

### `pds:remove_old_data`

Delete one key from a namespace of the general data. Raises pds:data_deleted.

**Send:** `pds:remove_old_data`  
**Rule:** `remove_item`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | yes |  |
| `key` | String | yes |  |

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:data_deleted` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds remove_old_data
```

</details>

### `pds:remove_namespace`

Delete a whole namespace of the general data. Raises pds:namespace_deleted.

**Send:** `pds:remove_namespace`  
**Rule:** `remove_namespace`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | yes |  |

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:namespace_deleted` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds remove_namespace
```

</details>

### `pds:map_item`

Replace an entire namespace of the general data with a map. Raises pds:new_map_added.

**Send:** `pds:map_item`  
**Rule:** `itemed_mapped`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `namespace` | String | yes |  |
| `mapvalues` | String | yes | the new namespace contents, as a JSON-encoded map |

**Examples:**

- **replace namespace:** `{"namespace":"<app>","mapvalues":"{\"<key>\": \"<value>\"}"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:new_map_added` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds map_item
```

</details>

### `pds:updated_profile`

Update this pico's profile. Send only the fields to change; fields not sent keep their current values. _created is set on the first update and _modified on every update. Raises pds:profile_updated with _status "success", or "failure" when no fields were sent.

**Send:** `pds:updated_profile`  
**Rule:** `update_profile`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | no | display name |
| `description` | String | no |  |
| `photo` | String | no | image URL or data: URI |
| `email` | String | no |  |
| `phone` | String | no |  |

**Examples:**

- **rename:** `{"name":"<name>"}`
- **contact info:** `{"email":"<email>","phone":"<phone>"}`

**Acts when:** `newly_constructed_profile != "nothing to update"`

**May emit** (possible, not guaranteed):

- raises `pds:profile_updated` on this pico — when it acts
- raises `pds:profile_updated` on this pico — when it doesn't act

<details><summary>Select expression</summary>

```krl
select when pds updated_profile
```

</details>

### `pds:add_settings`

Create or update a ruleset's settings record, and optionally set one data value in it. Raises pds:settings_added.

**Send:** `pds:add_settings`  
**Rule:** `settings_added`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyed_rid` | String | yes | ruleset id the settings belong to |
| `name` | String | yes | display name for the settings |
| `schema` | Array | no | settings schema, stored as given |
| `data_key` | String | no | data key to set |
| `value` | Any | no | value for data_key |

**Examples:**

- **register settings:** `{"keyed_rid":"<rid>","name":"<display name>"}`
- **set one value:** `{"keyed_rid":"<rid>","name":"<display name>","data_key":"<key>","value":"<value>"}`

**Acts when:** always, once selected

**May emit** (possible, not guaranteed):

- raises `pds:settings_added` on this pico — always

<details><summary>Select expression</summary>

```krl
select when pds add_settings
```

</details>

## Queries

### `items(namespace?, key?)` → Map

Read general (namespaced) data. With no namespace, returns all of it; with a namespace, that namespace's map; with both, one value. status is "failed" when no namespace is given (the data is still returned).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `namespace` | String | no |  | namespace to read; omit for everything |
| `key` | String | no |  | key within the namespace; omit for the whole namespace |

**Examples:**

- **one namespace:** `{"namespace":"<app>"}`
- **one value:** `{"namespace":"<app>","key":"<key>"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/items?namespace=…&key=…`, or `<alias>:items(namespace?, key?)` from KRL with `use module io.picolabs.pds alias <alias>`

### `get_keys(namespace)` → Array

Keys stored in one namespace of the general data.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `namespace` | String | yes |  |  |

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/get_keys?namespace=…`, or `<alias>:get_keys(namespace)` from KRL with `use module io.picolabs.pds alias <alias>`

### `profile(key?)` → Map

This pico's profile: name, description, photo, email, phone, and the _created / _modified timestamps. With a key, just that field.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `key` | String | no |  | profile field to read; omit for the whole profile |

**Examples:**

- **whole profile:** `{}`
- **name only:** `{"key":"name"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/profile?key=…`, or `<alias>:profile(key?)` from KRL with `use module io.picolabs.pds alias <alias>`

### `settings(Rid?, Key?, detail?)` → Map

Read per-ruleset settings. No arguments: all settings. Rid: that ruleset's settings record ({ name, rid, data, schema }). Rid and Key: one field of the record. Rid, Key, and detail: the value of data key `detail` (Key is ignored).

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `Rid` | String | no |  | ruleset id whose settings to read |
| `Key` | String | no |  | field of the settings record (name, rid, data, schema) |
| `detail` | String | no |  | key within the record's data map |

**Examples:**

- **one ruleset:** `{"Rid":"<rid>"}`
- **one data value:** `{"Rid":"<rid>","Key":"data","detail":"<key>"}`

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/settings?Rid=…&Key=…&detail=…`, or `<alias>:settings(Rid?, Key?, detail?)` from KRL with `use module io.picolabs.pds alias <alias>`

### `get_config_value(setKey)` → Any

Same as config_value: a value from the calling ruleset's own settings data, for use as a module function.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `setKey` | String | yes |  | data key |

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/get_config_value?setKey=…`, or `<alias>:get_config_value(setKey)` from KRL with `use module io.picolabs.pds alias <alias>`

### `get_setting_data_value(setRID, setKey)` → Any

One configuration value from a ruleset's settings data.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `setRID` | String | yes |  | ruleset id |
| `setKey` | String | yes |  | data key |

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/get_setting_data_value?setRID=…&setKey=…`, or `<alias>:get_setting_data_value(setRID, setKey)` from KRL with `use module io.picolabs.pds alias <alias>`

### `config_value(setKey)` → Any

One configuration value from the calling ruleset's own settings data. Meant to be used as a module function (use module io.picolabs.pds): the ruleset is the caller's, from meta:callingRID().

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `setKey` | String | yes |  | data key |

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/config_value?setKey=…`, or `<alias>:config_value(setKey)` from KRL with `use module io.picolabs.pds alias <alias>`

### `settings_names()` → Array

Rulesets that have stored settings here, with their display names.

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/settings_names`, or `<alias>:settings_names()` from KRL with `use module io.picolabs.pds alias <alias>`

### `getChannelEci()` → String

The ECI of this pico's pds channel, which allows all pds events and queries. Created when this ruleset is installed.

**Call:** `GET /sky/query/<eci>/io.picolabs.pds/getChannelEci`, or `<alias>:getChannelEci()` from KRL with `use module io.picolabs.pds alias <alias>`
