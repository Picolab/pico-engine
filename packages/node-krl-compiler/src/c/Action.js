var _ = require("lodash");

module.exports = function(ast, comp, e){
    if(!ast.action){
        throw new Error("Missing RuleAction.action");
    }
    if(ast.action.type !== "Identifier" && ast.action.type !== "DomainIdentifier"){
        throw new Error("Unsuported RuleAction.action");
    }
    var fn_body = [];

    fn_body.push(e("var", "returns", e("ycall",  e("id", "runAction"), [
        e("id", "ctx"),
        ast.action.domain
            ? e("str", ast.action.domain, ast.action.loc)
            : e("void", e("number", 0)),
        e("str", ast.action.value),
        comp(ast.args),
    ])));

    _.each(ast.setting, function(set, i){
        fn_body.push(e(";", e("call", e("id", "ctx.scope.set", set.loc), [
            e("str", set.value, set.loc),
            e("get", e("id", "returns"), e("number", i, set.loc), set.loc),
        ], set.loc), set.loc));
    });

    var obj = {};
    if(ast.label && ast.label.type === "Identifier"){
        obj.label = e("str", ast.label.value, ast.label.loc);
    }
    obj.action = e("genfn", ["ctx", "runAction"], fn_body);
    return e("obj", obj);
};
