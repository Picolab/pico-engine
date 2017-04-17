var _ = require("lodash");
var mkKRLClosure = require("../utils/mkKRLClosure");

module.exports = function(ast, comp, e, context){

    var setting = _.map(_.filter(_.zip(ast.setting, ["value", "key"]), 0), function(pair, i){
        var id = pair[0];
        var param_name = pair[1] || ("a" + i);
        var loc = id.loc;
        return e(";", e("call", e("id", "ctx.scope.set"), [
            e("str", id.value, loc),
            e("call", e("id", "getArg", loc), [
                e("string", param_name, loc),
                e("number", i, loc)
            ], loc)
        ], loc), loc);
    });

    return e(";", e("ycall", e("id", "foreach"), [
        comp(ast.expression),
        mkKRLClosure(e, setting.concat([context.iter]))
    ]));
};
