module.exports = function(ast, comp, e){
    return e("return", e("ycall", e("id", "ctx.raiseError"), [
        e("id", "ctx"),
        e("string", ast.level),
        comp(ast.expression),
    ]));
};
