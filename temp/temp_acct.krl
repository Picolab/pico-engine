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
      schedule owner event "code_expired" at time:add(time:now(), {"minutes": 5});
    }
  }
  rule owner_match_code {
    select when owner code_presented
    if event:attr("code") == ent:code && event:attr("nonce") == ent:nonce then
      send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    always {
      raise owner event "code_expired";
    }
  }
  rule owner_code_expired {
    select when owner code_expired
    fired {
      ent:code := null;
      ent:nonce := null;
    }
  }
  rule owner_authenticate { // any password will be accepted for now
    select when owner authenticate
    if event:attr("nonce") == ent:nonce && event:attr("password") == ent:password
    then send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    always {
      raise owner event "code_expired";
    }
  }
}
