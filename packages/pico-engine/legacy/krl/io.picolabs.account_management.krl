//-----------------------------------------------------------------------------
//--------                       Account Management                   ---------
//-----------------------------------------------------------------------------
ruleset io.picolabs.account_management {
  meta {
    shares __testing
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ],
                  "events": [ { "domain": "owner", "type": "creation",
                                "attrs": [ "name", "password", "method" ] },
                              { "domain": "wrangler", "type": "ruleset_added",
                                "attrs": [ "rids" ] },
                              { "domain": "owner", "type": "eci_requested",
                                "attrs": [ "owner_id" ] } ] }

    nameExists = function(ownername){
      ent:owners.defaultsTo({}) >< ownername
    }

    //this assumes you already checked whether or not the entered info was a DID
    getEciFromOwnerName = function(name){
      exists = nameExists(name);
      exists => ent:owners{name}{"eci"} | "No user found"
    }
    
    //rids required for an owner pico
    //  which depends on authentication method
    base_rids = {
      "password":["io.picolabs.owner_authentication"]
      ,"did":    ["io.picolabs.did_auth_only"]
    }

    owner_policy_definition = {
      "name": "only allow owner/authenticate events",
      "event": {"allow": [{"domain": "owner", "type": "authenticate"}]}
    }

  }//end global

//
//New owner account registration and management

rule create_admin{
  select when wrangler ruleset_added where rids.klog("rids") >< meta:rid.klog("meta rid")
  pre {
    ok_in_this_pico = wrangler:parent_eci() == "";
  }
  if ok_in_this_pico then every {
    engine:newPolicy(owner_policy_definition) setting(owner_policy);
    engine:newChannel(meta:picoId, "Router_" + time:now(), "route_to_owner") setting(new_channel)
  }
  fired{
    ent:ownerPolicy := owner_policy;
    ent:owners := {"root": {"eci": new_channel{"id"}}};
    raise wrangler event "install_rulesets_requested"
      attributes event:attrs.put({"rids":"io.picolabs.owner_authentication"});
  }
}

  rule login_from_did {
    select when owner eci_requested
    pre {
      did = event:attr("owner_id");
      pico_id = did => engine:getPicoIDByECI(did) | null;
      login = function(c){
        c{"id"}==did && c{"type"}=="secret" && c{"name"}=="login"};
      channel = pico_id => engine:listChannels(pico_id).filter(login).head()
                         | null;
   }
   if pico_id && channel then
     send_directive("did",{"method":"did","pico_id":pico_id,"eci":did})
   fired {
     last;
   }
  }

  rule guard_against_missing_policy{
    select when owner eci_requested where ent:ownerPolicy.isnull()
    engine:newPolicy(owner_policy_definition) setting(owner_policy)
    fired{
      ent:ownerPolicy := owner_policy
    }
  }

  rule eci_from_owner_name{
    select when owner eci_requested owner_id re#(.+)# setting(owner_id)
    pre {
      eci = getEciFromOwnerName(owner_id.klog("owner_id"));
    }
    if eci != "No user found" then noop();
    fired{
      raise owner event "eci_found" attributes event:attrs.put({"eci":eci});
    }
    else{
      raise owner event "no_such_owner_id" attributes event:attrs;
    }
  }

  rule provide_temporary_owner_eci {
    select when owner eci_found eci re#^(.+)$# setting(eci)
    pre {
      pico_id = eci => engine:getPicoIDByECI(eci.klog("eci"))
                     | null;
      channel_name = "authenticate_"+time:now();
    }
    if pico_id then every{
      engine:newChannel(pico_id,channel_name,"temporary",ent:ownerPolicy{"id"})
        setting(new_channel);
      send_directive("Returning eci from owner name", {"eci": new_channel{"id"}});
    }
    fired {
      raise owner event "login_attempt"
        attributes event:attrs.put({ "timestamp": time:now() });
      schedule owner event "authenticate_channel_expired"
        at time:add(time:now(), {"minutes": 5})
        attributes {"eci": new_channel{"id"}};
    }
    else{
      raise owner event "no_such_pico"
        attributes event:attrs.put({ "timestamp": time:now() });
    }
  }

  rule remove_expired_channel {
    select when owner authenticate_channel_expired eci re#(.+)# setting(eci)
    engine:removeChannel(eci)
  }

  rule create_owner{
    select when owner creation
    // owner_id is required String if name (String) is not provided
    // password is optional String defaults to ""
    // method is optional String from ["password","did"] defaults to "password"
    // rids is optional ;-delimited String or Array of Strings defaults to []
    pre{
      name = event:attr("name").defaultsTo(event:attr("owner_id"));
      password = event:attr("password").defaultsTo("");
      new_rids = event:attr("rids");
      method = event:attr("method") || "password";
      owner_rids = base_rids{method} || [];
      rids_type = new_rids.typeof();
      rids = rids_type == "String" => owner_rids.append(new_rids.split(";"))
           | rids_type == "Array"  => owner_rids.append(new_rids)
           |                          owner_rids;
      exists = nameExists(name).klog("nameExists");
    }
    if not exists then // may need to check pico name uniqueness
      send_directive("Creating owner", {"ownername":name,"method": method});

    fired{
      raise wrangler event "new_child_request"
        attributes event:attrs.put({"event_type":"account","rids":rids, "password": password,"name":name});
    }
    else{
      raise owner event "creation_failure"
        attributes event:attrs;
    }
  }

  rule owner_name_taken{
    select when owner creation_failure
    pre{}
    send_directive("ownername taken",{"ownername": event:attr("name")});
  }

  rule owner_token{
    select when owner token_created event_type re#account#
    pre{
      a=event:attrs.klog("all attrs: ")
      rs_attrs = event:attr("rs_attrs");
      new_owner = {"eci": event:attr("eci")}
    }
    fired{
      ent:owners := ent:owners.defaultsTo({}).put(rs_attrs{"name"}, new_owner);
    }
  }

  rule owner_pico_not_found { // used by ui to indicate if admin has this rule installed.
    select when owner eci_requested where event:attr("owner_id").isnull()
    send_directive("here it is",{"owner_id":null,"method":"password"});
  }

  rule delete_owner_pico {
    select when information child_deleted
    pre {
      name = event:attr("name");
    }
    if ent:owners >< name then noop();
    fired {
      clear ent:owners{name};
    }
  }

}