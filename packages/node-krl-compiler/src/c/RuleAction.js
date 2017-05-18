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
    var is_runAction_used = false;
    var return_value;
    if(ast.action
            && ast.action.type === "Identifier"
            && ast.action.value === "send_directive"){
        return_value = e("obj", {
            type: e("str", "directive"),
            name: e("str", ast.args[0].value),
            options: e("obj", _.fromPairs(_.map(ast["with"], function(dec){
                return [dec.left.value, comp(dec.right)];
            })))
        });
    }else if(ast.action
            && ast.action.type === "Identifier"
            && ast.action.value === "noop"){
        return_value = e("void", e("number", 0));
    }else if(ast.action
            && ast.action.type === "DomainIdentifier"){
        return_value = e("ycall",
            e("id", "ctx.modules.action", ast.action.loc),
            [
                e("id", "ctx", ast.action.loc),
                e("str", ast.action.domain, ast.action.loc),
                e("str", ast.action.value, ast.action.loc),
                buildArgsObj(ast, comp, e),
            ],
            ast.action.loc
        );
    }else if(ast.action && ast.action.type === "Identifier"){
        is_runAction_used = true;
        return_value = e("ycall",  e("id", "runAction"), [
            e("id", "ctx"),
            e("str", ast.action.value),
            buildArgsObj(ast, comp, e),
        ]);
    }else{
        throw new Error("Unsuported RuleAction.action");
    }
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
    var args = ["ctx"];
    if(is_runAction_used){
        args.push("runAction");
    }
    obj.action = e("genfn", args, fn_body);
    return e("obj", obj);
};
