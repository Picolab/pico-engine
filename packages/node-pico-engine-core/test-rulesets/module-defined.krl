ruleset io.picolabs.module-defined {
  meta {
    provides hello
    configure using greeting = "Hello "
  }
  global {
    hello = function(obj){
      greeting + obj
    }
  }
  rule should_not_handle_events {
    select when module_defined hello;
    send_directive("module_defined - should_not_handle_events !")
  }
}
