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
      return eci => ctx:query(eci, ctx:rid, "uiECI") | null
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
      return ctx:logs()
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
          { "domain": "engine", "name": "started" }
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
          { "rid": "io.picolabs.pico-engine-ui", "name": "testingECI" }
        ],
        "deny": []
      }
    )
  }
  rule box {
    select when engine_ui box
    always {
      ent:x := event:attrs{"x"}.as("Number") if event:attrs >< "x"
      ent:y := event:attrs{"y"}.as("Number") if event:attrs  >< "y"
      ent:width := event:attrs{"width"}.as("Number") if event:attrs >< "width"
      ent:height := event:attrs{"height"}.as("Number") if event:attrs  >< "height"
      ent:name := event:attrs{"name"}.as("String") if event:attrs  >< "name"
      ent:backgroundColor := event:attrs{"backgroundColor"}.as("String") if event:attrs  >< "backgroundColor"
    }
  }
  rule new {
    select when engine_ui new
    pre {
      name = event:attrs{"name"} || ent:name
      backgroundColor = event:attrs{"backgroundColor"} || ent:backgroundColor
    }
    every {
      ctx:newPico(rulesets=[
        { "url": ctx:rid_url, "config": {} }
      ]) setting(newEci)
      ctx:eventQuery(
        eci=newEci,
        domain="engine_ui",
        name="setup",
        rid="io.picolabs.pico-engine-ui",
        queryName="uiECI"
      ) setting(newUiECI)
      ctx:event(
        eci=newUiECI,
        domain="engine_ui",
        name="box",
        attrs={
          "name": name,
          "backgroundColor": backgroundColor
        }
      )
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
    pre {
      url = event:attrs{"url"}
    }
    every {
      ctx:flush(url=url)
      ctx:install(url=url, config=event:attrs{"config"})
    }
    fired {
      this_rs = ctx:rulesets.filter(function(r){r.get("url")==url})
      raise wrangler event "ruleset_installed" attributes {
        "rids": this_rs.map(function(r){r.get("rid")})
      }
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
