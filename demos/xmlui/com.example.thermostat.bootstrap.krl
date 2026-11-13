/**
 * Try It! bootstrap for the Thermostat demo. Install it on a new pico: it
 * installs io.picolabs.xmlui and com.example.thermostat, then seeds three
 * readings. tryIt() reports progress and links to the dashboard on the
 * thermostat's viewer and admin channels.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.thermostat.bootstrap {
  meta {
    name "Thermostat"
    description "Shows pico views: a dashboard @view, an app @component, the shared settings and theme components, and two channels whose policies give viewers and admins different pages."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    thermostat_rid = "com.example.thermostat"
    xmlui_rid = "io.picolabs.xmlui"
    seed_temperatures = ["70", "72", "75"]

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    appUrl = function(channel) {
      host() + "/ui/" + channel{"id"} + "/" + thermostat_rid + "/"
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      viewer = wrangler:channels(["thermostat", "viewer"]).head()
      admin = wrangler:channels(["thermostat", "admin"]).head()
      ready = (ent:stage == "ready" && viewer && admin) => true | false
      // A map on the line after `| false` would parse as false{...}.
      status = {
        "ready": ready,
        "stage": ent:stage.defaultsTo("starting"),
        "links": ready => [
          {"label": "Dashboard (viewer channel)", "url": appUrl(viewer)},
          {"label": "Dashboard and Settings (admin channel)", "url": appUrl(admin)}
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
        {"absoluteURL": meta:rulesetURI, "rid": thermostat_rid}
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

  rule install_thermostat {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": thermostat_rid}
    }
  }

  rule seed_readings {
    select when wrangler ruleset_installed where event:attr("rids") >< thermostat_rid
    foreach seed_temperatures setting(temperature)
    always {
      raise thermostat event "new_reading" attributes {"temperature": temperature}
      ent:stage := "ready" on final
    }
  }
}
