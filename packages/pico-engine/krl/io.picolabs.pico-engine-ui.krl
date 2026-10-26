ruleset io.picolabs.pico-engine-ui {
  meta {
    version "0.0.0"
    name "pico-engine-ui"
    description "This is the only ruleset the pico-engine-ui.js needs to operate"
    shares box, uiECI, pico, logs, testingECI, testingHistory, testingSaved, name, needsStartupLayout
  }
  global {
    /**
     * The ECI of this pico's UI channel (tagged engine,ui), used by the developer
     * UI to send engine_ui events and queries to this pico.
     * @returns String
     */
    uiECI = function(){
      return ctx:channels
        .filter(function(c){c["tags"].sort().join(",") == "engine,ui"})
        .map(function(c){c["id"]})
        .head()
    }
    // Cached UI channel ECIs for parent/child links. Populated at child creation
    // and backfilled on engine started. box()/pico() read these maps only — no
    // cross-pico ctx:query — to avoid deadlocks (#493).
    uiEciForChild = function(familyEci){
      ent:child_ui_ecis{familyEci}
    }
    childUiEcis = function(){
      ctx:children
        .map(uiEciForChild)
        .filter(function(eci){eci})
    }
    /**
     * The channel the developer UI's Testing tab last selected for sending events
     * and queries to this pico, or null.
     * @returns String
     */
    testingECI = function(){
      return ent:testingECI
    }
    testingHistoryCap = 50
    /**
     * Recent Testing-tab sends for this pico, keyed by ruleset rid (newest first).
     * @param rid String optional "ruleset id; omit for the full map rid → entries"
     * @returns Map or Array
     */
    testingHistory = function(rid = null) {
      rid.isnull() || rid == "" => ent:testing_history.defaultsTo({}) |
      ent:testing_history{rid}.defaultsTo([])
    }
    /**
     * Named Testing-tab requests kept on this pico, keyed by ruleset rid.
     * @param rid String optional ruleset id; omit for the full map rid → entries
     * @returns Map or Array
     */
    testingSaved = function(rid = null) {
      rid.isnull() || rid == "" => ent:testing_saved.defaultsTo({}) |
      ent:testing_saved{rid}.defaultsTo([])
    }
    /**
     * This pico's display name in the developer UI ("Pico" if never set).
     * @returns String
     */
    name = function(){
      ent:name || "Pico"
    }
    needsStartupLayout = function(){
      ent:x.isnull() && ent:y.isnull()
    }
    /**
     * How the developer UI draws this pico: name, color, position, size, and the
     * UI channels of its parent and children.
     * @returns Map "{ eci, parent, children, name, backgroundColor, x, y, width, height }"
     */
    box = function(){
      return {
        "eci": uiECI(),
        "parent": ent:parent_ui_eci,
        "children": childUiEcis(),
        "name": name(),
        "backgroundColor": ent:backgroundColor || "#87cefa",
        "x": ent:x || 100,
        "y": ent:y || 100,
        "width": ent:width || 125,
        "height": ent:height || 90
      }
    }
    /**
     * This pico's channels (with their policies) and installed rulesets, plus the
     * UI channels of its parent and children. A quick way to see what a pico is.
     * @returns Map "{ eci, parent, children, channels, rulesets }"
     */
    pico = function(){
      return {
        "eci": uiECI(),
        "parent": ent:parent_ui_eci,
        "children": childUiEcis(),
        "channels": ctx:channels,
        "rulesets": ctx:rulesets
      }
    }
    /**
     * Recent activity on this pico, grouped by transaction, newest first: each
     * incoming event or query with the rules it selected, klog output, and errors.
     * The developer UI's own queries are left out.
     * @returns Array "[ { txnId, time, header, entries } ]"
     */
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
    uiChannelEventPolicy = function() {
      {
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
          { "domain": "engine_ui", "name": "update_channel" },
          { "domain": "engine_ui", "name": "testing_eci" },
          { "domain": "engine_ui", "name": "testing_history_record" },
          { "domain": "engine_ui", "name": "testing_history_clear" },
          { "domain": "engine_ui", "name": "testing_saved_upsert" },
          { "domain": "engine_ui", "name": "testing_saved_delete" },
          { "domain": "engine", "name": "started" },
          { "domain": "engine", "name": "ruleset_set_changed" },
          { "domain": "wrangler", "name": "subscription" },
          { "domain": "wrangler", "name": "relationship" },
          { "domain": "wrangler", "name": "pending_subscription_approval" },
          { "domain": "wrangler", "name": "pending_relationship_approval" },
          { "domain": "wrangler", "name": "inbound_rejection" },
          { "domain": "wrangler", "name": "inbound_relationship_rejection" },
          { "domain": "wrangler", "name": "outbound_cancellation" },
          { "domain": "wrangler", "name": "outbound_relationship_cancellation" },
          { "domain": "wrangler", "name": "subscription_cancellation" },
          { "domain": "wrangler", "name": "relationship_cancellation" },
          { "domain": "wrangler", "name": "set_public_intro" },
          { "domain": "wrangler", "name": "send_event_on_subs" },
          { "domain": "wrangler", "name": "send_event_on_relationships" },
          { "domain": "wrangler", "name": "child_deleted" },
          { "domain": "wrangler", "name": "new_child_request" },
          { "domain": "wrangler", "name": "new_child_created" },
          { "domain": "wrangler", "name": "install_ruleset_request" },
          { "domain": "wrangler", "name": "new_channel_request" }
        ],
        "deny": []
      }
    }
    uiChannelQueryPolicy = function() {
      {
        "allow": [
          { "rid": "*", "name": "__testing" },
          { "rid": "*", "name": "__consoleEval" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "uiECI" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "box" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "pico" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "logs" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "testingECI" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "testingHistory" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "testingSaved" },
          { "rid": "io.picolabs.pico-engine-ui", "name": "name" },
          { "rid": "io.picolabs.subscription", "name": "established" },
          { "rid": "io.picolabs.subscription", "name": "inbound" },
          { "rid": "io.picolabs.subscription", "name": "outbound" },
          { "rid": "io.picolabs.subscription", "name": "wellKnown_Rx" },
          { "rid": "io.picolabs.wrangler", "name": "myDid" },
          { "rid": "io.picolabs.wrangler", "name": "publicIntro" },
          { "rid": "io.picolabs.wrangler", "name": "rulesetSchema" },
          { "rid": "io.picolabs.wrangler", "name": "picoSchema" }
        ],
        "deny": []
      }
    }
    childPalette = [
      "#FFB347", "#77DD77", "#B19CD9", "#FF6961", "#FDFD96",
      "#84B6F4", "#FFD1DC", "#C9A0DC", "#98FB98", "#E6E6FA"
    ]
    // Grid slot from live children only — not ent:child_ui_ecis map size (stale
    // entries survive pico deletion and were inflating layout Y on every recreate).
    childLayoutIndex = function(familyEci) {
      idx = ctx:children.index(familyEci)
      idx.isnull() => ctx:children.length() - 1 | idx
    }
    refreshUiChannel = defaction() {
      ctx:upsertChannel(
        tags = ["engine", "ui"],
        eventPolicy = uiChannelEventPolicy(),
        queryPolicy = uiChannelQueryPolicy()
      )
    }
  }
  // engine_ui events are the developer UI's private protocol and are deliberately
  // not discoverable. Their public equivalents are wrangler events
  // (new_child_request, install_ruleset_request, new_channel_request, …).
  rule setup {
    select when engine_ui setup
    refreshUiChannel()
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
      ent:x := event:attrs{"x"}.as("Number") if not event:attrs{"x"}.isnull()
      ent:y := event:attrs{"y"}.as("Number") if not event:attrs{"y"}.isnull()
      ent:width := event:attrs{"width"}.as("Number") if not event:attrs{"width"}.isnull()
      ent:height := event:attrs{"height"}.as("Number") if not event:attrs{"height"}.isnull()
      ent:name := event:attrs{"name"}.as("String") if event:attrs{"name"}
      ent:backgroundColor := event:attrs{"backgroundColor"}.validateColor() if event:attrs{"backgroundColor"}
      ent:parent_ui_eci := event:attrs{"parentUiEci"} if event:attrs{"parentUiEci"}
    }
  }
  rule remember_child_ui_eci {
    select when wrangler new_child_created
    pre {
      uiEci = event:attr("uiEci")
      familyEci = event:attr("eci")
      childIndex = childLayoutIndex(familyEci)
      gridCol = childIndex % 4
      gridRow = (childIndex - childIndex % 4) / 4
      layoutX = ent:x.defaultsTo(100) + 48 + gridCol * 143
      layoutY = ent:y.defaultsTo(100) + 48 + gridRow * 108
      layoutColor = childPalette[childIndex % childPalette.length]
    }
    if uiEci && familyEci then
      ctx:event(
        eci=uiEci,
        domain="engine_ui",
        name="box",
        attrs={
          "x": layoutX,
          "y": layoutY,
          "width": 125,
          "height": 90,
          "backgroundColor": layoutColor,
          "parentUiEci": uiECI()
        }
      )
    always {
      ent:child_ui_ecis{[familyEci]} := uiEci
    }
  }
  rule spread_children_on_startup {
    select when engine started
      foreach ctx:children setting(familyEci)
    pre {
      uiEci = ent:child_ui_ecis{familyEci}
      childIndex = childLayoutIndex(familyEci)
      gridCol = childIndex % 4
      gridRow = (childIndex - childIndex % 4) / 4
      layoutX = ent:x.defaultsTo(100) + 48 + gridCol * 143
      layoutY = ent:y.defaultsTo(100) + 48 + gridRow * 108
      layoutColor = childPalette[childIndex % childPalette.length]
    }
    if uiEci && ctx:query(uiEci, ctx:rid, "needsStartupLayout") then
      ctx:event(
        eci=uiEci,
        domain="engine_ui",
        name="box",
        attrs={
          "x": layoutX,
          "y": layoutY,
          "width": 125,
          "height": 90,
          "backgroundColor": layoutColor,
          "parentUiEci": uiECI()
        }
      )
  }
  rule backfill_child_ui_eci {
    select when engine started
      foreach ctx:children setting(familyEci)
    if ent:child_ui_ecis{familyEci}.isnull() then noop()
    always {
      ent:child_ui_ecis{[familyEci]} := ctx:query(familyEci, ctx:rid, "uiECI")
    }
  }
  rule prune_stale_child_ui_ecis {
    select when engine started
      foreach ent:child_ui_ecis.defaultsTo({}).keys() setting(familyEci)
    always {
      clear ent:child_ui_ecis{familyEci}
        if ctx:children.index(familyEci).isnull()
    }
  }
  rule forget_child_ui_eci {
    select when wrangler child_deleted
      eci re#(.+)# setting(familyEci)
    always {
      clear ent:child_ui_ecis{familyEci}
    }
  }
  rule backfill_parent_ui_eci {
    select when engine started
    if ctx:parent && ent:parent_ui_eci.isnull() then noop()
    always {
      ent:parent_ui_eci := ctx:query(ctx:parent, ctx:rid, "uiECI")
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
        .filter(function(familyEci){
          ent:child_ui_ecis{familyEci} == delUiEci
        })
        .head()
    }
    ctx:delPico(delEci)
    always {
      clear ent:child_ui_ecis{delEci} if delEci
    }
  }
  rule install {
    select when engine_ui install
    pre {
      url = event:attrs{"url"} || ""
      oauth_url = url.match(re#io\.picolabs\.oauth#)
      // OAuth mesh ruleset is root-only; allow other URLs on any pico.
      block_oauth = oauth_url && ctx:parent
    }
    // Action-block condition sets $fired; use notfired (or always) for the install path.
    if block_oauth then noop()
    notfired {
      raise wrangler event "install_ruleset_request" attributes event:attrs
    }
  }
  rule uninstall {
    select when engine_ui uninstall
    ctx:uninstall(rid=event:attrs{"rid"})
  }
  rule flush {
    select when engine_ui flush
    pre {
      url = event:attrs{"url"}
      validation = ctx:validate(url)
      ok = validation{"ok"}
      validate_errors = validation{"errors"}
      validate_warnings = validation{"warnings"}
      validate_rid = validation{"rid"}
    }
    if ok then every {
      ctx:flush(url=url)
    }
    fired {
      raise engine_ui event "flush_succeeded" attributes {"url": url}
    }
    else {
      raise wrangler event "ruleset_flush_failed" attributes
        {"url": url, "rid": validate_rid, "errors": validate_errors, "warnings": validate_warnings}
    }
  }
  rule refresh_ui_channel_after_flush {
    select when engine_ui flush_succeeded
    pre {
      url = event:attrs{"url"} || ""
      self_flush = url.match(re#io\.picolabs\.pico-engine-ui#)
    }
    if self_flush then refreshUiChannel()
  }
  // Reinstall the flushed ruleset on this pico so the new KRL takes effect.
  // The rid comes from the installed ruleset whose url matches: the UI sends the
  // url from pico(){"rulesets"}, so it is exactly the installed ruleset's url.
  // (Previously the rid was parsed out of the url, which never matched —
  // substr(0, 11) is "io.picolabs" without the dot — and truncated dotted rids.)
  rule reinstall_after_flush {
    select when engine_ui flush_succeeded
    pre {
      url = event:attrs{"url"} || ""
      rid = ctx:rulesets
        .filter(function(rs){ rs{"url"} == url })
        .head(){"rid"}
    }
    if url && rid then noop()
    fired {
      raise wrangler event "install_ruleset_request" attributes {"rid": rid, "url": url}
    }
  }
  rule new_channel {
    select when engine_ui new_channel
    ctx:newChannel(
      tags=event:attrs{"tags"},
      eventPolicy=event:attrs{"eventPolicy"},
      queryPolicy=event:attrs{"queryPolicy"},
      id=event:attrs{"id"}
    )
  }
  rule del_channel {
    select when engine_ui del_channel
    ctx:delChannel(event:attrs{"eci"})
  }
  rule update_channel {
    select when engine_ui update_channel
    ctx:putChannel(
      eci=event:attrs{"eci"},
      tags=event:attrs{"tags"},
      eventPolicy=event:attrs{"eventPolicy"},
      queryPolicy=event:attrs{"queryPolicy"}
    )
  }
  rule testing_eci {
    select when engine_ui testing_eci
    always {
      ent:testingECI := event:attrs{"eci"}
    }
  }

  rule testing_history_record {
    select when engine_ui testing_history_record
    pre {
      rid = event:attrs{"rid"}
      entry = event:attrs{"entry"}
      prior = ent:testing_history{rid}.defaultsTo([])
      merged = [entry].append(prior)
    }
    if rid && entry then noop()
    fired {
      ent:testing_history := ent:testing_history.defaultsTo({})
      ent:testing_history{rid} := merged.length() > testingHistoryCap
        => merged.slice(0, testingHistoryCap) |
        merged
    }
  }

  rule testing_history_clear {
    select when engine_ui testing_history_clear
    pre {
      rid = event:attrs{"rid"}
      clearAll = rid.isnull() || rid == ""
    }
    if clearAll then noop()
    fired {
      ent:testing_history := {}
    }
    else {
      ent:testing_history := ent:testing_history.defaultsTo({})
      ent:testing_history{rid} := []
    }
  }

  rule testing_saved_upsert {
    select when engine_ui testing_saved_upsert
    pre {
      rid = event:attrs{"rid"}
      entry = event:attrs{"entry"}
      entryId = entry.get("id")
      prior = ent:testing_saved{rid}.defaultsTo([])
      rest = prior.filter(function(e){e.get("id") != entryId})
      merged = [entry].append(rest)
    }
    if rid && entry && entryId then noop()
    fired {
      ent:testing_saved := ent:testing_saved.defaultsTo({})
      ent:testing_saved{rid} := merged
    }
  }

  rule testing_saved_delete {
    select when engine_ui testing_saved_delete
    pre {
      rid = event:attrs{"rid"}
      id = event:attrs{"id"}
      prior = ent:testing_saved{rid}.defaultsTo([])
      merged = prior.filter(function(e){e.get("id") != id})
    }
    if rid && id then noop()
    fired {
      ent:testing_saved := ent:testing_saved.defaultsTo({})
      ent:testing_saved{rid} := merged
    }
  }
}
