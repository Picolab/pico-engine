ruleset io.picolabs.within {
  rule foo {
    select when foo a
      before
      foo b
      within 5 minutes;
    send_directive("foo")
  }
  rule bar {
    select when bar a
      before
      bar b
      within 1 + 3 second;
    send_directive("bar")
  }
  rule baz {
    select when baz a
      or
      baz b
      and
      baz c
      within 1 year;
    send_directive("baz")
  }
  rule qux {
    select when repeat 3 (
      qux a b re#c#
    )
      within 2 seconds;
    send_directive("qux")
  }
}
