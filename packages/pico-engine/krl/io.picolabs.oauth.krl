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
    /** True when this ruleset is installed on the pico (mesh OAuth opt-in marker). */
    meshEnabled = function() {
      true
    }

    /** True when the mesh root has io.picolabs.oauth (mesh lock may still be skipped via mesh-oauth-exempt on a channel). */
    meshRequiresOAuth = function(eci) {
      oauth:meshRequiresOAuth(eci)
    }

    channelStatus = function(eci) {
      oauth:channelStatus(eci)
    }

    createChannelSecret = function(eci) {
      oauth:createChannelSecret(eci)
    }

    revokeChannelSecret = function(eci) {
      oauth:revokeChannelSecret(eci)
    }

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
