ruleset io.picolabs.defaction {
  global {
    foo = defaction(a){
      b = 2
      send_directive("foo") with
        a = a
        b = b + 3
    }
  }
  rule foo {
    select when foo a;
    foo("bar")
  }
  rule bar {
    select when bar a;
    bar("baz") with
      two = "qux"
      three = "quux"
  }
}
