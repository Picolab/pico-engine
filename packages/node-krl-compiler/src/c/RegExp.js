module.exports = function(ast, comp, e){
    var flags = "";
    if(ast.value.global){
        flags += "g";
    }
    if(ast.value.ignoreCase){
        flags += "i";
    }
    return e("new", e("id", "RegExp"), [
        e("str", ast.value.source),
        e("str", flags)
    ]);
};
