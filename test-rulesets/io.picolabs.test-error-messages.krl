ruleset io.picolabs.test-error-messages {
    meta {
        description <<
This is a ruleset that will compile, but does things
the wrong way to test how they are handled at runtime
        >>

        shares hello, null_val, infiniteRecursion
    }
    global {
        hello = function(obj){
            "Hello " + obj;
        }
        null_val = null
        infiniteRecursion = function(){
            infiniteRecursion();
        }
    }

}
