ruleset io.picolabs.logging {
  meta {
    shares __testing, getLogs
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "getLogs" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" } ] }

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
}
