# Rulesets in this folder

Are treated specially by the pico-engine
and by the Engine Rulesets page (ruleset.html).

## Operations

When adding or removing a file from this list,
you must also change  the code in 
the setupServer.js file to match.

```
        // TODO based off pe.start(system_rulesets)
        // _.set(data, ['r', rid, 'is_system_ruleset'], /^io\.picolabs/.test(rid))
        var isSystemRuleset = false
        if ( // files in `krl` folder
          rid === 'io.picolabs.account_management' ||
          rid === 'io.picolabs.collection' ||
          rid === 'io.picolabs.cookies' ||
          rid === 'io.picolabs.did_auth_only' ||
          rid === 'io.picolabs.did_simulation' ||
          rid === 'io.picolabs.ds' ||
          rid === 'io.picolabs.logging' ||
          rid === 'io.picolabs.null_owner' ||
          rid === 'io.picolabs.oauth_server' ||
          rid === 'io.picolabs.owner_authentication' ||
          rid === 'io.picolabs.policy' ||
          rid === 'io.picolabs.rewrite' ||
          rid === 'io.picolabs.subscription' ||
          rid === 'io.picolabs.test' ||
          rid === 'io.picolabs.use_honeypot' ||
          rid === 'io.picolabs.visual_params' ||
          rid === 'io.picolabs.wrangler' ||
          rid === 'io.picolabs.wrangler.profile' ||
          false
        ) {
          isSystemRuleset = true
        }
        _.set(data, ['r', rid, 'is_system_ruleset'], isSystemRuleset)
      })
```

