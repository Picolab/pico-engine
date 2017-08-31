ruleset temp_acct {
  meta {
    shares __testing, code
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ],
                  "events": [ ] }
    code = function() {
      ent:code || "code words expired"
    }
  }
  rule owner_creation {
    select when owner creation
    fired {
      ent:owner_id := event:attr("owner_id");
      ent:password := event:attr("password");
    }
  }
  rule owner_eci_provided {
    select when owner eci_provided
    fired {
      ent:code := random:word() + "-" + random:word();
      ent:nonce := event:attr("nonce");
      schedule owner event "nonce_cleanup" at time:add(time:now(), {"minutes": 5}) setting(exp);
      ent:exp := exp;
    }
  }
  rule owner_match_code {
    select when owner code_presented
    if event:attr("code") == ent:code && event:attr("nonce") == ent:nonce then
      send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    always {
      raise owner event "nonce_used";
    }
  }
  rule owner_nonce_used {
    select when owner nonce_used
             or pico intent_to_orphan
    if ent:exp then schedule:remove(ent:exp);
    always {
      raise owner event "nonce_cleanup"
    }
  }
  rule owner_nonce_cleanup {
    select when owner nonce_cleanup
    always {
      ent:code := null;
      ent:nonce := null;
      ent:exp := null;
    }
  }
  rule owner_authenticate { // any password will be accepted for now
    select when owner authenticate
    if event:attr("nonce") == ent:nonce && event:attr("password") == ent:password
    then send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    always {
      raise owner event "nonce_used";
    }
  }
}
