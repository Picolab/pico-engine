module.exports = function(ast, ind, gen){
    return ind() + gen(ast.left) + " " + ast.op + " " + gen(ast.right);
};
