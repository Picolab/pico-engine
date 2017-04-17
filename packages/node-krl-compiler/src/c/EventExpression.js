var _ = require("lodash");
var callModuleFn = require("../utils/callModuleFn");

module.exports = function(ast, comp, e){
    //FYI the graph allready vetted the domain and type

    var fn_params = ["ctx"];
    var fn_body = [];

    if(!_.isEmpty(ast.attributes)){
        fn_body.push(e("var", "matches",
                        callModuleFn(e, "event", "attrMatches", e("array", [
                            e("array", _.map(ast.attributes, function(a){
                                return e("array", [
                                    e("string", a.key.value, a.key.loc),
                                    comp(a.value)
                                ], a.loc);
                            }))
                        ]), ast.loc)));
        fn_body.push(e("if", e("!", e("id", "matches")), e("return", e("false"))));
    }else if(!_.isEmpty(ast.setting)){
        fn_body.push(e("var", "matches", e("array", [])));
    }

    if(ast.where){
        fn_body.push(e("if", e("!", comp(ast.where, {
            identifiers_are_event_attributes: true
        })), e("return", e("false"))));
    }

    _.each(ast.setting, function(s, i){
        fn_body.push(e(";",
            e("call", e("id", "ctx.scope.set", s.loc), [
                e("str", s.value, s.loc),
                e("get", e("id", "matches", s.loc), e("num", i, s.loc), s.loc)
            ], s.loc), s.loc));
    });

    if(ast.aggregator){
        fn_params.push("aggregateEvent");
        fn_body.push(e(";",
                        e("ycall",
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

    return e("genfn", fn_params, fn_body);
};
