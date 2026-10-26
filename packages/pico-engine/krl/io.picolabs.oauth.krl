ruleset io.picolabs.oauth {
  meta {
    name "OAuth Mesh"
    description <<
      Optional mesh-level OAuth. Install on the root pico to require Bearer tokens on external /sky/*
      for this mesh (except channels tagged mesh-oauth-exempt or didcomm+ingress), and to hold
      per-mesh OAuth configuration (apps, consent policy, defaults).
      Webhook Client Credentials (per channel, oauth-webhook tag) and app Authorization Code grants
      coexist here. Not installed by default.

      use module io.picolabs.oauth alias oauth
    >>
    author "PICOLABS"

    provides meshEnabled, meshRequiresOAuth,
      channelStatus, createChannelSecret, revokeChannelSecret, revokeTokens

    shares meshEnabled, meshRequiresOAuth,
      channelStatus, createChannelSecret, revokeChannelSecret, revokeTokens
  }

  global {
    /**
     * True when this ruleset is installed on the pico. Its presence is the mesh's
     * opt-in to OAuth.
     * @returns Boolean
     */
    meshEnabled = function() {
      true
    }

    /**
     * True when external /sky/* requests on this channel need a Bearer token: the
     * mesh root has io.picolabs.oauth installed and the channel is not tagged
     * mesh-oauth-exempt or didcomm+ingress.
     * @param eci String "channel to check"
     * @returns Boolean
     */
    meshRequiresOAuth = function(eci) {
      oauth:meshRequiresOAuth(eci)
    }

    /**
     * OAuth webhook status of a channel: whether it is eligible (tagged
     * oauth-webhook), whether OAuth is enabled on it, and whether a client secret
     * exists. Includes a reason when the channel is not eligible or not found.
     * @param eci String "channel to inspect"
     * @returns Map "{ eligible, enabled, hasSecret, reason? }"
     */
    channelStatus = function(eci) {
      oauth:channelStatus(eci)
    }

    /**
     * Create (or replace) the Client Credentials secret for a webhook channel and
     * return it. The secret is returned only here; the engine stores a hash, so
     * save it now. Only works for a channel on this pico or one of its descendants.
     * Changes state despite being a query.
     * @param eci String "webhook channel (tagged oauth-webhook); also the client_id"
     * @returns Map "{ client_id, client_secret }"
     */
    createChannelSecret = function(eci) {
      oauth:createChannelSecret(eci)
    }

    /**
     * Revoke a webhook channel's client secret so it can no longer obtain tokens.
     * Only works for a channel on this pico or one of its descendants. Changes
     * state despite being a query.
     * @param eci String "webhook channel"
     * @returns Map "{ ok: true }"
     */
    revokeChannelSecret = function(eci) {
      oauth:revokeChannelSecret(eci)
    }

    /**
     * Revoke all access tokens issued for a channel, without removing its secret.
     * Only works for a channel on this pico or one of its descendants. Changes
     * state despite being a query.
     * @param eci String "channel whose tokens to revoke"
     * @returns Map "{ ok: true }"
     */
    revokeTokens = function(eci) {
      oauth:revokeTokens(eci)
    }
  }

  // Mesh OAuth is keyed off the root pico; installing here has no effect.
  rule reject_non_root_install {
    select when wrangler ruleset_installed where event:attr("rids") >< ctx:rid
    if ctx:parent then ctx:uninstall(ctx:rid)
  }
}
