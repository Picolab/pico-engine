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
}
