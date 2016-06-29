ruleset io.picolabs.events {
  rule set_attr {
    select when events bind name re#^(.*)$# setting(my_name);
    send_directive("bound") with
      name = my_name
  }
  rule or_op {
    select when events a or events b
    send_directive("or")
  }
  rule and_op {
    select when events a and events b
    send_directive("and")
  }
  rule and_or {
    select when (events a and events b) or events c
    send_directive("(a and b) or c")
  }
}
