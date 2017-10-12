ruleset io.picolabs.did_simulation {
  meta {
    shares __testing, servers
  }
  global {
    __testing = { "queries": [ { "name": "__testing" }
                             , { "name": "servers" }
                             ]
                ,"events": [ { "domain":"did", "type":"npe_added", "attrs":["server"] }
                           ]
                }
    servers = function() {
      ent:servers
    }
  }
  rule initialize {
    select when wrangler ruleset_added where rids >< meta:rid
    always {
      ent:servers := [];
      ent:cache := {};
    }
  }
  rule server_additional {
    select when did npe_added
    pre {
      server = event:attr("server");
      not_on_list = not (ent:servers >< server);
    }
    if not_on_list then noop();
    fired {
      ent:servers := ent:servers.append(server);
    }
  }
}
