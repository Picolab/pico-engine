ruleset io.picolabs.wrangler.profile {
  meta {
    description <<
    Uses the Wrangler datastore ruleset (io.picolabs.ds) to store profile information for an owner/user of a pico.
    >>
    shares __testing, getProfile, getName, getDescription
    use module io.picolabs.ds alias datastore
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    __testing = { "queries":
      [ { "name": "__testing" }
      , { "name": "getProfile", "args": [] }
      , { "name": "getName", "args": [] }
      , { "name": "getDescription", "args": [] }
      ] , "events":
      [ //{ "domain": "d1", "type": "t1" }
      //, { "domain": "d2", "type": "t2", "attrs": [ "a1", "a2" ] }
      ]
    }
    
    initialProfile = function() {
      {
        "name":"Unknown",
        "description":"Blank"
      }
    }
    
    getProfile = function() {
      datastore:allDomainData(meta:rid)
    }
    
    getName = function() {
      datastore:getItem(meta:rid, "name")
    }
    
    getDescription = function() {
      datastore:getItem(meta:rid, "description")
    }
  }
  
  rule set_up {
    select when wrangler ruleset_added where rids >< meta:rid
    pre {
      ds_installed = wrangler:installedRulesets() >< "io.picolabs.ds"
    }
    if ds_installed then
    noop()
    fired {
      raise wrangler event "ds_is_installed" attributes event:attrs
    } 
    else {
      raise wrangler event "install_rulesets_requested" attributes event:attrs.put({
        "rids":"io.picolabs.ds"
      })
    }
  }
  
  rule set_up_ds_entry {
    select when wrangler ds_ready or
                wrangler ds_is_installed
    pre {
      givenInitialProfile = event:attr("initialProfile")
      initialProfile = givenInitialProfile && givenInitialProfile.typeof() == "Map" => givenInitialProfile | initialProfile()
    }
    always {
      raise wrangler event "ds_assign_map_to_domain" attributes {
        "domain":meta:rid,
        "map":initialProfile,
        "co_id":meta:rid
      }
    }
  }
  
  rule informWhenProfileReady {
    select when wrangler ds_domain_updated where co_id == meta:rid
    always {
      raise wrangler event "profile_initialized" attributes event:attrs
    }
  }
  
  
}
