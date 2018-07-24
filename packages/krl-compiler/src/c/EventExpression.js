var _ = require("lodash");

module.exports = function(ast, comp, e){
    //FYI the graph allready vetted the domain and type

    if(ast.deprecated){
        comp.warn(ast.loc, "DEPRECATED SYNTAX - " + ast.deprecated);
    }

    var fn_body = [];

    if(ast.where){
        // inject attrs as varibles in the scope

        fn_body.push(e("var", "event_attrs", e("acall",
            e("id", "ctx.modules.get"),
            [e("id", "ctx"), e("str", "event"), e("str", "attrs")]
        )));
        var attrKeys = e("call", e("id", "Object.keys"), [e("id", "event_attrs")]);
        fn_body.push(e(";", e("call", e(".", attrKeys, e("id", "forEach")), [
            e("fn", ["attr"], [

                // don't stomp over global scope
                e("if", e("!", e("call", e("id", "ctx.scope.has"), [e("id", "attr")])),

                    e(";", e("call", e("id", "ctx.scope.set"), [
                        e("id", "attr"),
                        e("get", e("id", "event_attrs"), e("id", "attr")),
                    ]))
                )
            ])
        ])));
    }

    if(!_.isEmpty(ast.event_attrs)){
        // select when domain type <attr> re#..#
        fn_body.push(e("var", "matches", e("array", [])));
        fn_body.push(e("var", "m"));
        fn_body.push(e("var", "j"));
        _.each(ast.event_attrs, function(a){
            var id = function(str, loc){
                return e("id", str, loc || a.loc);
            };

            // m = regex.exec(attr string or "")
            var key = e("string", a.key.value, a.key.loc);
            var attr = e("call", id("getAttrString"), [id("ctx", a.key.loc), key], a.key.loc);
            var regexExec = e(".", comp(a.value), id("exec", a.value.loc), a.value.loc);
            fn_body.push(e(";", e("=", id("m"), e("call", regexExec, [attr], a.value.loc), a.value.loc)));

            // if !m, then the EventExpression doesn't match
            fn_body.push(e("if", e("!", id("m")), e("return", e("false"))));

            // append to matches
            var init = e("=", id("j"), e("number", 1));
            var test = e("<", id("j"), id("m.length"));
            var update = e("++", id("j"));
            var body = e(";", e("call", id("matches.push"), [e("get", id("m"), id("j"))]));
            fn_body.push(e("for", init, test, update, body));
        });
    }else if(!_.isEmpty(ast.setting)){
        fn_body.push(e("var", "matches", e("array", [])));
    }

    _.each(ast.setting, function(s, i){
        fn_body.push(e(";",
            e("call", e("id", "setting", s.loc), [
                e("str", s.value, s.loc),
                e("get", e("id", "matches", s.loc), e("num", i, s.loc), s.loc)
            ], s.loc), s.loc));
    });

    if(ast.where){
        fn_body.push(e("if", e("!", comp(ast.where)), e("return", e("false"))));
    }

    if(ast.aggregator){
        fn_body.push(e(";",
            e("acall",
                e("id", "aggregateEvent", ast.aggregator.loc),
                [
                    e("id", "ctx", ast.aggregator.loc),
                    e("string", ast.aggregator.op, ast.aggregator.loc),
                    e("array", _.map(ast.aggregator.args, function(a, i){
                        return e("array", [
                            e("string", a.value, a.loc),
                            e("get", e("id", "matches", a.loc), e("num", i, a.loc), a.loc)
                        ], a.loc);
                    }), ast.aggregator.loc)
                ],
                ast.aggregator.loc
            ), ast.aggregator.loc));
    }

    fn_body.push(e("return", e(true)));

    return e("asyncfn", ["ctx", "aggregateEvent", "getAttrString", "setting"], fn_body);
};
