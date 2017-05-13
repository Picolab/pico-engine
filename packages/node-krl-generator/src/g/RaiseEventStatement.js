module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "raise ";
    src += gen(ast.event_domain);
    src += " event ";
    src += gen(ast.event_type);
    if(ast.for_rid){
        src += " for " + gen(ast.for_rid);
    }

    if(ast.event_attrs){
        src += "\n" + ind(1) + gen(ast.event_attrs, 1);
    }

    return src;
};
