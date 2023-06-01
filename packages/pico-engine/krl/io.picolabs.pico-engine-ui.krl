ruleset io.picolabs.pico-engine-ui {
  meta {
    version "0.0.0"
    name "pico-engine-ui"
    description "This is the only ruleset the pico-engine-ui.js needs to operate"
    shares box, uiECI, pico, logs, testingECI, name
  }
  global {
    uiECI = function(){
      return ctx:channels
        .filter(function(c){c["tags"].sort().join(",") == "engine,ui"})
        .map(function(c){c["id"]})
        .head()
    }
    getOtherUiECI = function(eci){
      thisPico = ctx:channels.any(function(c){c{"id"}==eci})
      return (eci && not thisPico) => ctx:query(eci, ctx:rid, "uiECI") | null
    }
    testingECI = function(){
      return ent:testingECI
    }
    name = function(){
      ent:name || "Pico"
    }
    box = function(){
      return {
        "eci": uiECI(),
        "parent": getOtherUiECI(ctx:parent),
        "children": ctx:children.map(getOtherUiECI),
        "name": name(),
        "backgroundColor": ent:backgroundColor || "#87cefa",
        "x": ent:x || 100,
        "y": ent:y || 100,
        "width": ent:width || 100,
        "height": ent:height || 100
      }
    }
    pico = function(){
      return {
        "eci": uiECI(),
        "parent": getOtherUiECI(ctx:parent),
        "children": ctx:children.map(getOtherUiECI),
        "channels": ctx:channels,
        "rulesets": ctx:rulesets
      }
    }
    logs = function(){
      logOther = function(entry){
        entry.delete("time")
          .delete("level")
          .delete("msg")
          .delete("txnId")
          .encode()
      }
      logQuery = function(query){
        args = query.get("args").delete("_headers") || {}
        <<QUERY #{query.get("eci")} #{query.get("rid")}/#{query.get("name")} #{args.encode()}>>
      }
      logEvent = function(event){
        attrs = event.get(["data","attrs"]).delete("_headers") || {}
        <<EVENT #{event.get("eci")} #{event.get("domain")}:#{event.get("name")} #{attrs.encode()}>>
      }
      logFirst = function(entry){
        txn = entry.get("txn")
        kind = txn.get("kind")
        kind == "query" => logQuery(txn.get("query")) |
        kind == "event" => logEvent(txn.get("event")) |
        logOther(entry)
      }
      logDetails = function(entry){
        msg = entry.get("msg")
        msg == "txnQueued" => logFirst(entry) |
        msg == "event added to schedule" => entry.get("event").encode() |
        msg == "rule selected" => <<#{entry.get("rid")} : #{entry.get("rule_name")}>> |
        entry.get("level") == "klog" => entry.get("val").encode() || "null" |
        msg.match(re#fired$#) => "" |
        logOther(entry)
      }
      episode_line = function(x,i){
        level = x{"level"}.uc();
        x{"time"}.split("T")[1] +
          " [" +
          level +
          "] "+
          x{"msg"} +
          " " +
          logDetails(x)
      };
      entryMap = function(a,e){
        // a.head() is array of entries; a[1] is whether last entry is eats
        // a[2] is domain:name of the event
        eats = e{"msg"} == "event added to schedule"
        event_dt = eats => e{["event","domain"]} + ":" + e{["event","name"]}
                         | ""
        a[1] && eats && a[2]==event_dt
          => [a.head(),true,event_dt] // omit a duplicate eats
           | [a.head().append(episode_line(e)),eats,event_dt]
      }
      episodes = ctx:logs()
        .collect(function(e){e.get("txnId")})
      episodes.keys()
        .map(function(k){
          episode = episodes.get(k)
          entries = episode
            .reduce(entryMap,[[],false,""]).head()
          return {
            "txnId": k,
            "time": episode.head().get("time"),
            "header": entries.head().split(re# txnQueued #)[1],
            "entries": entries,
          }
        })
        .filter(function(g){
          g{"header"}.match(re#^QUERY .*io.picolabs.pico-engine-ui/#) => false |
          g{"header"}.match(re#^QUERY .*io.picolabs.subscription/established#) => false |
          true
        })
        .reverse()
    }
  }
  rule setup {
    select when engine_ui setup
    ctx:upsertChannel(
      tags = ["engine", "ui"],
      eventPolicy = {
        "allow": [
          { "domain": "engine_ui", "name": "setup" },
          { "domain": "engine_ui", "name": "box" },
          { "domain": "engine_ui", "name": "new" },
          { "domain": "engine_ui", "name": "del" },
          { "domain": "engine_ui", "name": "install" },
          { "domain": "engine_ui", "name": "uninstall" },
          { "domain": "engine_ui", "name": "flush" },
          { "domain": "engine_ui", "name": "new_channel" },
          { "domain": "engine_ui", "name": "del_channel" },
          { "domain": "engine_ui", "name": "testing_eci" },
          { "domain": "engine", "name": "started" },
          { "domain": "wrangler", "name": "subscription" },
          { "domain": "wrangler", "name": "pending_subscription_approval" },
          { "domain": "wrangler", "name": "inbound_rejection" },
          { "domain": "wrangler", "name": "outbound_cancellation" },
          { "domain": "wrangler", "name": "subscription_cancellation" }
        ],
        "deny": []
      },
      queryPolicy = {
        "allow": [
          { "rid": "*", "name": "__testing" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "uiECI" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "box" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "pico" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "logs" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "testingECI" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "name" },
          { "rid": "io.picolabs.subscription", "name": "established" },
          { "rid": "io.picolabs.subscription", "name": "inbound" },
          { "rid": "io.picolabs.subscription", "name": "outbound" },
          { "rid": "io.picolabs.subscription", "name": "wellKnown_Rx" }
        ],
        "deny": []
      }
    )
  }
  rule box {
    select when engine_ui box
    pre {
      validateColor = function(v){
        c = v.as("String").klog("attempting color change")
        c.match(re#^\#[0-9A-F]{6}$#i) => c | (ent:backgroundColor).klog("sticking with existing color")
      }
    }
    always {
      ent:x := event:attrs{"x"}.as("Number") if event:attrs{"x"}
      ent:y := event:attrs{"y"}.as("Number") if event:attrs{"y"}
      ent:width := event:attrs{"width"}.as("Number") if event:attrs{"width"}
      ent:height := event:attrs{"height"}.as("Number") if event:attrs{"height"}
      ent:name := event:attrs{"name"}.as("String") if event:attrs{"name"}
      ent:backgroundColor := event:attrs{"backgroundColor"}.validateColor() if event:attrs{"backgroundColor"}
    }
  }
  rule new {
    select when engine_ui new
    pre {
      name = event:attrs{"name"} || ent:name
      backgroundColor = event:attrs{"backgroundColor"} || ent:backgroundColor
    }
    fired {
      raise wrangler event "new_child_request" attributes
        event:attrs
          .put("name",name)
          .put("backgroundColor",backgroundColor)
    }
  }
  rule del {
    select when engine_ui del
    pre {
      delUiEci = event:attrs{"eci"}
      delEci = ctx:children
        .filter(function(eci){
          other = getOtherUiECI(eci)
          return other == delUiEci
        })
        .head()
    }
    ctx:delPico(delEci)
  }
  rule install {
    select when engine_ui install
    fired {
      raise wrangler event "install_ruleset_request" attributes event:attrs
    }
  }
  rule uninstall {
    select when engine_ui uninstall
    ctx:uninstall(rid=event:attrs{"rid"})
  }
  rule flush {
    select when engine_ui flush
    ctx:flush(url=event:attrs{"url"})
  }
  rule new_channel {
    select when engine_ui new_channel
    ctx:newChannel(
      tags=event:attrs{"tags"},
      eventPolicy=event:attrs{"eventPolicy"},
      queryPolicy=event:attrs{"queryPolicy"}
    )
  }
  rule del_channel {
    select when engine_ui del_channel
    ctx:delChannel(event:attrs{"eci"})
  }
  rule testing_eci {
    select when engine_ui testing_eci
    always {
      ent:testingECI := event:attrs{"eci"}
    }
  }
}
