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

    body.push(e("var", "actions", e("arr", _.map(ast.actions, function(action){
        return comp(action);
    }))));

    body.push(e("var", "r", e("arr", [])));
    body.push(e("var", "i"));
    body.push(e(
        "for",
        e("=", e("id", "i"), e("number", 0)),
        e("<", e("id", "i"), e("id", "actions.length")),
        e("++", e("id", "i")),
        e(";", e("call", e("id", "r.push"), [
            e("yield",
                e("call", e(".",
                    e("get",
                        e("id", "actions"),
                        e("id", "i")
                    ),
                    e("id", "action")
                ), [
                    e("id", "ctx")
                ])
            )
        ]))
    ));
    body.push(e("return", e("id", "r")));

    return e(";", e("call", e("id", "ctx.scope.set"), [
        e("str", ast.id.value, ast.id.loc),
        mkKRLClosure(e, body)
    ]));
};
