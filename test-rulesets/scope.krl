ruleset io.picolabs.scope {
    meta {
        name "testing scope"
        shares g0, g1, getVals, add, sum, mapped
    }
    global {
        g0 = "global 0"
        g1 = 1
        getVals = function(){
            {
                "name": ent:ent_var_name,
                "p0": ent:ent_var_p0,
                "p1": ent:ent_var_p1
            };
        }
        add = function(a, b){
            a + b;
        }
        sum = function(arr){
            arr.reduce(add, 0);
        }
        incByN = function(n){
            function(a){
                a + n;
            };
        }
        mapped = [1, 2, 3].map(function(n){
            n + g1;
        })
    }
    rule eventOr {
        select when scope eventOr0 name re#^(.*)$# setting(name0)
            or
            scope eventOr1 name re#^(.*)$# setting(name1)

        send_directive("eventOr", {
            "name0": name0,
            "name1": name1
        });
    }
    rule eventAnd {
        select when scope eventAnd0 name re#^(.*)$# setting(name0)
            and
            scope eventAnd1 name re#^(.*)$# setting(name1)

        send_directive("eventAnd", {
            "name0": name0,
            "name1": name1
        });
    }
    rule eventWithin {
        select when (
                scope eventWithin0
                or
                scope eventWithin1 name re#^(.*)$# setting(name1)
            )
            and
            (
                scope eventWithin2 name re#^(.*)$# setting(name2)
                or
                scope eventWithin3
            )
            within 1 second

        send_directive("eventWithin", {
            "name1": name1,
            "name2": name2
        });
    }
    rule prelude_scope {
        select when scope prelude name re#^(.*)$# setting(name)

        pre {
            p0 = "prelude 0"
            p1 = "prelude 1"
        }

        send_directive("say", {
            "name": name,
            "p0": p0,
            "p1": p1,
            "g0": g0
        });

        always {
            ent:ent_var_name := name;
            ent:ent_var_p0 := p0;
            ent:ent_var_p1 := p1
        }
    }
    rule functions {
        select when scope functions

        pre {
            g0 = "overrided g0!"
            inc5 = incByN(5)
        }

        send_directive("say", {
            "add_one_two": add(1, 2),
            "inc5_3": inc5(3),
            "g0": g0
        });
    }
}
