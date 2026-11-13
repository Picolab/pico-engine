/**
 * Try It! bootstrap for the Collection demo. Install it on a new pico: it
 * creates a Rooms child with the collection and report rulesets, then five more
 * children with the room ruleset. Four ask to join as members; the fifth,
 * Stranger, asks in another role and is turned away. tryIt() reports how many
 * have joined and links to the report.
 *
 * Each child gets its install requests and then the event that uses them. A
 * pico handles events one at a time, in the order they arrive, so the rulesets
 * are installed before that event is handled.
 */
ruleset com.example.collection.bootstrap {
  meta {
    name "Collection"
    description "Shows the collection pattern: members as relationships, accepting and rejecting by role, a ruleset used as a module, and querying every member to report on all of them."
    author "PICOLABS"

    use module io.picolabs.wrangler alias wrangler

    shares tryIt
  }

  global {
    collection_rid = "com.example.collection"
    report_rid = "com.example.collection.report"
    room_rid = "com.example.collection.room"
    xmlui_rid = "io.picolabs.xmlui"
    rooms = [
      {"name": "Kitchen", "temperature": 68},
      {"name": "Office", "temperature": 71},
      {"name": "Garage", "temperature": 64},
      {"name": "Bedroom", "temperature": 75},
      {"name": "Stranger", "temperature": 99, "as": "visitor"}
    ]

    host = function() {
      meta:host.defaultsTo("").replace(re#/$#, "")
    }

    collectionQuery = function(func) {
      installed = ent:collection
        => wrangler:picoQuery(ent:collection, "io.picolabs.wrangler", "installedRIDs") | []
      answer = (installed.typeof() == "Array" && installed >< collection_rid)
        => wrangler:picoQuery(ent:collection, collection_rid, func) | []
      answer.typeof() == "Array" => answer | []
    }

    reportLink = function() {
      channel = ent:collection
        => wrangler:picoQuery(ent:collection, "io.picolabs.wrangler", "channels", {"tags": "collection,app"}).head()
        | null
      channel => {"label": "Rooms", "url": host() + "/ui/" + channel{"id"} + "/" + report_rid + "/"} | null
    }

    /**
     * Progress of this demo's setup, and the links to open when it is ready.
     * @returns Map
     */
    tryIt = function() {
      joined = collectionQuery("members").length()
      turned_away = collectionQuery("rejections").length()
      ready = joined >= 4 && turned_away >= 1
      link = ready => reportLink() | null
      status = {
        "ready": (ready && link) => true | false,
        "stage": ready => "ready" | ent:collection => joined.as("String") + " of 4 rooms joined" | "starting",
        "links": link => [link] | []
      }
      status
    }
  }

  rule start {
    select when wrangler ruleset_installed where event:attr("rids") >< meta:rid
    always {
      raise wrangler event "new_channel_request" attributes {
        "tags": ["try_it"],
        "eventPolicy": {"allow": [], "deny": []},
        "queryPolicy": {"allow": [{"rid": meta:rid, "name": "tryIt"}], "deny": []}
      }
      raise wrangler event "new_child_request" attributes
        {"name": "Rooms", "collection_demo": "collection", "backgroundColor": "#c8e6c9"}
    }
  }

  // The collection pico is set up: install its rulesets, then create the rooms.
  rule set_up_collection {
    select when wrangler child_initialized where event:attr("collection_demo") == "collection"
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
        "attrs": {"absoluteURL": meta:rulesetURI, "rid": collection_rid}
      })
      event:send({
        "eci": child,
        "domain": "wrangler",
        "type": "install_ruleset_request",
        "attrs": {"absoluteURL": meta:rulesetURI, "rid": report_rid}
      })
    }
    always {
      ent:collection := child
      raise collection_demo event "rooms_needed"
    }
  }

  rule create_rooms {
    select when collection_demo rooms_needed
    foreach rooms setting(room)
    always {
      raise wrangler event "new_child_request" attributes room.put("collection_demo", "room")
    }
  }

  // A room is set up: install the room ruleset, then ask it to join.
  rule set_up_room {
    select when wrangler child_initialized where event:attr("collection_demo") == "room"
    pre {
      child = event:attr("eci")
      well_known = wrangler:picoQuery(ent:collection, "io.picolabs.subscription", "wellKnown_Rx"){"id"}
    }
    every {
      event:send({
        "eci": child,
        "domain": "wrangler",
        "type": "install_ruleset_request",
        "attrs": {"absoluteURL": meta:rulesetURI, "rid": room_rid, "temperature": event:attr("temperature")}
      })
      event:send({
        "eci": child,
        "domain": "collection",
        "type": "join_requested",
        "attrs": {"wellKnown_Tx": well_known, "as": event:attr("as") || "member"}
      })
    }
  }
}
