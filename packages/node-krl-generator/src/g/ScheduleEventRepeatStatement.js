module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "schedule ";
    src += gen(ast.event_domain);
    src += " event ";
    src += gen(ast.event_type);
    src += "\n" + ind(1) + "repeat " + gen(ast.timespec);

    if(ast.attributes){
        src += "\n" + ind(1) + gen(ast.attributes);
    }

    return src;
};
