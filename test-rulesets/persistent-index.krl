ruleset io.picolabs.persistent-index {
    meta {
        shares getFoo, getFooKey
        index ent:foo
    }
    global {
        getFoo = function(){
            ent:foo;
        }
        getFooKey = function(key){
            ent:foo{key};
        }
    }
    rule putfoo {
        select when pindex putfoo

        pre {
            key = event:attr("key")
            value = event:attr("value")
        }

        send_directive("putfoo", {
            "key": key,
            "value": value
        });

        always {
            ent:foo{key} := value
        }
    }
}
