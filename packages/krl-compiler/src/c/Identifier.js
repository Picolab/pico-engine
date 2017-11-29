var callModuleFn = require("../utils/callModuleFn");

module.exports = function(ast, comp, e, context){
    if(ast.value === "null"){
        //undefined is the true "null" in javascript
        //however, undefined can be re-assigned. So `void 0` returns undefined but can"t be re-assigned
        return e("void", e("number", 0));
    }
    if(context && context.identifiers_are_event_attributes){
        return callModuleFn(e, "event", "attr", e("array", [e("str", ast.value)]), ast.loc);
    }
    return e("call", e("id", "ctx.scope.get"), [e("str", ast.value)]);
};
