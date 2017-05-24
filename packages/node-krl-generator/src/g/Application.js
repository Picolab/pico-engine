module.exports = function(ast, ind, gen){
    var src = gen(ast.callee);
    src += "(";
    src += gen(ast.args);
    src += ")";
    return src;
};
