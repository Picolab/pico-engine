module.exports = function(ast, ind, gen){
    return ind() + gen(ast.expression);
};
