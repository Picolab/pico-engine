module.exports = function(ast, ind, gen){
    return ast.op + (/^[a-z]/i.test(ast.op) ? " " : "") +  gen(ast.arg);
};
