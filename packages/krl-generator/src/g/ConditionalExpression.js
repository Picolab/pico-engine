module.exports = function(ast, ind, gen){
    var src = "";
    src += gen(ast.test);
    src += " => ";
    src += gen(ast.consequent);
    src += " |\n";
    if(ast.alternate.type === "ConditionalExpression"){
        src += ind() + gen(ast.alternate);
    }else{
        src += ind(1) + gen(ast.alternate);
    }
    return src;
};
