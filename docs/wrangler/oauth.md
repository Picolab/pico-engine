# OAuth: io.picolabs.oauth

*Optional. Not installed by default. Install it on the root pico only. API reference: [io.picolabs.oauth](/rulesets/io.picolabs.oauth).*

`io.picolabs.oauth` turns on OAuth for a mesh: once it is installed on the mesh's root pico, most requests to `/sky/*` need an access token (a bearer token). It also holds the mesh's OAuth configuration.

Without it, a channel's policy is the only gate on `/sky/*`: anyone with the ECI can use what the policy allows. The developer UI and the engine's own calls use passkey sessions on `/c/*`, and OAuth doesn't change that.

## Install it

On the root pico's **Rulesets** tab, install `https://<your engine>/krl/io.picolabs.oauth.krl`. To turn OAuth off for the mesh again, uninstall it.

## What needs a token

| Channel | Needs a bearer token on `/sky/*`? |
|---------|-----------------------------------|
| Tagged `didcomm` and `ingress` | No: DIDComm traffic between engines |
| Tagged `oauth-webhook` | Yes, always, even without this ruleset |
| Tagged `mesh-oauth-exempt` | No: opts out of the mesh lock |
| Any other, with this ruleset on the root | Yes |
| Any other, without it | No |

Use `mesh-oauth-exempt` for webhook channels whose senders can't add an `Authorization` header. Their event policy still applies. If a channel has both `oauth-webhook` and `mesh-oauth-exempt`, `oauth-webhook` wins.

## Two kinds of credentials

| Grant | For | Client id | Reaches |
|-------|-----|-----------|---------|
| Client credentials | Incoming webhooks (from services such as GitHub or Stripe) | The channel's ECI | That one channel |
| Authorization code with PKCE | Apps such as Home Assistant | `app_…` | The whole mesh |

**Webhook credentials.** Tag a channel `oauth-webhook`. On the **Channels** tab, create credentials for it: the client id is the ECI, and the secret is shown once. Exchange them for a token at `POST /oauth/token` with `grant_type` `client_credentials`. The token (`oat_…`) works only on `/sky/*` for that ECI. Family, relationship, and system channels can't have credentials.

**Apps.** With this ruleset installed, register an app under **Settings** → **OAuth apps**, with its redirect URIs. The app sends the user to `/oauth/authorize`, the user approves with their passkey, and the app exchanges the code for tokens at `/oauth/token`. A public app's access token lasts one hour. Refreshing returns a new refresh token and invalidates the old one. Presenting that old refresh token again revokes the new one too.

## From KRL

The ruleset shares functions for the mesh's state, for rulesets on the root pico:

| Function | Returns |
|----------|---------|
| `meshEnabled()` | Whether OAuth is on for this mesh |
| `meshRequiresOAuth(eci)` | Whether a request on that channel needs a token |
| `channelStatus(eci)` | A channel's OAuth status |
| `createChannelSecret(eci)`, `revokeChannelSecret(eci)`, `revokeTokens(eci)` | Manage a webhook channel's credentials |

Creating a new channel secret revokes the tokens already made from the old one.

## Effects elsewhere

- [Pico views](/pico-views) on an OAuth mesh need an access token in the browser; see their OAuth section.
- The Try It! demos aren't meant for OAuth meshes: their pages send no token.
- The channel MCP server (`/mcp/:eci`) and the whole-mesh server (`/mcp/mesh/:eci`) need a bearer token. Connecting Claude or another remote client is [AI tools over MCP](/developing/mcp-ai-tools). A request without a token gets `401` and `WWW-Authenticate: Bearer resource_metadata="…", scope="mesh:read mesh:act"`. The metadata URL is `/.well-known/oauth-protected-resource/mcp/{eci}` (and `…/mcp/mesh/{eci}` for the whole-mesh endpoint). The authorization server document is `/.well-known/oauth-authorization-server`. PKCE is S256 only. A token is bound to the `resource` it was issued for: `{engine}/sky` on Sky routes, `{engine}/mcp/{eci}` on that channel's MCP URL, or `{engine}/mcp/mesh/{eci}` on that mesh URL (authorization-code tokens only). A token with no `resource` (a webhook or an older app token) still works on `/sky/*` and is rejected at MCP. `mesh:read` covers schemas and queries; `mesh:act` covers events. A call that needs a scope the token does not have gets `403` and `error="insufficient_scope"`. `mesh:admin` is reserved and unlocks nothing in this release. A client-credentials token for a channel MCP URL receives `mesh:read` and `mesh:act` when the client does not name a scope.
- A `client_id` that is an https URL is fetched as a Client ID Metadata Document. The approval screen shows that client's name, host, and page, and the mesh being approved. Pre-registered apps are unchanged.

The package README's OAuth section has the HTTP details for every grant.
