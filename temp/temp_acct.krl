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
  rule owner_eci_provided {
    select when owner eci_provided
    fired {
      ent:code := random:word() + "-" + random:word();
      schedule owner event "code_expired" at time:add(time:now(), {"minutes": 5});
    }
  }
  rule owner_match_code {
    select when owner code_presented
    if event:attr("code") == ent:code then
      send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    always {
      raise owner event "code_expired";
    }
  }
  rule owner_code_expired {
    select when owner code_expired
    fired {
      ent:code := null;
    }
  }
  rule owner_authenticate { // any password will be accepted
    select when owner authenticate
    send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
  }
}
