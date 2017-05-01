module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "schedule ";
    src += gen(ast.event_domain);
    src += " event ";
    src += gen(ast.event_type);
    src += "\n" + ind(1) + "at " + gen(ast.at);

    if(ast.attributes){
        src += "\n" + ind(1) + gen(ast.attributes, 1);
    }

    return src;
};
