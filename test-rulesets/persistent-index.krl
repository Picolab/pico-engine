ruleset io.picolabs.persistent-index {
    meta {
        shares getFoo, getFooKey, getBaz, getMaplist
    }
    global {
        getFoo = function(){
            ent:foo;
        }
        getFooKey = function(key){
            ent:foo{key};
        }
        getBaz = function(){
            ent:baz;
        }
        getMaplist = function(){
            ent:maplist;
        }
    }
    rule setfoo {
        select when pindex setfoo
        always {
            ent:foo := event:attrs
        }
    }
    rule putfoo {
        select when pindex putfoo

        pre {
            key = event:attrs{"key"}
            value = event:attrs{"value"}
        }
        always {
            ent:foo{key} := value
        }
    }
    rule delfoo {
        select when pindex delfoo

        pre {
            key = event:attrs{"key"}
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
    rule putbaz {
        select when pindex putbaz
        always {
            ent:baz{["one", "two"]} := "three"
        }
    }
    rule setmaplist {
        select when pindex setmaplist
        always {
            ent:maplist := [{"id": "one"}, {"id": "two"}, {"id": "three"}]
        }
    }
    rule putmaplist {
        select when pindex putmaplist
        always {
            ent:maplist{[1, "other"]} := "thing"
        }
    }
}
