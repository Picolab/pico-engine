var _ = require("lodash");

var actionsInCurlies = function(actions, ind, gen){
    var src = "";
    src += "{\n";
    src += ind(1) + gen(actions, 1).trim().replace(/\n\n/g, "\n");
    src += "\n";
    src += ind() + "}";
    src += "\n";
    return src;
};

module.exports = function(ast, ind, gen){
    var src = "";
    if(ast.block_type === "choose"){
        src += "\n";
        src += ind() + ast.block_type + " " + gen(ast.condition) + " ";
        src += actionsInCurlies(ast.actions, ind, gen);
        return src;
    }
    if(ast.condition){
        src += "\n";
        src += ind() + "if " + gen(ast.condition) + " then\n";
    }
    if(_.size(ast.actions) > 1 || ast.block_type !== "every"){
        if(!ast.condition){
            src += "\n";
        }
        src += ind() + ast.block_type + " ";
        src += actionsInCurlies(ast.actions, ind, gen);
    }else{
        if(ast.condition){
            src += ind(1) + gen(ast.actions, 1).trim();
            src += "\n";
        }else{
            src += gen(ast.actions);
        }
    }
    return src;
};
