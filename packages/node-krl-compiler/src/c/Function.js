var _ = require("lodash");
var mkKRLClosure = require("../utils/mkKRLClosure");

module.exports = function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
        var loc = param.loc;
        return e(";", e("call", e("id", "ctx.scope.set", loc), [
            e("str", param.value, loc),
            e("call",
                e("id", "getArg", loc),
                [
                    e("string", param.value, loc),
                    e("number", i, loc)
                ],
                loc
            )
        ], loc), loc);
    });
    _.each(ast.body, function(part, i){
        if(i < (ast.body.length - 1)){
            return body.push(comp(part));
        }
        if(part.type === "ExpressionStatement"){
            part = part.expression;
        }
        return body.push(e("return", comp(part)));
    });
    return mkKRLClosure(e, body);
};
