ruleset io.picolabs.module-used {
  meta {
    use module io.picolabs.module-defined
      alias my_module
    use module io.picolabs.module-defined
      alias my_module_conf
      with greeting = "Greetings "
  }
  rule say_hello {
    select when module_used say_hello name re#(.*)# setting(name);
    send_directive("say_hello") with
      something = my_module:hello(name)
      configured = my_module_conf:hello(name)
  }
  rule privateFn {
    select when module_used privateFn;
    send_directive("privateFn") with
      something = my_module:privateFn("{{name}}")
  }
  rule queryFn {
    select when module_used queryFn;
    send_directive("queryFn") with
      something = my_module:queryFn("{{name}}")
  }
}
