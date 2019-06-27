ruleset io.picolabs.logging {
  meta {
    logging off
    shares __testing, fmtLogs
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "fmtLogs" } ],
                  "events": [ { "domain": "picolog", "type": "credentials", "attrs": [ "username", "password" ] },
                              { "domain": "picolog", "type": "no_credentials" },
                              { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" } ] }
    cred = function(){
      ent:user.isnull() || ent:pass.isnull() => null |
      { "username": ent:user, "password": ent:pass}
    }
    fmtLogs = function(){
      episode_line = function(x,i){
        level = x{"krl_level"}.uc();
        x{"time"}+" | [" + level + "] "+x{"msg"}
      };
      episode = function(log_entries,key){
        first_line = log_entries[0];
        {}.put(
          first_line{"time"}+" | "+first_line{"msg"},
          log_entries.map(episode_line)
        )
      };
      url = meta:host+"/api/pico/"+meta:picoId+"/logs";
      http:get(url, auth=cred()){"content"}
        .decode()
        .filter(function(x){x})
        .sort(function(a,b){a{"time"} cmp b{"time"}})
        .collect(function(x){x{"txn_id"}})
        .map(episode)
        .values()
        .reverse()
        .reduce(function(a,x){a.put(x)},{})
    }
  }

  rule picolog_reset {
    select when picolog reset
    noop()
    fired {
      ent:status := false;
    }
  }

  rule picolog_begin {
    select when picolog begin
    noop()
    fired {
      ent:status := true
    }
  }

  rule pico_ruleset_added {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    fired {
      ent:status := true;
    }
  }

  rule take_notice_of_credentials {
    select when picolog credentials
      username re#^(.+)$#
      password re#^(.+)$#
      setting(username,password)
    fired {
      ent:user := username;
      ent:pass := password
    }
  }
  rule clear_credentials {
    select when picolog no_credentials
    fired {
      clear ent:user;
      clear ent:pass
    }
  }
}
