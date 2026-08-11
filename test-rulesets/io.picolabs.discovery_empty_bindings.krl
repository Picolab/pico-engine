ruleset io.picolabs.discovery_empty_bindings {
  meta {
    use module io.picolabs.wrangler alias wrangler
  }
  global {
    app = {"name": "empty_bindings", "version": "1.0"};

    // Intentionally empty — like journal before fix
    bindings = function() {
      {}
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
