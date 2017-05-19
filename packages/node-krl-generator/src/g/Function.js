var _ = require("lodash");
var genParamList = require("../genParamList");

module.exports = function(ast, ind, gen){
    var src = "function(";

    src += genParamList(ast.params, ind, gen);

    src += "){\n" + _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n") + "\n" + ind() + "}";

    return src;
};
