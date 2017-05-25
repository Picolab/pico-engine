var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = comp(ast.params);

    _.each(ast.body, function(d){
        body.push(comp(d));
    });

    body.push(e(";", e("call", e("id", "processActionBlock", ast.action_block.loc), [
        e("id", "ctx", ast.action_block),
        comp(ast.action_block),
    ], ast.action_block.loc), ast.action_block.loc));


    body.push(e("return", e("array", _.map(ast.returns, function(ret){
        return comp(ret);
    }))));

    return e(";", e("call", e("id", "ctx.defaction"), [
        e("id", "ctx"),
        e("str", ast.id.value, ast.id.loc),
        e("genfn", [
            "ctx",
            "getArg",
            "hasArg",
            "processActionBlock",
        ], body),
    ]));
};
