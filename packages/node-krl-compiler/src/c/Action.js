var _ = require("lodash");

module.exports = function(ast, comp, e){
    if(!ast.action){
        throw new Error("Missing RuleAction.action");
    }
    if(ast.action.type !== "Identifier" && ast.action.type !== "DomainIdentifier"){
        throw new Error("Unsuported RuleAction.action");
    }
    var return_value = e("ycall",  e("id", "runAction"), [
        e("id", "ctx"),
        ast.action.domain
            ? e("str", ast.action.domain, ast.action.loc)
            : e("void", e("number", 0)),
        e("str", ast.action.value),
        comp(ast.args),
    ]);
    var fn_body = [];
    if(!_.isEmpty(ast.setting)){
        return_value = e("call", e("id", "ctx.scope.set", ast.setting[0].loc), [
            e("str", ast.setting[0].value, ast.setting[0].loc),
            return_value,
        ], ast.setting[0].loc);
    }
    fn_body.push(e("return", return_value));

    var obj = {};
    if(ast.label && ast.label.type === "Identifier"){
        obj.label = e("str", ast.label.value, ast.label.loc);
    }
    obj.action = e("genfn", ["ctx", "runAction"], fn_body);
    return e("obj", obj);
};
