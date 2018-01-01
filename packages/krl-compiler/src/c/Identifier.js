var callModuleFn = require("../utils/callModuleFn");

module.exports = function(ast, comp, e, context){
    if(context && context.identifiers_are_event_attributes){
        return callModuleFn(e, "event", "attr", e("array", [e("str", ast.value)]), ast.loc);
    }
    return e("call", e("id", "ctx.scope.get"), [e("str", ast.value)]);
};
