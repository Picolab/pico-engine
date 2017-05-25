ruleset io.picolabs.logging {
  meta {
    shares __testing, getLogs
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "getLogs" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" },
                              { "domain": "picolog", "type": "prune",
                                "attrs": [ "leaving" ] } ] }

    getLogs = function() {
      { "status": ent:status,
        "logs": ent:logs }
    }
  }

  rule picolog_reset {
    select when picolog reset
    noop()
    fired {
      ent:status := false;
      raise picolog event "empty" attributes {}
    }
  }

  rule picolog_empty {
    select when picolog empty
    noop()
    fired {
      ent:logs := {};
      raise picolog event "emptied" attributes {}
    }
  }

  rule picolog_begin {
    select when picolog begin
    noop()
    fired {
      ent:status := true
    }
  }

  rule picolog_prune {
    select when picolog prune
    pre {
      episodes = ent:logs.keys()
      old_size = episodes.length()
      remove = old_size - event:attr("leaving")
      keys_to_remove = remove <= 0 || remove > old_size
                         => []
                          | episodes.slice(remove - 1)
    }
    if keys_to_remove.length() > 0 then noop()
    fired {
      ent:logs := ent:logs.filter(function(v,k){not (keys_to_remove >< k)})
    }
  }

  rule pico_ruleset_added {
    select when pico ruleset_added where rid == "io.picolabs.logging"
    noop()
    fired {
      ent:logs := {};
      ent:status := event:attr("status")
    }
  }
}
