module.exports = function(ast, ind, gen){
    var src = "";
    src += gen(ast.id);
    src += " = ";
    src += gen(ast.value);
    return src;
};
