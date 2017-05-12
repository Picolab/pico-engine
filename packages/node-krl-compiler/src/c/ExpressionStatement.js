module.exports = function(ast, comp, e){
    return e(";", comp(ast.expression));
};
