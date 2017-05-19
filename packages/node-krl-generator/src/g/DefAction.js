var _ = require("lodash");
var genParamList = require("../genParamList");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ind();
    src += gen(ast.id);
    src += " = defaction(";

    src += genParamList(ast.params, ind, gen);

    src += "){\n";

    src += _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n");

    src += "\n";

    src += _.trimEnd(gen(ast.action_block, 1));

    src += "\n" + ind() + "}";

    return src;
};
