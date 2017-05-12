module.exports = function(ast, comp, e){
    return e(";", e("ycall", e("id", "ctx.raiseError"), [
        e("string", ast.level),
        comp(ast.expression),
    ]));
};
