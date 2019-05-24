ruleset io.picolabs.logging {
  meta {
    logging off
    shares __testing, fmtLogs
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "fmtLogs" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" } ] }
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
      http:get(url){"content"}
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
}
