ruleset temp_acct_mgr {
  meta {
    shares __testing, oldECI
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "oldECI", "args": [ "p" ] } ],
                  "events": [ { "domain": "owner", "type": "eci_requested",
                                "attrs": [ "owner_id" ] },
                              { "domain": "owner", "type": "need_sync" } ] }
    skyPre = meta:host + "/sky/cloud/";
    skyPost = "/io.picolabs.visual_params/dname";
    validMethod = function(raw) {
      raw == "password" => raw |
      raw == "code"     => raw
                         | "password"
    }
    ownerIdForPico = function(p) {
      ent:owners.filter(function(v){v{"pico_id"} == p}).keys()[0]
    }
    oldECI = function(p) {
      owner_id = ownerIdForPico(p);
      ent:owners{[owner_id,"eci"]};
    }
  }

  rule owner_initialize {
    select when owner need_sync
             or owner creation
             or owner eci_requested
             or pico ruleset_added
    if not ent:owners then noop();
    fired {
      ent:owners := {};
    }
  }

  rule pico_ruleset_added {
    select when pico ruleset_added rid re#temp_acct_mgr#
    every {
      engine:installRuleset(url="temp_acct.krl", base=meta:rulesetURI);
      engine:newChannel(name=time:now(),type="to owner") setting(new_channel);
    }
    fired {
      raise owner event "admin" attributes { "txnId": meta:txnId };
      ent:owners{"Root"} := 
        { "pico_id": meta:picoId,
          "eci": new_channel{"id"},
          "dname": "Root Pico",
          "method": "password"
        };
    }
  }

  rule owner_need_sync {
    select when owner need_sync
    foreach engine:listChildren() setting (pico_id)
    pre {
      old_eci = oldECI(pico_id);
      use_eci = old_eci || engine:listChannels(pico_id)[0]{"id"}
      dname = http:get(skyPre+use_eci+skyPost){"content"}.decode();
      owner_id = ownerIdForPico(pico_id) || dname;
      raw = http:get(skyPre+use_eci+"/temp_acct/method"){"content"}.decode();
      method = validMethod(raw.klog("RAW_METHOD"));
    }
    engine:newChannel(pico_id,time:now(),"to owner") setting(new_channel);
    always {
      ent:owners{owner_id} := 
        { "pico_id": pico_id,
          "eci": new_channel{"id"},
          "dname": dname,
          "method": method
        };
      raise owner event "channel_expiration" attributes {"eci":old_eci} if old_eci
    }
  }

  rule owner_channel_expiration {
    select when owner channel_expiration
    engine:removeChannel(event:attr("eci"));
  }
        
  rule owner_creation_owner_id_uniqueness_guard {
    select when owner creation
    pre {
      owner_id = event:attr("owner_id");
    }
    if ent:owners >< owner_id then
      send_directive("owner_id already in use",{"owner_id": owner_id});
    fired {
      last;
    }
  }

  rule owner_creation {
    select when owner creation
    fired {
      raise pico event "new_child_request" attributes event:attrs();
    }
  }

  rule pico_new_child_created {
    select when pico new_child_created
    pre {
      child_id = event:attr("id");
      child_eci = event:attr("eci");
      rs_attrs = event:attr("rs_attrs");
      owner_id = rs_attrs{"owner_id"};
      method = rs_attrs{"method"};
      code = method == "code";
      dname = rs_attrs{"dname"} || owner_id;
    }
    every {
      engine:installRuleset(child_id, url="temp_acct.krl", base=meta:rulesetURI);
      event:send({"eci":child_eci, "domain":"owner", "type":"creation", "attrs":rs_attrs});
      engine:newChannel(child_id,time:now(),"to owner") setting(new_channel); // CHANGE?
      send_directive(
        "new owner pico",
        { "owner_id": owner_id,
          "pico_id": child_id,
          "eci": new_channel{"id"},
          "method": method});
    }
    always {
      raise owner event "new_owner_pico_with_code"
        attributes rs_attrs.put({"owner_pico_id":child_id}) if code;
      ent:owners{owner_id} := 
        { "pico_id": child_id,
          "eci": new_channel{"id"},
          "dname": dname,
          "method": method
        };
    }
  }

  rule owner_new_owner_pico_with_code {
    select when owner new_owner_pico_with_code
    pre {
      owner_pico_id = event:attr("owner_pico_id");
    }
    every { // CHANGE?
      engine:newChannel(owner_pico_id,"code query","secret") setting(code_query_channel);
      send_directive("new owner pico code query channel",
        event:attrs().put("eci",code_query_channel{"id"}));
    }
  }

  rule find_owner_pico_by_pico_id {
    select when owner eci_requested
    pre {
      pico_id = event:attr("owner_id");
      looks_right = pico_id.length() == 25 && pico_id.ord() == "c".ord();
      owner_id = ownerIdForPico(pico_id);
      entry = ent:owners{owner_id};
      eci = entry{"eci"};
      options = {"owner_id":owner_id,"pico_id":pico_id,"eci":eci,"method":"did"};
    }
    if looks_right && eci then
      send_directive("here it is",options);
    fired {
      last;
    }
  }

  rule find_owner_pico_by_pico_id_only {
    select when owner eci_requested
    pre {
      pico_id = event:attr("owner_id");
      looks_right = pico_id.length() == 25 && pico_id.ord() == "c".ord();
      is_my_child = engine:listChildren() >< pico_id;
      options = {"pico_id":pico_id,"method":"did"};
    }
    if looks_right && is_my_child then every {
      engine:newChannel(pico_id,time:now(),"to owner") setting(new_channel);
      send_directive("here it is",options.put({"eci":new_channel{"id"}}));
    }
    fired {
      last;
    }
  }

  rule find_owner_pico_by_name {
    select when owner eci_requested
    pre {
      owner_id = event:attr("owner_id");
      entry = ent:owners{owner_id};
      pico_id = entry{"pico_id"};
      eci = entry{"eci"};
      method = entry{"method"};
      nonce = random:word();
      options = {"owner_id":owner_id,"pico_id":pico_id,"eci":eci,"method":method,"nonce":nonce};
    }
    if eci then every {
      send_directive("here it is",options);
      event:send({"eci":eci, "domain":"owner", "type":"eci_provided", "attrs":options});
    }
    fired {
      last;
      ent:lastOne := options;
    }
  }

  rule owner_pico_not_found {
    select when owner eci_requested
    if event:attr("owner_id") then
    send_directive("here it is",{"owner_id":event:attr("owner_id"),"method":"password"});
    fired {
      last;
    }
  }

  rule owner_pico_not_found_options {
    select when owner eci_requested
    send_directive("options",{"immediateLogin":true,"rid":meta:rid});
  }

  rule pico_child_deleted {
    select when information child_deleted
    pre {
      child_id = event:attr("id");
      owner_id = ent:owners.filter(function(v){v{"pico_id"}==child_id}).keys()[0];
    }
    if owner_id then noop();
    fired {
      clear ent:owners{owner_id};
    }
  }
}
