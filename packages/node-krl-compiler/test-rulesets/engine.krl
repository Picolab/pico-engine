ruleset io.picolabs.engine {
  rule newPico {
    select when engine newPico;
    fired {
      engine:newPico()
    }
  }
}
