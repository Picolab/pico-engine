var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "function(";

    src += gen(ast.params);

    src += "){\n" + _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n") + "\n" + ind() + "}";

    return src;
};
