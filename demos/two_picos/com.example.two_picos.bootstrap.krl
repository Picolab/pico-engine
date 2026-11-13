/**
 * Try It! bootstrap for the two picos demo. Install it on a new pico: it creates
 * two children, Alice (com.example.two_picos.answerer) and Bob
 * (com.example.two_picos.asker), and introduces Bob to Alice's well-known
 * channel. Bob asks for a relationship, Alice accepts, and Bob asks his first
 * question. tryIt() reports progress and links to both picos' pages.
 */
ruleset com.example.two_picos.bootstrap {
  meta {
    name "Two picos talking"
    description "Shows relationships: asking through a well-known channel, accepting by role, and one pico querying another over the relationship with subscription:queryOnSub."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    answerer_rid = "com.example.two_picos.answerer"
    asker_rid = "com.example.two_picos.asker"
    xmlui_rid = "io.picolabs.xmlui"

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    appLink = function(role, rid, label) {
      child = ent:children{role}
      channel = child => wrangler:picoQuery(child, "io.picolabs.wrangler", "channels",
        {"tags": "two_picos," + role}).head() | null
      channel => {"label": label, "url": host() + "/ui/" + channel{"id"} + "/" + rid + "/"} | null
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      ready = ent:stage == "ready"
      links = ready => [
        appLink("asker", asker_rid, "Bob's conversation"),
        appLink("answerer", answerer_rid, "What Alice knows")
      ].filter(function(link) { link }) | []
      status = {"ready": ready, "stage": ent:stage.defaultsTo("starting"), "links": links}
      status
    }
  }

  rule start {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    always {
      ent:stage := "creating picos"
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
      raise wrangler event "new_child_request" attributes
        {"name": "Alice", "two_picos_role": "answerer", "backgroundColor": "#ffe0b2"}
      raise wrangler event "new_child_request" attributes
        {"name": "Bob", "two_picos_role": "asker", "backgroundColor": "#bbdefb"}
    }
  }

  // A child is set up: install io.picolabs.xmlui, then its role's ruleset.
  rule set_up_child {
    select when wrangler child_initialized where event:attr("two_picos_role")
    pre {
      role = event:attr("two_picos_role")
      child = event:attr("eci")
      rid = role == "answerer" => answerer_rid | asker_rid
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
        "attrs": {"absoluteURL": meta:rulesetURI, "rid": rid}
      })
    }
    always {
      ent:children{role} := child
    }
  }

  // Both children have their rulesets: introduce Bob to Alice.
  rule child_ready {
    select when two_picos child_ready
      role re#^(answerer|asker)$#
      setting(role)
    pre {
      ready = ent:ready.defaultsTo({}).put(role, true)
      both = (ready{"answerer"} && ready{"asker"}) => true | false
    }
    always {
      ent:ready{role} := true
      ent:stage := "installing rulesets"
      raise two_picos event "both_ready" if both
    }
  }

  rule introduce {
    select when two_picos both_ready
    pre {
      well_known = wrangler:picoQuery(ent:children{"answerer"}, "io.picolabs.subscription", "wellKnown_Rx"){"id"}
    }
    event:send({
      "eci": ent:children{"asker"},
      "domain": "two_picos",
      "type": "introduce",
      "attrs": {"wellKnown_Tx": well_known}
    })
    always {
      ent:stage := "introducing Bob to Alice"
    }
  }

  rule connected {
    select when two_picos connected
    always {
      ent:stage := "ready"
    }
  }
}
