var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ind();
    src += gen(ast.id);
    src += " = defaction(";
    src += _.map(ast.params, function(param){
        return gen(param);
    }).join(", ");
    src += "){\n";

    src += _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n");

    src += "\n";

    src += _.map(ast.actions, function(stmt){
        return gen(stmt, 1);
    }).join(";\n");

    src += "\n" + ind() + "}";

    return src;
};
