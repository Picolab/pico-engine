# io.picolabs.oauth

Optional mesh-level OAuth. Install on the root pico to require Bearer tokens on external /sky/*  
for this mesh (except channels tagged mesh-oauth-exempt or didcomm+ingress), and to hold  
per-mesh OAuth configuration (apps, consent policy, defaults).  
Webhook Client Credentials (per channel, oauth-webhook tag) and app Authorization Code grants  
coexist here. Not installed by default.

use module io.picolabs.oauth alias oauth

*Version draft. Generated from the ruleset's annotations by `krl-schema --format markdown`; edit the `/** */` comments in the source, not this page. Only annotated rules and shared functions appear.*

**Queries:** [meshEnabled](#meshenabled--boolean) · [meshRequiresOAuth](#meshrequiresoautheci--boolean) · [channelStatus](#channelstatuseci--map) · [createChannelSecret](#createchannelsecreteci--map) · [revokeChannelSecret](#revokechannelsecreteci--map) · [revokeTokens](#revoketokenseci--map)

## Queries

### `meshEnabled()` → Boolean

True when this ruleset is installed on the pico. Its presence is the mesh's opt-in to OAuth.

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/meshEnabled`, or `<alias>:meshEnabled()` from KRL with `use module io.picolabs.oauth alias <alias>`

### `meshRequiresOAuth(eci)` → Boolean

True when external /sky/* requests on this channel need a Bearer token: the mesh root has io.picolabs.oauth installed and the channel is not tagged mesh-oauth-exempt or didcomm+ingress.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | channel to check |

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/meshRequiresOAuth?eci=…`, or `<alias>:meshRequiresOAuth(eci)` from KRL with `use module io.picolabs.oauth alias <alias>`

### `channelStatus(eci)` → Map

OAuth webhook status of a channel: whether it is eligible (tagged oauth-webhook), whether OAuth is enabled on it, and whether a client secret exists. Includes a reason when the channel is not eligible or not found.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | channel to inspect |

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/channelStatus?eci=…`, or `<alias>:channelStatus(eci)` from KRL with `use module io.picolabs.oauth alias <alias>`

### `createChannelSecret(eci)` → Map

Create (or replace) the Client Credentials secret for a webhook channel and return it. The secret is returned only here; the engine stores a hash, so save it now. Only works for a channel on this pico or one of its descendants. Changes state despite being a query.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | webhook channel (tagged oauth-webhook); also the client_id |

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/createChannelSecret?eci=…`, or `<alias>:createChannelSecret(eci)` from KRL with `use module io.picolabs.oauth alias <alias>`

### `revokeChannelSecret(eci)` → Map

Revoke a webhook channel's client secret so it can no longer obtain tokens. Only works for a channel on this pico or one of its descendants. Changes state despite being a query.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | webhook channel |

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/revokeChannelSecret?eci=…`, or `<alias>:revokeChannelSecret(eci)` from KRL with `use module io.picolabs.oauth alias <alias>`

### `revokeTokens(eci)` → Map

Revoke all access tokens issued for a channel, without removing its secret. Only works for a channel on this pico or one of its descendants. Changes state despite being a query.

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `eci` | String | yes |  | channel whose tokens to revoke |

**Call:** `GET /sky/query/<eci>/io.picolabs.oauth/revokeTokens?eci=…`, or `<alias>:revokeTokens(eci)` from KRL with `use module io.picolabs.oauth alias <alias>`
