var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "function(";
    src += gen(ast.params);
    src += "){\n";

    var body = _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n");
    if(body.length > 0){
        body += ";";
    }

    src += body;
    src += "\n" + ind() + "}";

    return src;
};
