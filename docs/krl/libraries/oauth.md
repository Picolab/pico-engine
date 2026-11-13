# oauth

The `oauth` library reads and manages a mesh's OAuth state. It exists for [`io.picolabs.oauth`](/wrangler/oauth), the optional ruleset that turns OAuth on for a mesh; other rulesets normally use the functions that ruleset shares instead.

## Functions

`oauth:meshRequiresOAuth(eci)`

Whether a request to `/sky/*` on that channel needs a bearer token.

`oauth:channelStatus(eci)`

A channel's OAuth status: a map with `eligible` (whether it can have webhook credentials), `enabled`, and `hasSecret`. An eligible channel also has `clientId` (its ECI) and, once it has a secret, `createdAt`; one that isn't eligible has a `reason`.

`oauth:createChannelSecret(eci)`

Creates client credentials for a webhook channel (one tagged `oauth-webhook`) and returns them. The client id is the ECI, and the secret is returned only this once. Creating a new secret revokes the tokens made from the old one.

`oauth:revokeChannelSecret(eci)`

Removes a webhook channel's secret. Returns `{"ok": true}`.

`oauth:revokeTokens(eci)`

Revokes the access tokens made for a webhook channel. Returns `{"ok": true}`.

The last three work only on channels of the pico running the ruleset.

See [OAuth: io.picolabs.oauth](/wrangler/oauth) for what needs a token and how webhooks and apps get one.
