module.exports = function(ast, ind, gen){
    var src = ind() + "clear ";
    src += gen(ast.variable);
    return src;
};
