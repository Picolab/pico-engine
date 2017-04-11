var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "rule " + gen(ast.name);
    if(ast.rule_state !== "active"){
        src += " is " + ast.rule_state;
    }
    src += " {\n";
    if(ast.select){
        src += ind(1) + gen(ast.select, 1) + "\n";
    }
    if(!_.isEmpty(ast.foreach)){
        _.each(ast.foreach, function(f, i){
            src += ind(i + 1);
            src += gen(f, i + 1) + "\n";
        });
        src += "\n";
    }
    if(!_.isEmpty(ast.prelude)){
        src += ind(1) + "pre {\n";
        src += gen(ast.prelude, 2) + "\n";
        src += ind(1) + "}\n";
    }
    if(ast.action_block){
        src += gen(ast.action_block, 1) + "\n";
    }
    if(ast.postlude){
        src += gen(ast.postlude, 1) + "\n";
    }
    src += ind() + "}";
    return src;
};
