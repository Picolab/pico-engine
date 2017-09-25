module.exports = function(ast, ind, gen){
    var src = "within ";
    src += gen(ast.expression);
    src += " ";
    src += ast.time_period;
    return src;
};
