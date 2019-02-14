ruleset io.picolabs.logging {
  meta {
    shares __testing
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" },
                              { "domain": "picolog", "type": "prune",
                                "attrs": [ "leaving" ] } ] }
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
