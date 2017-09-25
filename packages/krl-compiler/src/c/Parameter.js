module.exports = function(ast, comp, e, context){
    var index = context.index;//the index of the param

    var getArg = e("call", e("id", "getArg"), [
        e("string", ast.id.value, ast.id.loc),
        e("number", index),
    ]);

    var val = getArg;

    if(ast["default"]){
        //only evaluate default if needed i.e. default may be calling an function
        val = e("?",
            e("call", e("id", "hasArg"), [
                e("string", ast.id.value, ast.id.loc),
                e("number", index),
            ]),
            getArg,
            comp(ast["default"])
        );
    }
    return e(";", e("call", e("id", "ctx.scope.set"), [
        e("string", ast.id.value, ast.id.loc),
        val
    ]));
};
