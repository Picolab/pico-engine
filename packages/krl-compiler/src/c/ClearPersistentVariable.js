module.exports = function(ast, comp, e){
    return e(";", e("ycall", e("id", "ctx.modules.del"), [
        e("id", "ctx"),
        e("str", ast.variable.domain, ast.variable.loc),
        e("str", ast.variable.value, ast.variable.loc)
    ]));
};
