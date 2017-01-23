ruleset io.picolabs.event-exp {
  rule before {
    select when ee_before a before ee_before b
    send_directive("before")
  }
}
