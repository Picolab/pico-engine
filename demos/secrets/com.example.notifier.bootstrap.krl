/**
 * Try It! bootstrap for the Configuration and secrets demo. Install it on a new
 * pico: it installs io.picolabs.xmlui and com.example.notifier here, and creates
 * a Hook service child, installing com.example.hook_service there with a
 * random token in its install configuration. The hook service hands back its
 * webhook URL. The bootstrap sends one message before configuring the notifier
 * (not sent), configures it with the URL, and sends another (delivered).
 * tryIt() reports progress and links to both pages.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.notifier.bootstrap {
  meta {
    name "Configuration and secrets"
    description "Shows getting secrets into a ruleset with install configuration or an event, keeping a rule idle with where until it is configured, keeping operator events off the app channel, and where secrets stay visible."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    notifier_rid = "com.example.notifier"
    hook_rid = "com.example.hook_service"
    xmlui_rid = "io.picolabs.xmlui"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    inboxLink = function() {
      channel = ent:hook_service
        => wrangler:picoQuery(ent:hook_service, "io.picolabs.wrangler", "channels", {"tags": "hook_service,app"}).head()
        | null
      channel => {"label": "Hook service inbox", "url": host() + "/ui/" + channel{"id"} + "/" + hook_rid + "/"} | null
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      app = wrangler:channels(["notifier", "app"]).head()
      ready = (ent:stage == "ready" && app) => true | false
      links = ready => [
        {"label": "Notifier", "url": host() + "/ui/" + app{"id"} + "/" + notifier_rid + "/"},
        inboxLink()
      ].filter(function(link) { link }) | []
      status = {"ready": ready, "stage": ent:stage.defaultsTo("starting"), "links": links}
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
        {"absoluteURL": meta:rulesetURI, "rid": notifier_rid}
    }
    finally {
      ent:stage := "installing"
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
      raise wrangler event "new_child_request" attributes
        {"name": "Hook service", "secrets_demo": "hook_service", "backgroundColor": "#ffe0b2"}
    }
  }

  rule install_notifier {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": notifier_rid}
    }
  }

  // The hook service pico is set up: install its rulesets, with a new token in
  // the install configuration.
  rule set_up_hook_service {
    select when wrangler child_initialized where event:attr("secrets_demo") == "hook_service"
    pre {
      child = event:attr("eci")
    }
    every {
      event:send({
        "eci": child,
        "domain": "wrangler",
        "type": "install_ruleset_request",
        "attrs": {"url": host() + "/krl/" + xmlui_rid + ".krl"}
      })
      event:send({
        "eci": child,
        "domain": "wrangler",
        "type": "install_ruleset_request",
        "attrs": {"absoluteURL": meta:rulesetURI, "rid": hook_rid, "config": {"token": random:uuid()}}
      })
    }
    always {
      ent:hook_service := child
      ent:stage := "setting up the hook service"
    }
  }

  // The hook service handed out its webhook URL: show the notifier idle, then
  // configure it, then send a message that is delivered.
  rule configure_notifier {
    select when hook_service webhook_url_issued
      webhook_url re#(.+)#
      setting(url)
    always {
      raise notifier event "message" attributes {"text": "Sent before the webhook was set"}
      raise notifier_config event "new_webhook" attributes {"webhook_url": url}
      raise notifier event "message" attributes {"text": "Hello from the notifier"}
      ent:stage := "ready"
    }
  }
}
