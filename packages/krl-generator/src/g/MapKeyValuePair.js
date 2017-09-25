module.exports = function(ast, ind, gen){
    return gen(ast.key) + ": " + gen(ast.value);
};
