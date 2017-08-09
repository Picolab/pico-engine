ruleset io.picolabs.foreach {
    meta {
        name "testing foreach"
    }
    global {
        doubleThis = function(arr){
            [arr, arr];
        }
    }
    rule basic {
        select when foreach basic
        foreach [1, 2, 3] setting(x)

        send_directive("basic", {"x": x});
    }
    rule map {
        select when foreach map
        foreach {
            "a": 1,
            "b": 2,
            "c": 3
        } setting(v, k)

        send_directive("map", {
            "k": k,
            "v": v
        });
    }
    rule nested {
        select when foreach nested
        foreach [1, 2, 3] setting(x)
            foreach ["a", "b", "c"] setting(y)

        send_directive("nested", {
            "x": x,
            "y": y
        });
    }
    rule scope {
        select when foreach scope
        foreach doubleThis([1, 2, 3]) setting(arr)
            foreach arr setting(foo)
                foreach 0.range(foo) setting(bar)

        pre {
            baz = foo * bar
        }

        send_directive("scope", {
            "foo": foo,
            "bar": bar,
            "baz": baz
        });
    }
    rule final {
        select when foreach final
        foreach event:attr("x").split(",") setting(x)
            foreach event:attr("y").split(",") setting(y)

        send_directive("final", {
            "x": x,
            "y": y
        });

        always {
            raise foreach event "final_raised"
                attributes {
                    "x": x,
                    "y": y
                } on final
        }
    }
    rule final_raised {
        select when foreach final_raised

        send_directive("final_raised", {
            "x": event:attr("x"),
            "y": event:attr("y")
        });
    }
}
