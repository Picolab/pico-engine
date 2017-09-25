module.exports = function(ast, ind, gen){
    var src = ind() + "error ";
    src += ast.level + " ";
    src += gen(ast.expression);
    return src;
};
