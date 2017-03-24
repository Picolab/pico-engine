ruleset io.picolabs.engine {
  rule newPico {
    select when engine newPico;
    fired {
      engine:newPico()
    }
  }
  rule newChannel {
    select when engine newChannel;
    fired {
      engine:newChannel({
        "name": event:attr("name"),
        "type": event:attr("type"),
        "pico_id": event:attr("pico_id")
      })
    }
  }
  rule removeChannel {
    select when engine removeChannel;
    fired {
      engine:removeChannel({
        "pico_id": event:attr("pico_id"),
        "eci": event:attr("eci")
      })
    }
  }
  rule installRuleset {
    select when engine installRuleset;
    fired {
      engine:installRuleset({
        "pico_id": event:attr("pico_id"),
        "rid": event:attr("rid"),
        "url": event:attr("url"),
        "base": event:attr("base")
      })
    }
  }
}
