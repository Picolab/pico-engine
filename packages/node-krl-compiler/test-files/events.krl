ruleset io.picolabs.events {
  rule set_attr {
    select when events bind name re#^(.*)$# setting(my_name);
    send_directive("bound") with
      name = my_name
  }
  rule get_attr {
    select when events get;
    pre {
      thing = event:attr("thing")
    }
    send_directive("get") with
      thing = thing
  }
  rule or_op {
    select when events_or a or events_or b
    send_directive("or")
  }
  rule and_op {
    select when events_and a and events_and b
    send_directive("and")
  }
  rule and_or {
    select when (events_andor a and events_andor b) or events_andor c
    send_directive("(a and b) or c")
  }
}
