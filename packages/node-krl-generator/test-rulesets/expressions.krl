ruleset io.picolabs.expressions {
    meta {
        shares obj, path1, path2, index1, index2, paramFnTest
    }
    global {
        cond_exp_1 = true => 1 |
            2
        cond_exp_2 = false => 1 |
            2
        obj = {
            "a": 1,
            "b": {"c": [2, 3, 4, {"d": {"e": 5}}, 6, 7]}
        }
        obj{["b", "c", 3, "d", "e"]} = "changed 5"
        obj["a"] = "changed 1"
        path1 = obj{["b", "c", 3, "d"]}
        path2 = obj{["b", "c", 5]}
        index1 = obj["a"]
        index2 = obj["b"]["c"][1]
        not_true = not true
        not_null = not null
        true_or_false = true || false
        true_and_false = true && false
        incByN = function(n){
            function(a){
                a + n
            }
        }
        paramFn = function(
            foo = incByN(3),
            bar = foo(1),
            baz = bar + 2,
            qux = baz + "?",
        ){
            [bar, baz, qux]
        }
        paramFnTest = function(){
            [
                paramFn(),
                paramFn(incByN(100), "one"),
                paramFn(null, 3, 4, 5)
            ]
        }
    }

}
