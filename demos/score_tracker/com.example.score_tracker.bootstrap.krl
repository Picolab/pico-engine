/**
 * Try It! bootstrap for the Score tracker demo. Install it on a new pico: it
 * installs io.picolabs.xmlui and com.example.score_tracker, then registers
 * three contestants and gives them points. tryIt() reports progress and links
 * to the leaderboard.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.score_tracker.bootstrap {
  meta {
    name "Score tracker"
    description "Shows entity variables keyed by id, returning new ids in directives, a sorted query, and a narrow app channel whose policy lets contestants play but not change the pico."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    app_rid = "com.example.score_tracker"
    xmlui_rid = "io.picolabs.xmlui"
    contestants = [
      {"pid": "ada", "first": "Ada", "last": "Lovelace"},
      {"pid": "grace", "first": "Grace", "last": "Hopper"},
      {"pid": "alan", "first": "Alan", "last": "Turing"}
    ]
    seed_points = [
      {"pid": "grace", "points": "40", "descr": "Found the first bug"},
      {"pid": "ada", "points": "30", "descr": "Wrote the first program"},
      {"pid": "alan", "points": "25", "descr": "Broke a code"},
      {"pid": "ada", "points": "15", "descr": "Explained the engine"}
    ]

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["score_tracker", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Leaderboard", "url": host() + "/ui/" + app{"id"} + "/" + app_rid + "/"}
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

  rule register_contestants {
    select when wrangler ruleset_installed where event:attr("rids") >< app_rid
    foreach contestants setting(c)
    always {
      raise score event "new_participant" attributes c
      raise try_it event "contestants_registered" on final
    }
  }

  rule add_points {
    select when try_it contestants_registered
    foreach seed_points setting(entry)
    always {
      raise score event "new_points" attributes entry
      ent:stage := "ready" on final
    }
  }
}
