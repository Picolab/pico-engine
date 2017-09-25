var _ = require("lodash");

module.exports = function(ast, comp, e){

    var args = {
        domain: e("string", ast.event_domain.value, ast.event_domain.loc),
        type: comp(ast.event_type),
        attributes: ast.event_attrs ? comp(ast.event_attrs) : e("nil")
    };

    if(_.has(ast, "at")){
        args.at = comp(ast.at);
    }
    if(_.has(ast, "timespec")){
        args.timespec = comp(ast.timespec);
    }

    var module_call = e("ycall", e("id", "ctx.scheduleEvent"), [e("obj", args)]);

    if(ast.setting){
        return e(";", e("call", e("id", "ctx.scope.set", ast.setting.loc), [
            e("str", ast.setting.value, ast.setting.loc),
            module_call,
        ], ast.setting.loc));
    }else{
        return e(";", module_call);
    }
};
