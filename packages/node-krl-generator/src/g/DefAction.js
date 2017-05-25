var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ind();
    src += gen(ast.id);
    src += " = defaction(";
    src += gen(ast.params);
    src += "){\n";

    src += _.map(ast.body, function(stmt){
        return gen(stmt, 1);
    }).join(";\n");

    src += gen(ast.action_block, 1);

    if(!_.isEmpty(ast.returns)){
        src += "\n" + ind(1);
        if(_.size(ast.returns) === 1){
            src += "return ";
        }else{
            src += "returns ";
        }
        src += _.map(ast.returns, function(r){
            return gen(r, 1);
        }).join(", ");
    }

    src = _.trimEnd(src);
    src += "\n" + ind() + "}";

    return src;
};
