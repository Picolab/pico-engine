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
}