ruleset io.picolabs.z_owner_authentication {
  meta {
    use module io.picolabs.pico alias wrangler
    shares __testing
  }
  global {
    __testing =
      { "queries": [ { "name": "__testing", "name":"getManifoldPico" } ],
        "events": [ { "domain": "owner", "type": "authenticate",
                      "attrs": [ "password" ] } ,
                    { "domain": "wrangler", "type": "ruleset_added",
                      "attrs": [  ] }
                   ] }

   loginAttempt = function(password){
     _password = ent:password.defaultsTo("");
     _password == password
   }
  }

  rule store_admin_password{
    select when owner admin
    pre{}
    noop()
    fired{
      ent:password := "toor"
    }
  }

  rule channel_needed {
    select when wrangler ruleset_added where rids.klog("rids") >< meta:rid.klog("meta rid")
    pre { }
      every{
        engine:newChannel( meta:picoId ,"Router_"+time:now(),"route_from_root")
          setting(new_channel)
        event:send(
          { "eci": wrangler:parent_eci(){"parent"}.klog("parent eci"),
            "domain": "owner", "type": "token_created",
            "attrs": ({
              "eci":new_channel{"id"},
              "event_type":"account",
              "rs_attrs":event:attrs()
              })
          }
        );
      }
    fired{
      ent:password := event:attr("rs_attrs"){"password"}.klog("Password being saved: ");
    }
  }

  rule authenticate{
    select when owner authenticate
    pre{
      password = event:attr("password").defaultsTo("");
      validPass = loginAttempt(password);
    }
    if validPass then every{
      engine:newChannel(meta:picoId, "Authentication_" + time:now(), "authenticated") setting(new_channel)
      send_directive("Obtained Token",{"eci": new_channel{"id"},
                                        "pico_id": meta:picoId});

    }
  }
}