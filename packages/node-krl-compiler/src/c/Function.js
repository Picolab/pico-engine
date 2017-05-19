var _ = require("lodash");
var mkKRLClosure = require("../utils/mkKRLClosure");

module.exports = function(ast, comp, e){
    var body = _.map(ast.params, function(param, i){
        return comp(param, {index: i});
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
