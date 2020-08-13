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
                      "attrs": [  ] } ,
                    { "domain": "owner", "type": "cleanup_needed",
                      "attrs": [  ] }
                   ] }

    one_way_hash = function(salt,password) {
      math:hash("sha256",salt + ":" + password);
    }

   loginAttempt = function(password){
     _password = ent:password.defaultsTo("");
     _password.typeof() == "String" => _password == password |
     ent:password{"password"} == one_way_hash(ent:password{"salt"},password)
   }

    pwd_needs_encoding = function() {
      ent:password.typeof() == "String"
    }

    superfluous_channels = function() {
      engine:listChannels()
        .filter(function(v){
          v{"name"} like re#^Authentication_.*Z$#
          && v{"type"} == "authenticated"
        })
        .sort(function(a,b){
          b{"name"} cmp a{"name"}
        })
        .tail()
    }

  }

  rule channel_needed {
    select when wrangler ruleset_added where rids.klog("rids") >< meta:rid.klog("meta rid")
    pre { parent_eci = wrangler:parent_eci().klog("parent eci");}
      if parent_eci then every{
        engine:newChannel( meta:picoId ,"Router_"+time:now(),"route_from_root")
          setting(new_channel)
        event:send(
          { "eci": parent_eci,
            "domain": "owner", "type": "token_created",
            "attrs": ({
              "eci":new_channel{"id"},
              "event_type":"account",
              "rs_attrs":event:attrs
              })
          }
        );
      }
    fired{
      // ent:password := event:attr("rs_attrs"){"password"}.klog("Password being saved: ");
      raise owner event "pwd_needs_encoding"
        attributes { "password": event:attr("password") };
    }else{
      // if no parent create root default password. this is a security hole....
      raise owner event "pwd_needs_encoding" attributes { "password": "toor" };
    }
  }

  rule cleanup_superfluous_authenticated_channels {
    select when owner cleanup_needed
    foreach superfluous_channels() setting(channel)
    engine:removeChannel(channel{"id"})
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
    fired {
      raise owner event "pwd_needs_encoding" attributes { "password": password }
        if pwd_needs_encoding();
    } else {
      raise owner event "authentication_failed" attributes event:attrs;
    }
    finally {
      raise owner event "authenticate_channel_used"
        attributes {"eci":meta:eci}
    }
  }

  rule remove_used_authenticate_channel {
    select when owner authenticate_channel_used eci re#(.+)# setting(eci)
    pre {
      channel = engine:listChannels()
        .filter(function(c){c{"id"}==eci})
        .head();
      ok = channel
        && channel{"type"} == "temporary"
        && channel{"name"} like re#^authenticate_.*Z$#
    }
    if ok then
      engine:removeChannel(eci);
  }

  rule owner_new_password {
    select when owner new_password
    if loginAttempt(event:attr("password").defaultsTo("")) then noop();
    fired {
      raise owner event "pwd_needs_encoding"
        attributes { "password": event:attr("new_password") };
    }
  }

  rule owner_pwd_needs_encoding {
    select when owner pwd_needs_encoding password re#^(.*)$# setting(password)
    pre {
      salt = random:uuid();
      _pwd = one_way_hash(salt,password);
    }
    fired {
      ent:password := { "salt":          salt,
                        "password":      _pwd,
                        "last_encoding": time:now() };
    }
  }

}
