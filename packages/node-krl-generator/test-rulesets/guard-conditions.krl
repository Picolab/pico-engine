ruleset io.picolabs.guard-conditions {
    meta {
        shares getB
    }
    global {
        getB = function(){
            ent:b;
        }
    }
    rule foo {
        select when foo a b re#^(.*)$# setting(b)

        send_directive("foo", {"b": b});

        always {
            ent:b := b if b.match(re#foo#)
        }
    }
    rule bar {
        select when bar a
        foreach [1, 2, 3] setting(x)

        send_directive("bar", {
            "x": x,
            "b": ent:b
        });

        always {
            ent:b := x on final
        }
    }
}
