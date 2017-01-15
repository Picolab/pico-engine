var _ = require("lodash");
var callStdLibFn = require("../utils/callStdLibFn");

module.exports = function(ast, comp, e, context){

  var setting = _.map(_.filter(_.zip(ast.setting, ["value", "key"]), 0), function(pair, i){
    var id = pair[0];
    var param_name = pair[1] || ("a" + i);
    var loc = id.loc;
    return e(";", e("call", e("id", "ctx.scope.set"), [
          e("str", id.value, loc),
          e("call", e("id", "ctx.getArg", loc), [
            e("id", "ctx.args", loc),
            e("string", param_name, loc),
            e("number", i, loc)
          ], loc)
    ], loc), loc);
  });

  return e(";", callStdLibFn(e, "map", [
      comp(ast.expression),
      e("call", e("id", "ctx.KRLClosure"), [
        e("id", "ctx"),
        e("fn", ["ctx"], setting.concat([
          context.iter
        ]))
      ])
  ], ast.loc));
};
