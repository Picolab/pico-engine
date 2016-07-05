ruleset io.picolabs.methods {
  rule methods_capitalize {
    select when methods capitalize
    send_directive("say") with
      something = "Hello World".capitalize()
  }
}
