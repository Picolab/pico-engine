ruleset io.picolabs.did_auth_only {
  meta {
    use module io.picolabs.wrangler alias wrangler
    shares __testing
  }
  global {
    __testing = { "queries":
      [ { "name": "__testing" }
      //, { "name": "entry", "args": [ "key" ] }
      ] , "events":
      [ //{ "domain": "d1", "type": "t1" }
      //, { "domain": "d2", "type": "t2", "attrs": [ "a1", "a2" ] }
      ]
    }
  }
  rule channel_needed {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    pre {
      parent_eci = wrangler:parent_eci();
    }
    if parent_eci then every{
      engine:newChannel( meta:picoId ,"Router_"+time:now(),"route_from_root")
        setting(new_channel)
      event:send(
        { "eci": parent_eci,
          "domain": "owner", "type": "token_created",
          "attrs": {
            "eci":new_channel{"id"},
            "event_type":"account",
            "rs_attrs":event:attrs
            }
        });
    }
  }
}
