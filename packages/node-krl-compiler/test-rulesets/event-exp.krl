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
  rule and {
    select when ee_and a and ee_and b
    send_directive("and")
  }
  rule or {
    select when ee_or a or ee_or b
    send_directive("or")
  }
  rule between {
    select when ee_between a between (ee_between b, ee_between c)
    send_directive("between")
  }
}
