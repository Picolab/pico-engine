var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
        return comp(param, {index: i});
    });

    _.each(ast.body, function(d){
        body.push(comp(d));
    });

    body.push(e("return", comp(ast.action_block), ast.action_block.loc));

    return e(";", e("call", e("id", "ctx.defaction"), [
        e("id", "ctx"),
        e("str", ast.id.value, ast.id.loc),
        e("genfn", ["ctx", "getArg"], body),
    ]));
};
