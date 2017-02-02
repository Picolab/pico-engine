ruleset io.picolabs.within {
  rule foo {
    select when foo a
         before foo b
         within 5 minutes
    send_directive("foo")
  }
}
