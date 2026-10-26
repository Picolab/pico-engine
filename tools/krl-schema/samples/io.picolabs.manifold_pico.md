# io.picolabs.manifold_pico

The operational hub of a Manifold mesh. Creates thing and community  
picos as its children, keeps each subscribed to Manifold, tracks them in a registry,  
and hosts the notification platform. Installed on the Manifold pico under the owner.

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Operations:** [manifold:create_thing](#manifoldcreate_thing) · [manifold:register_thing_index](#manifoldregister_thing_index) · [manifold:new_community](#manifoldnew_community) · [manifold:add_thing_to_community](#manifoldadd_thing_to_community) · [manifold:remove_thing_from_community](#manifoldremove_thing_from_community) · [manifold:reconcile_thing_registry](#manifoldreconcile_thing_registry) · [manifold:reconcile_community_registry](#manifoldreconcile_community_registry) · [manifold:remove_thing](#manifoldremove_thing) · [manifold:remove_community](#manifoldremove_community) · [manifold:move_thing](#manifoldmove_thing) · [manifold:move_community](#manifoldmove_community) · [manifold:change_thing_name](#manifoldchange_thing_name) · [manifold:enable_portable_thing](#manifoldenable_portable_thing) · [manifold:update_version](#manifoldupdate_version)  
**Queries:** [getManifoldInfo](#getmanifoldinfo--map) · [getThings](#getthings--map) · [getCommunities](#getcommunities--map) · [getTagServer](#gettagserver--any) · [thingRegistryKey](#thingregistrykeyref--string) · [communityRegistryKey](#communityregistrykeyref--string)

## Operations

Events you can send to a pico with this ruleset installed. Whether an operation acts, and what it emits, depends on its condition and the pico's state when the event arrives.

### `manifold:create_thing`

Create a thing pico as a child of Manifold, install io.picolabs.thing on it, and subscribe it to Manifold as a manifold_thing. Only acts while Manifold has at most 100 children. Other attrs are passed through to wrangler new_child_request (e.g. backgroundColor). Asynchronous: the thing appears in getThings() once its subscription is established. To be told when it's ready, pass both callback_eci and rcn (unique identifier); community:thing_created and community:thing_completed are then sent to callback_eci with rcn, thingPicoID, thing_eci, and thingWranglerId. The callback channel's policy must allow those events.

**Send:** `manifold:create_thing`  
**Rule:** `createThing`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | yes | display name for the new thing |
| `callback_eci` | String | no | channel to notify when the thing is ready; needs rcn |
| `rcn` | String | no | caller's correlation id, echoed in the callback; needs callback_eci |

**Acts when:** `event:attr("name") && (wrangler:children().length() <= max_picos)`

**May emit** (possible, not guaranteed):

- raises `wrangler:new_child_request` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when manifold create_thing
```

</details>

### `manifold:register_thing_index`

Add or update a thing in Manifold's registry without creating a pico, e.g. after a portable import and before its Manifold subscription exists. Keeps any existing subID and color.

**Send:** `manifold:register_thing_index`  
**Rule:** `registerThingIndex`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | registry key for the thing (its family-channel ECI) |
| `name` | String | yes | display name |
| `queryEci` | String | no | ECI for talking to the thing, normally its Manifold subscription Tx |

**Acts when:** `picoID && name`

<details><summary>Select expression</summary>

```krl
select when manifold register_thing_index
```

</details>

### `manifold:new_community`

Create a community pico as a child of Manifold, install io.picolabs.community on it, subscribe it to Manifold as a manifold_community, and set its description and PDS profile. Only acts while Manifold has at most 100 children. Other attrs are passed through to wrangler new_child_request. Asynchronous: the community appears in getCommunities() once its subscription is established. Pass callback_eci and rcn to receive community:community_completed with rcn, communityPicoID, and community_eci.

**Send:** `manifold:new_community`  
**Rule:** `createCommunity`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | String | yes | display name for the new community |
| `description` | String | no | shown on the community and stored in its PDS profile |
| `callback_eci` | String | no | channel to notify when the community is ready; needs rcn |
| `rcn` | String | no | caller's correlation id, echoed in the callback; needs callback_eci |

**Acts when:** `event:attr("name") && (wrangler:children().length() <= max_picos)`

**May emit** (possible, not guaranteed):

- raises `wrangler:new_child_request` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when manifold new_community
```

</details>

### `manifold:add_thing_to_community`

Make a thing a member of a community. Both must already be in Manifold's registry with established subscriptions, or nothing happens. The community then forms its own subscription with the thing; check membership with the community's things().

**Send:** `manifold:add_thing_to_community`  
**Rule:** `addThingToCommunity`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `thingPicoID` | String | yes | the thing's registry key (see thingRegistryKey) |
| `communityPicoID` | String | yes | the community's registry key (see communityRegistryKey) |

**Acts when:** `community_eci && thing_eci`

**May emit** (possible, not guaranteed):

- sends `community:add_thing` to `community_eci`

<details><summary>Select expression</summary>

```krl
select when manifold add_thing_to_community
```

</details>

### `manifold:remove_thing_from_community`

Remove a thing from a community by cancelling the thing's community subscription. The thing and the community both remain.

**Send:** `manifold:remove_thing_from_community`  
**Rule:** `removeThingFromCommunity`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `thingPicoID` | String | yes | the thing's registry key |
| `communityPicoID` | String | yes | the community's registry key |

**Acts when:** `community_member_sub && thing_eci`

**May emit** (possible, not guaranteed):

- sends `wrangler:subscription_cancellation` to `thing_eci`

<details><summary>Select expression</summary>

```krl
select when manifold remove_thing_from_community
```

</details>

### `manifold:reconcile_thing_registry`

Rebuild the thing registry from established manifold_thing subscriptions, dropping entries that have none. Runs automatically when this ruleset is installed or upgraded.

**Send:** `manifold:reconcile_thing_registry`  
**Rule:** `reconcileThingRegistry`

No attributes.

**Acts when:** always, once selected

<details><summary>Select expression</summary>

```krl
select when manifold reconcile_thing_registry
```

</details>

### `manifold:reconcile_community_registry`

Rebuild the community registry from established manifold_community subscriptions. Runs automatically when this ruleset is installed or upgraded.

**Send:** `manifold:reconcile_community_registry`  
**Rule:** `reconcileCommunityRegistry`

No attributes.

**Acts when:** always, once selected

<details><summary>Select expression</summary>

```krl
select when manifold reconcile_community_registry
```

</details>

### `manifold:remove_thing`

Remove a thing: cancel its Manifold subscription, then delete its pico. If the subscription is already gone (e.g. after a failed import), the registry entry and any orphaned child pico are removed directly. Communities the thing belonged to are not notified. Done when the thing disappears from getThings(); there is no callback.

**Send:** `manifold:remove_thing`  
**Rule:** `removeThingSubscription`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | the thing's registry key, queryEci, or picoID |

**Acts when:** `picoID && (sub.isnull() == false)`

**May emit** (possible, not guaranteed):

- raises `wrangler:subscription_cancellation` on this pico — when it acts

**Other rules on the same event:**

- `removeThingOrphan` — acts when `picoID && orphan`
- `removeThingOrphanChild` — acts when `picoID && sub.isnull() && child`

<details><summary>Select expression</summary>

```krl
select when manifold remove_thing
```

</details>

### `manifold:remove_community`

Remove a community: cancel its Manifold subscription, then delete its pico. Member things are not deleted. Done when it disappears from getCommunities().

**Send:** `manifold:remove_community`  
**Rule:** `removeCommunity`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | the community's registry key |
| `name` | String | no | used only in the response if the community isn't in the registry |

**Acts when:** `picoID && subID && sub`

**May emit** (possible, not guaranteed):

- raises `wrangler:subscription_cancellation` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when manifold remove_community
```

</details>

### `manifold:move_thing`

Save a thing's position and size on the Manifold dashboard grid. Ignored unless picoID is a registered thing. Numeric strings are accepted.

**Send:** `manifold:move_thing`  
**Rule:** `updateThingLocation`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | the thing's registry key |
| `x` | Number | yes | grid column |
| `y` | Number | yes | grid row |
| `w` | Number | yes | width in grid units (min 3, max 8) |
| `h` | Number | yes | height in grid units (min 2.25, max 5) |

**Acts when:** `picoID && isAThing(picoID)`

<details><summary>Select expression</summary>

```krl
select when manifold move_thing
```

</details>

### `manifold:move_community`

Save a community's position and size on the Manifold dashboard grid. Ignored unless picoID is a registered community.

**Send:** `manifold:move_community`  
**Rule:** `updateCommunityLocation`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | the community's registry key |
| `x` | Number | yes | grid column |
| `y` | Number | yes | grid row |
| `w` | Number | yes | width in grid units |
| `h` | Number | yes | height in grid units |

**Acts when:** `picoID && isACommunity(picoID)`

<details><summary>Select expression</summary>

```krl
select when manifold move_community
```

</details>

### `manifold:change_thing_name`

Rename a thing in Manifold's registry and in the thing's own PDS profile.

**Send:** `manifold:change_thing_name`  
**Rule:** `changeThingName`

| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| `picoID` | String | yes | the thing's registry key |
| `changedName` | String | yes | new display name |

**Acts when:** `not picoID.isnull() || changedName.isnull()`

**May emit** (possible, not guaranteed):

- sends `pds:updated_profile` to `picoID`

<details><summary>Select expression</summary>

```krl
select when manifold change_thing_name
```

</details>

### `manifold:enable_portable_thing`

Opt in to moving things between engines: installs the engine's io.picolabs.portable_subtree and then io.picolabs.manifold_portable_thing on this pico. Safe to repeat; does nothing once both are installed. Check with wrangler:installedRIDs().

**Send:** `manifold:enable_portable_thing`  
**Rule:** `enable_portable_thing_install_engine_rs`

No attributes.

**Acts when:** `needPortable`

**May emit** (possible, not guaranteed):

- raises `wrangler:install_ruleset_request` on this pico — when it acts

**Other rules on the same event:**

- `enable_portable_thing_install_wrapper_rs` — acts when `havePortable && needWrapper && absoluteURL`

<details><summary>Select expression</summary>

```krl
select when manifold enable_portable_thing
```

</details>

### `manifold:update_version`

Install any notification-platform rulesets this Manifold pico is missing (notifications, Twilio SMS, Prowl, Home Assistant). Use after upgrading a Manifold that predates them.

**Send:** `manifold:update_version`  
**Rule:** `updateManifoldVersion`

No attributes.

**Acts when:** `absoluteURL`

**May emit** (possible, not guaranteed):

- raises `wrangler:install_ruleset_request` on this pico — when it acts

<details><summary>Select expression</summary>

```krl
select when manifold update_version
```

</details>

## Queries

### `getManifoldInfo()` → Map

Things and communities managed by this Manifold pico, in one call.

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/getManifoldInfo`, or `<alias>:getManifoldInfo()` from KRL with `use module io.picolabs.manifold_pico alias <alias>`

### `getThings()` → Map

Things managed by this Manifold pico, keyed by picoID (the thing's registry key). Built from established manifold_thing subscriptions merged with stored registry data, so a thing whose subscription hasn't completed yet does not appear. Each row has name, picoID, subID, color, pos, and queryEci (also as Tx): use queryEci, not picoID, to send events to or query the thing.

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/getThings`, or `<alias>:getThings()` from KRL with `use module io.picolabs.manifold_pico alias <alias>`

### `getCommunities()` → Map

Communities managed by this Manifold pico, keyed by picoID (the community's registry key). Like getThings(), only communities with an established manifold_community subscription appear. Each row has name, picoID, subID, color, pos.

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/getCommunities`, or `<alias>:getCommunities()` from KRL with `use module io.picolabs.manifold_pico alias <alias>`

### `getTagServer()` → Any

The tag registry Manifold uses for NFC/QR tags, as configured on the owner pico.

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/getTagServer`, or `<alias>:getTagServer()` from KRL with `use module io.picolabs.manifold_pico alias <alias>`

### `thingRegistryKey(ref)` → String

Normalize a reference to a thing into its registry key (the key used by getThings() and remove_thing). Null if the thing isn't in the registry.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ref` | String | yes |  | the registry key itself, the thing's queryEci, or its picoID |

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/thingRegistryKey?ref=…`, or `<alias>:thingRegistryKey(ref)` from KRL with `use module io.picolabs.manifold_pico alias <alias>`

### `communityRegistryKey(ref)` → String

Normalize a reference to a community into its registry key. Null if unknown.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `ref` | String | yes |  | the registry key itself or the community's picoID |

**Call:** `GET /sky/query/<eci>/io.picolabs.manifold_pico/communityRegistryKey?ref=…`, or `<alias>:communityRegistryKey(ref)` from KRL with `use module io.picolabs.manifold_pico alias <alias>`
