var _ = require("lodash");

module.exports = function(ast, comp, e){
    var body = comp(ast.params);

    _.each(ast.body, function(part, i){
        if(i < (ast.body.length - 1)){
            return body.push(comp(part));
        }
        if(part.type !== "ExpressionStatement"){
            throw new Error("function must end with an expression");
        }
        part = part.expression;
        return body.push(e("return", comp(part)));
    });

    return e("call", e("id", "ctx.mkFunction"), [
        e("genfn", ["ctx", "getArg", "hasArg"], body),
    ]);
};
