var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = comp(ast.params);

    _.each(ast.body, function(d){
        body.push(comp(d));
    });

    body = body.concat(comp(ast.action_block));

    body.push(e("return", e("array", _.map(ast.returns, function(ret){
        return comp(ret);
    }))));

    return e(";", e("call", e("id", "ctx.scope.set"), [
        e("str", ast.id.value, ast.id.loc),
        e("call", e("id", "ctx.mkAction"), [
            e("genfn", [
                "ctx",
                "getArg",
                "hasArg",
                "runAction",
            ], body),
        ]),
    ]));
};
