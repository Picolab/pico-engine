var _ = require("lodash");
var mkKRLClosure = require("../utils/mkKRLClosure");

module.exports = function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
        var loc = param.loc;
        return e(";", e("call", e("id", "ctx.scope.set", loc), [
            e("str", param.value, loc),
            e("call",
                e("id", "ctx.getArg", loc),
                [
                    e("id", "ctx.args", loc),
                    e("string", param.value, loc),
                    e("number", i, loc)
                ],
                loc
            )
        ], loc), loc);
    });

    _.each(ast.body, function(d){
        body.push(comp(d));
    });

    body.push(e("return", e("call", e(".", e("arr", _.map(ast.actions, function(action){
        return comp(action);
    })), e("id", "map")), [e("genfn", ["a"], [
        e("return", e("call", e("id", "a.action"), [e("id", "ctx")]))
    ])])));

    return e(";", e("call", e("id", "ctx.scope.set"), [
        e("str", ast.id.value, ast.id.loc),
        mkKRLClosure(e, body)
    ]));
};
