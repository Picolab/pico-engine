ruleset io.picolabs.event-exp {
  rule before {
    select when ee_before a before ee_before b
    send_directive("before")
  }
  rule after {
    select when ee_after a after ee_after b
    send_directive("after")
  }
  rule then {
    select when ee_then a then ee_then b
    send_directive("then")
  }
}
