module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "schedule ";
    src += gen(ast.event_domain);
    src += " event ";
    src += gen(ast.event_type);

    if(ast.at){
        src += "\n" + ind(1) + "at " + gen(ast.at);
    }
    if(ast.timespec){
        src += "\n" + ind(1) + "repeat " + gen(ast.timespec);
    }

    if(ast.event_attrs){
        src += "\n" + ind(1) + "attributes " +  gen(ast.event_attrs, 1);
    }
    if(ast.setting){
        src += "\n" + ind(1) + "setting(" + gen(ast.setting, 1) + ")";
    }

    return src;
};
