ruleset io.picolabs.defaction {
  global {
    foo = defaction(a){
      b = 2
      send_directive("foo") with
        a = a
        b = b + 3
    }
    bar = defaction(one, two, three){

      send_directive("bar") with
        a = one
        b = two
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
      three = "quux"
  }
}
