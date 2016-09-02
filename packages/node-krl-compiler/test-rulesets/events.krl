ruleset io.picolabs.events {
  meta {
    shares getOnChooseFired
  }
  global {
    getOnChooseFired = function(){
      ent:on_choose_fired
    }
  }
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
  rule noop {
    select when events noop
  }
  rule noop2 {
    select when events noop2;
    noop()
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
  rule or_and {
    select when events_orand a and (events_orand b or events_orand c)
    send_directive("a and (b or c)")
  }
  rule ifthen {
    select when events ifthen name re#^(.*)$# setting(my_name);

    if my_name then
      send_directive("ifthen")
  }
  rule on_fired {
    select when events on_fired name re#^(.*)$# setting(my_name);
    send_directive("on_fired") with
      previous_name = ent:on_fired_prev_name
    fired {
      ent:on_fired_prev_name = my_name
    }
  }
  rule on_choose {
    select when events on_choose thing re#^(.*)$# setting(thing);

    if thing then
    choose
      one => send_directive("on_choose - one")
      two => send_directive("on_choose - two")

    fired {
      ent:on_choose_fired = true
    } else {
      ent:on_choose_fired = false
    }
  }
}
