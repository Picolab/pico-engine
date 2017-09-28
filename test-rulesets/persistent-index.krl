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
    rule setfoo {
        select when pindex setfoo
        always {
            ent:foo := event:attrs()
        }
    }
    rule putfoo {
        select when pindex putfoo

        pre {
            key = event:attr("key")
            value = event:attr("value")
        }
        always {
            ent:foo{key} := value
        }
    }
    rule delfoo {
        select when pindex delfoo

        pre {
            key = event:attr("key")
        }
        always {
            clear ent:foo{key}
        }
    }
    rule nukefoo {
        select when pindex nukefoo
        always {
            clear ent:foo
        }
    }
}
