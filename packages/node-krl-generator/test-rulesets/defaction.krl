ruleset io.picolabs.defaction {
  meta {
    shares getSettingVal
  }
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
    getSettingVal = function(){
      ent:setting_val
    }
    chooser = defaction(val){


      choose val {
        asdf =>
          foo(val)
        fdsa =>
          bar(val, "ok", "done")
      }
    }
    ifAnotB = defaction(a, b){


      if a && not b then
      every {
        send_directive("yes a")
        send_directive("not b")
      }
    }
  }
  rule foo {
    select when defa foo;
    foo("bar")
  }
  rule bar {
    select when defa bar;
    bar("baz") with
      two = "qux"
      and
      three = "quux"
  }
  rule bar_setting {
    select when defa bar_setting;
    bar("baz") setting(val) with
      two = "qux"
      and
      three = "quux"
    fired {
      ent:setting_val := val
    }
  }
  rule chooser {
    select when defa chooser;
    chooser(event:attr("val"))
  }
  rule ifAnotB {
    select when defa ifAnotB;
    ifAnotB(event:attr("a") == "true", event:attr("b") == "true")
  }
}
