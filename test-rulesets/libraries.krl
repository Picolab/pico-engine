ruleset io.picolabs.test.libraries {
  meta {
    shares csvOut, csvIn, escaped, unescaped, calendar, feedTitle, telnetState, longTrips
  }
  global {
    longTrips = function(fleet, min) {
      fleet.query("$.vehicles[*].trips[?@.miles > " + min + "]").map(function(t) { t{"miles"} })
    }
    csvOut = function(rows, fields) {
      csv:from_array(rows, fields)
    }
    csvIn = function(text) {
      csv:to_array(text)
    }
    escaped = function(s) {
      uri:escape(s)
    }
    unescaped = function(s) {
      uri:unescape(s)
    }
    calendar = function() {
      ical:from_array([{"dtstart": "2026-11-20", "summary": "Demo day"}], {"name": "Picos"})
    }
    feedTitle = function(xml) {
      feed = rss:parse(xml)
      rss:channel(feed, "title") + " / " + rss:first(feed){"title"}
    }
    telnetState = function() {
      {"connect": ent:connect, "reply": ent:reply, "events": ent:events.defaultsTo([])}
    }
  }
  rule telnet_connect {
    select when test telnet_connect
    telnet:connect({
      "port": event:attr("port").as("Number"),
      "negotiationMandatory": false,
      "initialLFCR": false,
      "sendTimeout": 300
    }) setting(res)
    fired {
      ent:connect := res
    }
  }
  rule telnet_send {
    select when test telnet_send
    telnet:sendCMD(event:attr("command")) setting(reply)
    fired {
      ent:reply := reply.trim()
    }
  }
  rule telnet_events {
    select when telnet closed or telnet error
    always {
      ent:events := ent:events.defaultsTo([]).append(event:name)
    }
  }
}
