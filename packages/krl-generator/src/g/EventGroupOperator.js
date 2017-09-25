module.exports = function(ast, ind, gen){
    var src = "";
    src += ast.op + " " + gen(ast.n) + " (\n";
    src += ind(1) + gen(ast.event) + "\n";
    src += ind() + ")";
    if(ast.event.aggregator){
        src += " " + gen(ast.event.aggregator);
    }
    return src;
};
