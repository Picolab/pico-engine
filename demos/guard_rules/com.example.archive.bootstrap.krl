/**
 * Try It! bootstrap for the Guard rules demo. Install it on a new pico: it
 * installs io.picolabs.xmlui and com.example.archive. Then, in one go, it asks
 * for the archive five times and tries to add a note before the archive exists.
 * The guard lets one request through and the gate refuses the early note. When
 * the archive is created, it adds a note that is stored. tryIt() reports
 * progress and links to the Archive page.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.archive.bootstrap {
  meta {
    name "Guard rules"
    description "Shows guard rules for idempotent requests, a gate rule that stops later rules with last, and why rule order within a ruleset matters."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    app_rid = "com.example.archive"
    xmlui_rid = "io.picolabs.xmlui"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["archive", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Archive", "url": host() + "/ui/" + app{"id"} + "/" + app_rid + "/"}
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

  rule ask_five_times {
    select when wrangler ruleset_installed where event:attr("rids") >< app_rid
    foreach [1, 2, 3, 4, 5] setting(n)
    always {
      ent:stage := "asking for the archive"
      raise archive event "needed" attributes {"try": n}
      raise archive event "note_added" attributes {"text": "Too early"} on final
    }
  }

  rule add_a_note {
    select when archive archive_created where ent:stage != "ready"
    always {
      raise archive event "note_added" attributes {"text": "Written after the archive was created"}
      ent:stage := "ready"
    }
  }
}
