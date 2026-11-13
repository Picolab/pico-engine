/**
 * Try It! bootstrap for the child tasks demo. Install it on a new pico: it
 * installs io.picolabs.xmlui and com.example.task_runner, then starts three
 * tasks of different sizes. tryIt() reports progress and links to the Tasks
 * page.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.task_runner.bootstrap {
  meta {
    name "Child pico tasks"
    description "Shows the child pico lifecycle: creating a child with extra attributes, installing a ruleset on it, reporting to the parent, and deleting itself, so the parent never waits."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    app_rid = "com.example.task_runner"
    xmlui_rid = "io.picolabs.xmlui"
    seed_tasks = ["1000", "10000", "30000"]

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["task_runner", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Tasks", "url": host() + "/ui/" + app{"id"} + "/" + app_rid + "/"}
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
    always {
      ent:stage := "installing"
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
      raise wrangler event "install_ruleset_request" attributes
        {"url": host() + "/krl/" + xmlui_rid + ".krl"}
        if not has_xmlui
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": app_rid}
        if has_xmlui
    }
  }

  rule install_app {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": app_rid}
    }
  }

  rule start_tasks {
    select when wrangler ruleset_installed where event:attr("rids") >< app_rid
    foreach seed_tasks setting(n)
    always {
      raise task event "start" attributes {"n": n}
      ent:stage := "ready" on final
    }
  }
}
