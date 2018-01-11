ruleset io.picolabs.owner_authentication {
  meta {
    use module io.picolabs.wrangler alias wrangler
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

  rule channel_needed {
    select when wrangler ruleset_added where rids.klog("rids") >< meta:rid.klog("meta rid")
    pre { parent_eci = wrangler:parent_eci(){"parent"}.klog("parent eci");}
      if parent_eci then every{
        engine:newChannel( meta:picoId ,"Router_"+time:now(),"route_from_root")
          setting(new_channel)
        event:send(
          { "eci": parent_eci,
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
    }else{
      ent:password := "toor"; // if no parent create root default password. this is a security hole....
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

  rule owner_new_password {
    select when owner new_password
    if loginAttempt(event:attr("password").defaultsTo("")) then noop();
    fired {
      ent:password := event:attr("new_password");
    }
  }

}