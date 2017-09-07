ruleset temp_acct_mgr {
  meta {
    shares __testing, oldECI
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "oldECI", "args": [ "p" ] } ],
                  "events": [ { "domain": "owner", "type": "eci_requested",
                                "attrs": [ "owner_id" ] },
                              { "domain": "owner", "type": "deletion_requested",
                                "attrs": [ "owner_id" ] },
                              { "domain": "owner", "type": "need_sync" },
                              { "domain": "owner", "type": "creation",
                                "attrs": [ "owner_id", "dname", "method", "password" ] } ] }
    skyPre = meta:host + "/sky/cloud/";
    skyPost = "/io.picolabs.visual_params/dname";
    ownerIdForPico = function(p) {
      ent:owners.filter(function(v){v{"pico_id"} == p}).keys()[0]
    }
    oldECI = function(p) {
      owner_id = ownerIdForPico(p);
      ent:owners{[owner_id,"eci"]};
    }
    createPico = defaction(){
      every {
        engine:newPico() setting(child);
        engine:newChannel(child{"id"}, "main", "secret") setting(channel);
        engine:installRuleset(child{"id"}, "io.picolabs.pico");
        event:send(
          { "eci": channel{"id"}, "eid": 153,
            "domain": "pico", "type": "child_created",
            "attrs": {
              "parent":    myself(),
              "new_child": {"id": child{"id"}, "eci": channel{"id"}},
              "rs_attrs":  event:attrs()
            }});
}
      returns {"id": child{"id"}, "eci": channel{"id"}}
    }
  }

  rule owner_initialize {
    select when owner need_sync
             or owner creation
             or owner eci_requested
             or owner deletion_requested
    if not ent:owners then noop();
    fired {
      ent:owners := {};
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
    }
    engine:newChannel(pico_id,time:now(),"to owner") setting(new_channel);
    always {
      ent:owners{owner_id} := 
        { "pico_id": pico_id,
          "eci": new_channel{"id"},
          "dname": dname,
          "method": "password"
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
    pre {
      owner_id = event:attr("owner_id");
      method = event:attr("method");
      code = method == "code";
      dname = event:attr("dname");
    }
    every {
      createPico() setting(child);
      engine:installRuleset(child[0]{"id"}, "temp_acct");
      event:send({"eci":child[0]{"eci"}, "domain":"owner", "type":"creation", "attrs":event:attrs()});
      engine:newChannel(child[0]{"id"},time:now(),"to owner") setting(new_channel);
      send_directive(
        "new owner pico",
        { "owner_id": owner_id,
          "pico_id": child[0]{"id"},
          "eci": new_channel{"id"},
          "method": method});
    }
    always {
      raise pico event "new_child_created" attributes child[0].klog("CHILD");
      raise owner event "new_owner_pico_with_code" attributes {"pico_id":child[0]{"id"}} if code;
      ent:owners{owner_id} := 
        { "pico_id": child[0]{"id"},
          "eci": new_channel{"id"},
          "dname": dname,
          "method": method
        };
    }
  }

  rule owner_new_owner_pico_with_code {
    select when owner new_owner_pico_with_code
    pre {
      pico_id = event:attr("pico_id");
    }
    every {
      engine:newChannel(pico_id,"code query","secret") setting(code_query_channel);
      send_directive("new owner pico code query channel",{"eci":code_query_channel{"id"}});
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
    send_directive("here it is",{"owner_id":event:attr("owner_id"),"method":"password"});
  }

  rule owner_deletion_requested {
    select when owner deletion_requested
    pre {
      owner_id = event:attr("owner_id");
      entry = ent:owners{owner_id};
    }
    if ent:owners >< owner_id then
      send_directive("owner_id deletion requested",
        {"owner_id": owner_id, "pico_id": entry{"pico_id"}});
    fired {
      raise pico event "delete_child_request_by_pico_id" attributes entry;
    }
  }

  rule pico_child_deleted {
    select when pico child_deleted
    pre {
      child_id = event:attr("id");
      owner_id = ent:owners.filter(function(v){v{"pico_id"}==child_id}).keys()[0];
    }
    if owner_id then noop();
    fired {
      ent:owners{owner_id} := null;
    }
  }
}