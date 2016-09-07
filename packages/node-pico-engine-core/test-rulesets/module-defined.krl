ruleset io.picolabs.module-defined {
  meta {
    provides hello
    shares queryFn
    configure using greeting = "Hello "
  }
  global {
    hello = function(obj){
      greeting + obj
    }
    privateFn = function(obj){
      "Private: " + hello(obj)
    }
    queryFn = function(obj){
      "Query: " + privateFn(obj)
    }
  }
  rule should_not_handle_events {
    select when module_defined hello;
    send_directive("module_defined - should_not_handle_events !")
  }
}
