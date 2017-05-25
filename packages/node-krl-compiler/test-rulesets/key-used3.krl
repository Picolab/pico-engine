ruleset io.picolabs.key-used3 {
    meta {
        name "key-used3"
        description <<
This is a test file who was shared a key, but doesn't "use" it
        >>

        shares getFoo
    }
    global {
        getFoo = function(){
            keys:foo();
        }
    }

}
