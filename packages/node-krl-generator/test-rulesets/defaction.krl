ruleset io.picolabs.defaction {
  meta {
    shares getSettingVal, add
  }
  global {
    foo = defaction(a){
      b = 2
      send_directive("foo", {
        "a": a,
        "b": b + 3
      })
    }
    bar = defaction(
      one,
      two = add(1, 1){["options", "resp"]},
      three = "3 by default",
    ){

      send_directive("bar", {
        "a": one,
        "b": two,
        "c": three
      })
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
    echoAction = defaction(a, b, c){

      noop()

      returns a, b, c
    }
    addAction = defaction(a, b){

      noop()

      return a + b
    }
    add = function(a, b){
      {
        "type": "directive",
        "name": "add",
        "options": {"resp": a + b}
      }
    }
  }
  rule foo {
    select when defa foo;
    foo("bar")
  }
  rule bar {
    select when defa bar;
    bar("baz", {
      "two": "qux",
      "three": "quux"
    })
  }
  rule bar_setting {
    select when defa bar_setting;
    bar("baz", {
      "two": "qux",
      "three": "quux"
    }) setting(val)
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
  rule add {
    select when defa add;
    add(1, 2)
  }
}
