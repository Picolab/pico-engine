ruleset io.picolabs.oauth {
  meta {
    name "OAuth Mesh"
    description <<
      Optional mesh-level OAuth. Install on the root pico to require Bearer tokens on external /sky/*
      for this mesh, and to hold per-mesh OAuth configuration (apps, consent policy, defaults).
      Webhook Client Credentials (per channel) and app Authorization Code grants coexist here.
      Not installed by default.

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

    /** True when external /sky/* for eci requires a Bearer token (mesh lock or oauth-webhook tag). */
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
}
