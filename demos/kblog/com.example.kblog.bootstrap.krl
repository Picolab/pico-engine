/**
 * Try It! bootstrap for KBlog. Install it on a new pico: it installs
 * io.picolabs.xmlui and the four KBlog rulesets, one after another, each when
 * the one it needs is in place. Then it submits three posts the way an author
 * would. tryIt() reports progress and links to the blog on the reader and
 * author channels.
 *
 * This ruleset does not use io.picolabs.xmlui as a module, because it is the
 * one that installs it.
 */
ruleset com.example.kblog.bootstrap {
  meta {
    name "KBlog"
    description "Shows an application built from cooperating rulesets: an event hierarchy across rulesets, writes as events and reads as queries, multi-page views with routes, a component from another ruleset, and reader and author channels."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    xmlui_rid = "io.picolabs.xmlui"
    config_rid = "com.example.kblog.config"
    data_rid = "com.example.kblog.data"
    kblog_rid = "com.example.kblog"
    posting_rid = "com.example.kblog.posting"
    posts = [
      {
        "author": "Phil Windley",
        "title": "Event hierarchies",
        "body": "Events are nouns and rules are verbs. Each rule in KBlog does one thing and raises an event saying what is now true. Post something and watch the **event path**."
      },
      {
        "author": "Phil Windley",
        "title": "Rulesets in layers",
        "body": "Posting is its own ruleset. Its install creates the author channel, the only channel that can submit a post."
      },
      {
        "author": "Code Monkey",
        "title": "Code Monkey was here",
        "body": ":)"
      }
    ]

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    link = function(tags, label, path) {
      channel = wrangler:channels(tags).head()
      channel => {"label": label, "url": host() + "/ui/" + channel{"id"} + "/" + kblog_rid + "/" + path} | null
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      links = [
        link(["kblog", "reader"], "Read the blog (reader channel)", ""),
        link(["kblog", "author"], "Write a post (author channel)", "#/new")
      ].filter(function(l) { l })
      ready = (ent:stage == "ready" && links.length() == 2) => true | false
      status = {"ready": ready, "stage": ent:stage.defaultsTo("starting"), "links": ready => links | []}
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
        {"absoluteURL": meta:rulesetURI, "rid": config_rid}
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

  rule install_config {
    select when wrangler ruleset_installed where event:attr("rids") >< xmlui_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": config_rid}
    }
  }

  rule install_data {
    select when wrangler ruleset_installed where event:attr("rids") >< config_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": data_rid}
    }
  }

  // The pages use the config and data rulesets as modules, so they come next.
  rule install_pages {
    select when wrangler ruleset_installed where event:attr("rids") >< data_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": kblog_rid}
    }
  }

  rule install_posting {
    select when wrangler ruleset_installed where event:attr("rids") >< kblog_rid
    always {
      raise wrangler event "install_ruleset_request" attributes
        {"absoluteURL": meta:rulesetURI, "rid": posting_rid}
    }
  }

  rule submit_posts {
    select when wrangler ruleset_installed where event:attr("rids") >< posting_rid
    foreach posts setting(post)
    always {
      raise kblog event "post_submitted" attributes post
      ent:stage := "ready" on final
    }
  }
}
