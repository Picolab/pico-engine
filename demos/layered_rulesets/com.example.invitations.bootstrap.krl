/**
 * Try It! bootstrap for the Layered rulesets demo. Install it on a new pico: it
 * installs io.picolabs.xmlui and the base com.example.invitations ruleset, and
 * stops there. The Invitations page adds the two add-ons one at a time, so you
 * can see what each one changes. tryIt() reports progress and links to the
 * page.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.invitations.bootstrap {
  meta {
    name "Layered rulesets"
    description "Shows rule chaining and layering: rules that each do one thing and raise an event, and add-on rulesets, installed one at a time, that select the same event or a raised one to change the pico without editing the base."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    base_rid = "com.example.invitations"
    xmlui_rid = "io.picolabs.xmlui"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["invitations", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Invitations", "url": host() + "/ui/" + app{"id"} + "/" + base_rid + "/"}
        ] | []
      }
      status
    }
  }

  rule start {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      has_xmlui = wrangler:installedRIDs() >< xmlui_rid
    }
    if not has_xmlui then noop()
    fired {
      raise wrangler event "install_ruleset_request" attributes
        {"url": host() + "/krl/" + xmlui_rid + ".krl"}
    }
    else {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": base_rid}
    }
    finally {
      ent:stage := "installing"
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
    }
  }

  rule install_base {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": base_rid}
    }
  }

  // Only the base. The page adds the layers.
  rule base_installed {
    select when wrangler ruleset_installed where event:attr("rids") >< base_rid
    always {
      ent:stage := "ready"
    }
  }
}
