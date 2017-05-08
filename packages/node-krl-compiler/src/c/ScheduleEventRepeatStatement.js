var callModuleFn = require("../utils/callModuleFn");

module.exports = function(ast, comp, e){

    var args = e("obj", {
        timespec: comp(ast.timespec),

        domain: e("string", ast.event_domain.value, ast.event_domain.loc),
        type: comp(ast.event_type),
        attributes: ast.attributes ? comp(ast.attributes) : e("nil")
    });

    var module_call = callModuleFn(e, "schedule", "eventRepeat", args, ast.loc);

    if(ast.setting){
        return e(";", e("call", e("id", "ctx.scope.set", ast.setting.loc), [
            e("str", ast.setting.value, ast.setting.loc),
            module_call,
        ], ast.setting.loc));
    }else{
        return e(";", module_call);
    }
};
