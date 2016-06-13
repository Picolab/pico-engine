ruleset hello_world {
  rule say_hello {
    select when echo hello
    send_directive("say") with
      something = "Hello World"
  }
}
