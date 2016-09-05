ruleset io.picolabs.module-used {
  meta {
    use module io.picolabs.module-defined
      alias my_module
  }
  rule say_hello {
    select when module_used say_hello setting(my_name);
    send_directive("say_hello") with
      something = my_module:hello(name)
  }
}
