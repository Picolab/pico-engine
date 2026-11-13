/**
 * Try It! bootstrap for the Bootstrap and channels demo. Install it on a new
 * pico. It installs io.picolabs.xmlui, then com.example.visitors.format, then
 * com.example.visitors with a greeting in its install configuration. Each step
 * waits for the ruleset_installed event of the one before, because each needs
 * the one before. The visitor log creates its own channel when it is
 * installed. tryIt() reports progress and links to the visitor log.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.visitors.bootstrap {
  meta {
    name "Bootstrap and channels"
    description "Shows a bootstrap ruleset installing an app in dependency order and configuring it, and an app ruleset that creates its own channel on install, with a policy built from its schema, updated in place instead of duplicated."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    xmlui_rid = "io.picolabs.xmlui"
    format_rid = "com.example.visitors.format"
    app_rid = "com.example.visitors"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["visitors", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Visitor log", "url": host() + "/ui/" + app{"id"} + "/" + app_rid + "/"}
        ] | []
      }
      status
    }
  }

  // Step 1: a channel for tryIt(), and the views runtime (unless it's here).
  rule start {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    pre {
      has_xmlui = wrangler:installedRIDs() >< xmlui_rid
    }
    if not has_xmlui then noop()
    fired {
      ent:stage := "installing " + xmlui_rid
      raise wrangler event "install_ruleset_request" attributes
        {"url": host() + "/krl/" + xmlui_rid + ".krl"}
    }
    else {
      raise bootstrap event "xmlui_ready"
    }
    finally {
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
    }
  }

  // Step 2: the module the app uses.
  rule install_format {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
             or bootstrap xmlui_ready
    always {
      ent:stage := "installing " + format_rid
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": format_rid}
    }
  }

  // Step 3: the app, configured. Its own install rule creates its channel.
  rule install_app {
    select when wrangler ruleset_installed where event:attr("rids") >< format_rid
    always {
      ent:stage := "installing " + app_rid
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": app_rid, "config": {"greeting": "Welcome"}}
    }
  }

  rule app_installed {
    select when wrangler ruleset_installed where event:attr("rids") >< app_rid
    always {
      ent:stage := "ready"
    }
  }
}
