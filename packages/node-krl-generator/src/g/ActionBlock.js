var _ = require("lodash");

module.exports = function(ast, ind, gen){
    var src = "";
    if(ast.block_type === "choose"){
        src += "\n";
        src += ind() + ast.block_type + " " + gen(ast.condition) + " {\n";
        src += gen(ast.actions, 1);
        src += "\n";
        src += ind() + "}";
        src += "\n";
        return src;
    }
    if(ast.condition){
        src += "\n";
        src += ind() + "if " + gen(ast.condition) + " then\n";
    }
    if(_.size(ast.actions) > 1){
        if(!ast.condition){
            src += "\n";
        }
        src += ind() + ast.block_type + " {\n";
        src += gen(ast.actions, 1);
        src += "\n";
        src += ind() + "}";
        src += "\n";
    }else{
        if(ast.condition){
            src += gen(ast.actions, 1);
            src += "\n";
        }else{
            src += gen(ast.actions);
        }
    }
    return src;
};
