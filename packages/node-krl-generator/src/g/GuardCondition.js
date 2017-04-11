module.exports = function(ast, ind, gen){
    var src = gen(ast.statement);
    if(ast.condition === "on final"){
        src += " " + ast.condition;
    }else{
        src += " if " + gen(ast.condition);
    }
    return src;
};
