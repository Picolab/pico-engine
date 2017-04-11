module.exports = function(ast, ind, gen){
    var src = ind() + "log ";
    if(ast.level){
        src += ast.level + " ";
    }
    src += gen(ast.expression);
    return src;
};
