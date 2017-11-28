ruleset temp_acct {
  meta {
    shares __testing, method, code, passwordOK, pwd_needs_encoding
  }
  global {
    __testing = { "queries": [ { "name": "__testing" }
                             , { "name": "pwd_needs_encoding" }
                             , { "name": "passwordOK", "args": [ "password" ] }
                             ]
                , "events": [ { "domain": "owner", "type": "pwd_needs_encoding", "attrs": [ "password" ] }
                            , { "domain": "owner", "type": "new_password", "attrs": [ "password", "new_password" ] }
                            ]
                }
    method = function() {
      ent:method || "password"
    }
    code = function() {
      ent:code || "code words expired"
    }
    one_way_hash = function(password) {
      math:hash("sha256",password)
    }
    passwordOK = function(password) {
      ent:password.defaultsTo("") == ""
      || ent:password == password
      || ent:password{"password"} == one_way_hash(password)
    }
    pwd_needs_encoding = function() {
      ent:password.typeof() == "String"
    }
  }
  rule owner_admin {
    select when owner admin
    pre {
      txnId = event:attr("txnId");
      legit = (txnId == meta:txnId);
    }
    if legit then noop();
    fired {
      ent:owner_id := "Root";
      ent:password := "toor";
    }
  }
  rule owner_creation {
    select when owner creation
    if ent:owner_id != "Root" then noop();
    fired {
      ent:owner_id := event:attr("owner_id");
      ent:method   := event:attr("method");
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
  rule owner_authenticate {
    select when owner authenticate
    if event:attr("nonce") == ent:nonce && passwordOK(event:attr("password"))
    then send_directive("success",{"pico_id":meta:picoId,"eci":meta:eci});
    fired {
      raise owner event "pwd_needs_encoding" attributes { "password": ent:password }
        if pwd_needs_encoding();
    }
    finally {
      raise owner event "nonce_used";
    }
  }
  rule owner_new_password {
    select when owner new_password
    if passwordOK(event:attr("password")) then noop();
    fired {
      ent:method := ent:method.defaultsTo("password");
      raise owner event "pwd_needs_encoding" attributes { "password": event:attr("new_password") };
    }
  }
  rule owner_pwd_needs_encoding {
    select when owner pwd_needs_encoding password re#^(.*)$# setting (password)
    fired {
      ent:password := { "password": one_way_hash(password) };
      ent:password{"last_encoding"} := time:now();
    }
  }
}
