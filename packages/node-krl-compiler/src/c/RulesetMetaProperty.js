var _ = require("lodash");

var prop_use = function(ast, comp, e){
    var obj = {
        kind: e("str", ast.kind, ast.loc),
        rid: e("str", ast.rid.value, ast.rid.loc),
        alias: ast.alias
            ? e("str", ast.alias.value, ast.alias.loc)
            : e("str", ast.rid.value, ast.rid.loc)
    };
    if(ast.version){
        obj.version = comp(ast.version);
    }
    if(ast["with"]){
        obj["with"] = e("genfn", ["ctx"], comp(ast["with"]), ast["with"].loc);
    }
    return e("obj", obj, ast.loc);
};

module.exports = function(ast, comp, e){
    var key = ast.key.value;
    var val = e("nil");
    if(key === "shares" || key === "provides"){
        val = e("arr", _.map(ast.value.ids, function(id){
            return e("str", id.value, id.loc);
        }));
    }else if(key === "use"){
        if(ast.value.kind === "module"){
            val = [
                prop_use(ast.value, comp, e)
            ];
        }
    }else if(key === "configure"){
        val = e("genfn", ["ctx"], comp(ast.value.declarations), ast.value.loc);
    }else if(ast.value.type === "String"){
        val = e("string", ast.value.value, ast.value.loc);
    }else if(ast.value.type === "Chevron"){
        val = e("string", ast.value.value[0].value, ast.value.value[0].loc);
    }else if(ast.value.type === "Boolean"){
        val = e(ast.value.value ? "true" : "false", ast.value.loc);
    }
    return [key, val];
};
