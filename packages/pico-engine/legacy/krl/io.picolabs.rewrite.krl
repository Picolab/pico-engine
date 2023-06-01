ruleset io.picolabs.rewrite {
  meta {
    shares __testing, getRewrite, picoRewrites, allRewrites
  }
  global {
    __testing = { "queries": [ { "name": "__testing" },
                               { "name": "getRewrite", "args": [ "fpc" ] },
                               { "name": "allRewrites" },
                               { "name": "picoRewrites" },
                               { "name": "picoRewrites", "args": [ "picoID" ] } ],
                  "events": [ { "domain": "rewrite", "type": "new_rewrite",
                                "attrs": [ "fpc", "eci", "kind" ] },
                              { "domain": "rewrite", "type": "not_needed",
                                "attrs": [ "fpc" ]
                              } ] }
    getRewrite = function(fpc) { ent:rewrites{fpc} }
    picoRewrites = function(picoId) {
      channels = picoId => engine:listChannels(picoId)
                         | engine:listChannels();
      picoECIs = channels.map(function(v){v{"id"}});
      ent:rewrites.filter(function(v){picoECIs >< v{"eci"}})
    }
    allRewrites = function() {
      ent:rewrites
    }
  }
  rule initialize {
    select when wrangler ruleset_added where rids >< meta:rid
    fired {
      ent:rewrites := {};
    }
  }
  rule new_rewrite_guard {
    select when rewrite new_rewrite
    if ent:rewrites >< event:attr("fpc") then send_directive("duplicate");
    fired { last; }
  }
  rule new_rewrite {
    select when rewrite new_rewrite
    pre {
      kind = event:attr("kind")
        like re#^event|query$# => event:attr("kind")
                                | "query";
      eci = event:attr("eci");
      fpc = event:attr("fpc");
    }
    send_directive("ok");
    fired {
      ent:rewrites{fpc} := {"eci": eci, "kind": kind };
    }
  }
  rule rewrite_not_needed_guard {
    select when rewrite not_needed
    if not (ent:rewrites >< event:attr("fpc")) then send_directive("not found");
    fired { last; }
  }
  rule rewrite_not_needed {
    select when rewrite not_needed
    pre {
      fpc = event:attr("fpc");
    }
    send_directive("ok");
    fired {
      clear ent:rewrites{fpc};
    }
  }
}
