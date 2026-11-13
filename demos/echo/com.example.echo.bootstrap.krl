/**
 * Try It! bootstrap for the Echo demo. Install it on a new pico: it installs
 * io.picolabs.xmlui and com.example.echo. tryIt() reports progress and links
 * to the Echo page.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.echo.bootstrap {
  meta {
    name "Echo"
    description "Shows the basics of events: selecting an event with select when, matching an attribute with a regex, answering with send_directive, and sending the same event from a page and from curl."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    app_rid = "com.example.echo"
    xmlui_rid = "io.picolabs.xmlui"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["echo", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Echo page", "url": host() + "/ui/" + app{"id"} + "/" + app_rid + "/"}
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
        {"absoluteURL": meta:rulesetURI, "rid": app_rid}
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

  rule install_app {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": app_rid}
    }
  }

  rule app_installed {
    select when wrangler ruleset_installed where event:attr("rids") >< app_rid
    always {
      ent:stage := "ready"
    }
  }
}
