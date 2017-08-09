ruleset io.picolabs.key-used2 {
    meta {
        name "key-used2"
        description <<
This is a test file for a module that uses keys
        >>

        use module io.picolabs.key-defined

        use module io.picolabs.key-configurable
            alias api
            with
                key2 = keys:local_key()

        key local_key "this key is defined inside the module"
        shares getFoo, getBar, getBarN, getQuux, getQuuz, getAPIKeys
    }
    global {
        getFoo = function(){
            keys:foo();
        }
        getBar = function(){
            keys:bar();
        }
        getBarN = function(name){
            keys:bar(name);
        }
        getQuux = function(){
            keys:quux();
        }
        getQuuz = function(){
            keys:quuz();
        }
        getAPIKeys = function(){
            api:getKeys();
        }
    }

}
