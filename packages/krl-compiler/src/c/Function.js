var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = comp(ast.params);

    _.each(ast.body, function(part, i){
        if(i < (ast.body.length - 1)){
            return body.push(comp(part));
        }
        if(part.type !== "ExpressionStatement"){
            throw comp.error(part.loc, "function must end with an expression");
        }
        part = part.expression;
        return body.push(e("return", comp(part)));
    });

    var paramOrder = e("array", _.map(ast.params.params, function(p){
        return e("string", p.id.value, p.id.loc);
    }), ast.params.loc);

    return e("call", e("id", "ctx.mkFunction"), [
        paramOrder,
        e("asyncfn", ["ctx", "args"], body),
    ]);
};
