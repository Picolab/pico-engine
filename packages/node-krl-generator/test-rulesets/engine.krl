ruleset io.picolabs.engine {
  rule newPico {
    select when engine newPico;
    engine:newPico()
  }
  rule newChannel {
    select when engine newChannel;
    pre {
      pico_id = event:attr("pico_id")
      name = event:attr("name")
      type = event:attr("type")
    }
    engine:newChannel(pico_id, name, type)
  }
  rule removeChannel {
    select when engine removeChannel;
    engine:removeChannel(event:attr("eci"))
  }
  rule installRuleset {
    select when engine installRuleset;
    pre {
      pico_id = event:attr("pico_id")
      rid = event:attr("rid")
      url = event:attr("url")
      base = event:attr("base")
    }
    engine:installRuleset(pico_id, rid, url, base)
  }
}
