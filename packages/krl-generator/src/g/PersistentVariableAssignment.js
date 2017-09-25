module.exports = function(ast, ind, gen){
    var src = ind() + gen(ast.left);
    if(ast.path_expression){
        src += "{" + gen(ast.path_expression) + "}";
    }
    src += " " + ast.op + " " + gen(ast.right);
    return src;
};
