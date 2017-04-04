ruleset io.picolabs.key-used {
  meta {
    name "key-used"
    description <<
This is a test file for a module that uses keys
    >>

    use module io.picolabs.key-defined

    use module io.picolabs.key-configurable
      alias api
      with key1 = keys:foo()
       and key2 = keys:bar("baz")

    shares getFoo, getBar, getBarN, getQuux, getQuuz, getAPIKeys
  }
  global {
    getFoo = function(){
      keys:foo()
    }
    getBar = function(){
      keys:bar()
    }
    getBarN = function(name){
      keys:bar(name)
    }
    getQuux = function(){
      keys:quux()
    }
    getQuuz = function(){
      keys:quuz()
    }
    getAPIKeys = function(){
      api:getKeys()
    }
  }
}
