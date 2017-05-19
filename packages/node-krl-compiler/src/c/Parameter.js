module.exports = function(ast, comp, e, context){
    var index = context.index;//the index of the param

    var tries = [
        e("string", ast.id.value, ast.id.loc),
        e("number", index),
    ];
    if(ast["default"]){
        //wrap it in a function b/c we only want to evaluate it
        //if it's needed (i.e. if default called annother function)
        tries.push(e("fn", [], [
            e("return", comp(ast["default"]), ast["default"].loc)
        ], ast["default"].loc));
    }
    return e(";", e("call", e("id", "ctx.scope.set"), [
        e("string", ast.id.value, ast.id.loc),
        e("call", e("id", "getArg"), tries)
    ]));
};
