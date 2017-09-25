module.exports = function(ast, comp, e){
    return e("ycall", e("id", "ctx.modules.get"), [
        e("id", "ctx"),
        e("str", ast.domain),
        e("str", ast.value)
    ]);
};
