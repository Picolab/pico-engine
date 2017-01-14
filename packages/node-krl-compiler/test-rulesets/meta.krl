ruleset io.picolabs.meta {
  meta {
    name "testing meta module"
    shares eci
  }
  global {
    eci = function() {
      meta:eci
    }
  }
  rule test_meta {
    select when meta eci
    send_directive("eci") with eci = meta:eci
  }
}
