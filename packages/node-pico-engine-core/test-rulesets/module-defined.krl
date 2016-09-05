ruleset io.picolabs.module-defined {
  meta {
    provides hello
  }
  global {
    hello = function(obj){
      "Hello " + obj
    }
  }
  rule should_not_handle_events {
    select when module_defined hello;
    send_directive("module_defined - should_not_handle_events !")
  }
}
