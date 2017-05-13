var _ = require("lodash");

module.exports = function(ast, ind, gen){
    return "function(" + _.map(ast.params, function(param){
        return gen(param);
    }).join(", ") + "){\n" + _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n") + "\n" + ind() + "}";
};
