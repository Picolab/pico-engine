ruleset io.picolabs.discovery_test {
  meta {
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    app = {"name": "discovery_test", "version": "1.0"};

    bindings = function() {
      {
        "version": 1,
        "queries": [
          {"name": "ping"},
          {"name": "secret"}
        ],
        "events": [
          {"domain": "discovery_test", "name": "open", "attrs": []},
          {"domain": "discovery_test", "name": "restricted", "attrs": []}
        ]
      }
    }

    ping = function() {
      "pong"
    }

    secret = function() {
      "classified"
    }
  }

  rule discovery {
    select when discovery capabilities
    send_directive("discovery capability", {
      "app": app,
      "rid": meta:rid,
      "bindings": wrangler:filterBindingsForCaller(
        bindings(),
        event:attr("eci"),
        meta:rid
      )
    });
  }
}
