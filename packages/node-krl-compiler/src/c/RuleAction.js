var _ = require("lodash");

var buildArgsObj = function(ast, comp, e){
    if(_.isEmpty(ast.with)){
        return e("array", comp(ast.args));
    }
    var a_obj = {};
    _.each(ast.args, function(arg, i){
        a_obj[i] = comp(arg);
    });
    _.each(ast.with, function(w){
        if(w.left.type !== "Identifier"){
            throw new Error("`with` only allows keys to be identifiers");
        }
        a_obj[w.left.value] = comp(w.right);
    });
    return e("obj", a_obj);
};

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
        buildArgsObj(ast, comp, e),
    ]);
    var fn_body = [];
    if(ast.setting){
        return_value = e("call", e("id", "ctx.scope.set", ast.setting.loc), [
            e("str", ast.setting.value, ast.setting.loc),
            return_value,
        ], ast.setting.loc);
    }
    fn_body.push(e("return", return_value));

    var obj = {};
    if(ast.label && ast.label.type === "Identifier"){
        obj.label = e("str", ast.label.value, ast.label.loc);
    }
    obj.action = e("genfn", ["ctx", "runAction"], fn_body);
    return e("obj", obj);
};
