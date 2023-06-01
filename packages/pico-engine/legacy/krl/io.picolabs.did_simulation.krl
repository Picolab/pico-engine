ruleset io.picolabs.did_simulation {
  meta {
    shares __testing, servers, serverForDID
  }
  global {
    __testing = { "queries": [ { "name": "__testing" }
                             , { "name": "servers" }
                             , { "name": "serverForDID", "args": [ "did" ] }
                             ]
                ,"events": [ { "domain":"did", "type":"npe_added", "attrs":["server"] }
                           , { "domain":"did", "type":"npe_removed", "attrs":["server"] }
                           ]
                }
    servers = function() {
      ent:servers
    }
    this_npe = function() {
      host = meta:host;
      has_protocol = host.substr(0,7) == "http://";
      has_protocol => host.substr(7) | host
    }
    tryServer = function(s,path) {
      response = http:get("http://"+s+path);
      response{"status_code"} == 200 => s | null
    }
    serverForDID = function(did) {
      path = "/sky/cloud/"+did+"/io.picolabs.wrangler/myself";
      engine:listChannels().filter(function(c){c{"id"} == did}).length() > 0
        => ent:servers[0] // this server because this very pico!
         | ent:servers.map(function(s){tryServer(s,path)})
                      .filter(function(r){r})[0]
    }
  }
  rule initialize {
    select when wrangler ruleset_added where rids >< meta:rid
    always {
      ent:servers := [this_npe()];
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
  rule server_removed {
    select when did npe_removed
    pre {
      server = event:attr("server");
      on_list = ent:servers >< server;
    }
    if on_list then noop();
    fired {
      ent:servers := ent:servers.filter(function(s){s != server});
    }
  }
}
