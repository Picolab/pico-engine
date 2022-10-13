ruleset io.picolabs.with {
    meta {
        shares add, inc, foo
    }
    global {
        add = function(a, b){
            a + b;
        }
        inc = function(n){
            add(1, b = n);
        }
        foo = function(a){
            add(
                b = a,
                a = a * 2,
            );
        }
    }

}
