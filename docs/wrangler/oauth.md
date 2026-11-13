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

**Apps.** With this ruleset installed, register an app under **Settings** → **OAuth apps**, with its redirect URIs. The app sends the user to `/oauth/authorize`, the user approves with their passkey, and the app exchanges the code for tokens at `/oauth/token`.

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
- The mesh MCP server (`/mcp/:eci`) needs a bearer token.

The package README's OAuth section has the HTTP details for every grant.
