ruleset io.picolabs.meta {
  meta {
    name "testing meta module"
    shares eci, rulesetURI
  }
  global {
    eci = function() {
      meta:eci
    }
    rulesetURI = function() {
      meta:rulesetURI
    }
  }
  rule meta_eci {
    select when meta eci
    send_directive("eci") with eci = meta:eci
  }
  rule meta_rulesetURI {
    select when meta rulesetURI
    send_directive("rulesetURI") with rulesetURI = meta:rulesetURI
  }
}
