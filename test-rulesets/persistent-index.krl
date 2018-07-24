ruleset io.picolabs.persistent-index {
    meta {
        shares getFoo, getFooKey, getBar, getBarKey, getBaz, getMaplist
    }
    global {
        getFoo = function(){
            ent:foo;
        }
        getFooKey = function(key){
            ent:foo{key};
        }
        getBar = function(){
            app:bar;
        }
        getBarKey = function(key){
            app:bar{key};
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
    rule setbar {
        select when pindex setbar
        always {
            app:bar := event:attrs
        }
    }
    rule putbar {
        select when pindex putbar

        pre {
            key = event:attr("key")
            value = event:attr("value")
        }
        always {
            app:bar{key} := value
        }
    }
    rule delbar {
        select when pindex delbar

        pre {
            key = event:attr("key")
        }
        always {
            clear app:bar{key}
        }
    }
    rule nukebar {
        select when pindex nukebar
        always {
            clear app:bar
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
