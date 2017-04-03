ruleset io.picolabs.key-used {
  meta {
    name "key-used"
    description <<
This is a test file for a module that uses keys
    >>

    use module io.picolabs.key-defined

    shares getFoo, getBar, getQuux, getQuuz
  }
  global {
    getFoo = function(){
      keys:foo()
    }
    getBar = function(){
      [
        keys:bar(),
        keys:bar("baz"),
        keys:bar("qux"),
        keys:bar("not_here")
      ]
    }
    getQuux = function(){
      keys:quux()
    }
    getQuuz = function(){
      keys:quuz()
    }
  }
}
