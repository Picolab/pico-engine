ruleset io.picolabs.logging {
  meta {
    shares __testing
  }
  global {
    __testing = { "queries": [ { "name": "__testing" } ],
                  "events": [ { "domain": "picolog", "type": "reset" },
                              { "domain": "picolog", "type": "begin" } ] }
  }

  rule picolog_reset {
    select when picolog reset
    fired {
      ent:status := false;
    }
  }

  rule picolog_begin {
    select when picolog begin
    fired {
      ent:status := true
    }
  }

  rule pico_ruleset_added {
    select when wrangler ruleset_added where event:attr("rids") >< meta:rid
    fired {
      raise picolog event "begin"
    }
  }
}
