module.exports = function(ast, ind, gen){
    var src = "";
    var actions_ind = 0;
    if(ast.condition){
        src += "\n";
        src += ind() + "if " + gen(ast.condition) + " then\n";
        actions_ind = 1;
    }
    if(ast.condition && ast.block_type !== "every"){
        src += ind() + ast.block_type + "\n";
        actions_ind = 1;
    }
    src += gen(ast.actions, actions_ind);
    if(actions_ind > 0){
        src += "\n";
    }
    return src;
};
