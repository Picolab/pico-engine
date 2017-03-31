module.exports = function(ast, comp, e){
    return e(";", e("call", e("id", "ctx.log"), [
        ast.level
            ? e("string", ast.level)
            : e("null"),
        comp(ast.expression)
    ]));
};
