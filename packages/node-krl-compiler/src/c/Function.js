var _ = require("lodash");
var mkKRLClosure = require("../utils/mkKRLClosure");

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

    return mkKRLClosure(e, body);
};
