ruleset io.picolabs.events {
  rule set_attr {
    select when events bind name re#^(.*)$# setting(my_name);
    send_directive("bound") with
      name = my_name
  }
  rule or_op {
    select when echo hello or say hello
  }
  rule and_op {
    select when echo hello and say hello
  }
  rule and_or {
    select when (echo a and echo b) or echo c
  }
}
