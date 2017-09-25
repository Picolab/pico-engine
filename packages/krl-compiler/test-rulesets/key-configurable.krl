ruleset io.picolabs.key-configurable {
    meta {
        name "key-configurable"
        description <<
This is a test for api libraries that depend on keys as input
        >>

        configure using
            key1 = "default-key1"
            key2 = "default-key2"
        provides getKeys
    }
    global {
        getKeys = function(){
            [key1, key2];
        }
    }

}
