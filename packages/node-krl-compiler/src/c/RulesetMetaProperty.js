var _ = require("lodash");

module.exports = function(ast, comp, e){
  var key = ast.key.value;
  var val = e("nil");
  if(key === "shares" || key === "provides"){
    val = e("arr", _.map(ast.value.ids, function(id){
      return e("str", id.value, id.loc);
    }));
  }else if(key === "use"){
    if(ast.value.kind === "module"){
      //TODO support multiple 'use'
      val = e("array", [
        e("fn", ["ctx"], [
          e(";", e("call", e("id", "ctx.modules.use", ast.value.loc), [
            e("id", "ctx"),
            ast.value.alias
              ? e("str", ast.value.alias.value, ast.value.alias.loc)
              : e("str", ast.value.rid.value, ast.value.rid.loc),
            e("str", ast.value.rid.value, ast.value.rid.loc)
          ], ast.value.loc), ast.value.loc)
        ], ast.value.loc)
      ], ast.value.loc);
      //TODO use -> ast.value.version
      //TODO use -> ast.value["with"]
    }
  }else if(key === "configure"){
    val = e("fn", ["ctx"], comp(ast.value.declarations), ast.value.loc);
  }else if(ast.value.type === "String"){
    val = e("string", ast.value.value, ast.value.loc);
  }else if(ast.value.type === "Chevron"){
    val = e("string", ast.value.value[0].value, ast.value.value[0].loc);
  }else if(ast.value.type === "Boolean"){
    val = e(ast.value.value ? "true" : "false", ast.value.loc);
  }
  return [key, val];
};
