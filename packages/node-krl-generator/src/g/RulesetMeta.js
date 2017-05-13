module.exports = function(ast, ind, gen){
    var src = "";
    src += ind() + "meta {\n";
    src += gen(ast.properties, 1) + "\n";
    src += ind() + "}";
    return src;
};
