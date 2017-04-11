ruleset io.picolabs.defaction {
  global {
    foo = defaction(a){
      b = 2
      send_directive("foo") with
        a = a
        and
        b = b + 3
    }
    bar = defaction(one, two, three){

      send_directive("bar") with
        a = one
        and
        b = two
        and
        c = three
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
      and
      three = "quux"
  }
}
