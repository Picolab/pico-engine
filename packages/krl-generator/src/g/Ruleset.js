var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "ruleset " + gen(ast.rid) + " {\n";
    if(!_.isEmpty(ast.meta)){
        src += ind() + gen(ast.meta, 1) + "\n";
    }
    if(!_.isEmpty(ast.global)){
        src += ind(1) + "global {\n";
        src += gen(ast.global, 2) + "\n";
        src += ind(1) + "}\n";
    }
    src += gen(ast.rules, 1) + "\n";
    src += ind() + "}";
    return src;
};
