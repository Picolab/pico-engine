ruleset io.picolabs.next {
  version "0.0.0"
  meta {
    shares box, uiECI, pico
  }
  global {
    uiECI = function(){
      return ctx:channels
        .filter(function(c){c["tags"].sort().join(",") == "engine,ui"})
        .map(function(c){c.id})
        .head()
    }
    getOtherUiECI = function(eci){
      return eci => ctx:query(eci, ctx:rid, "uiECI") | null
    }
    box = function(){
      msg = "Hello " + name;
      return {
        "eci": uiECI(),
        "parent": getOtherUiECI(ctx:parent),
        "children": ctx:children.map(getOtherUiECI),
        "name": ent:name || "Pico",
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
          { "domain": "engine_ui", "name": "new-channel" },
          { "domain": "engine_ui", "name": "del-channel" },
          { "domain": "engine", "name": "started" }
        ],
        "deny": []
      },
      queryPolicy = {
        "allow": [
          { "rid": "*", "name": "__testing" },
          { "rid": "io.picolabs.next", "name": "uiECI" },
          { "rid": "io.picolabs.next", "name": "box" },
          { "rid": "io.picolabs.next", "name": "pico" }
        ],
        "deny": []
      }
    )
  }
  rule box {
    select when engine_ui box
    always {
      ent:x := event:attrs["x"].as("Number") if event:attrs >< "x"
      ent:y := event:attrs["y"].as("Number") if event:attrs  >< "y"
      ent:width := event:attrs["width"].as("Number") if event:attrs >< "width"
      ent:height := event:attrs["height"].as("Number") if event:attrs  >< "height"
      ent:name := event:attrs["name"].as("String") if event:attrs  >< "name"
      ent:backgroundColor := event:attrs["backgroundColor"].as("String") if event:attrs  >< "backgroundColor"
    }
  }
}