var _ = require("lodash");
var callModuleFn = require("../utils/callModuleFn");

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
    var fn_body = [];
    if(ast.action
            && ast.action.type === "Identifier"
            && ast.action.value === "send_directive"){
        fn_body.push(e("return", e("obj", {
            type: e("str", "directive"),
            name: e("str", ast.args[0].value),
            options: e("obj", _.fromPairs(_.map(ast["with"], function(dec){
                return [dec.left.value, comp(dec.right)];
            })))
        })));
    }else if(ast.action
            && ast.action.type === "Identifier"
            && ast.action.value === "noop"){
        fn_body.push(e("return", e("void", e("number", 0))));
    }else if(ast.action
            && ast.action.type === "DomainIdentifier"){
        var module_call = callModuleFn(e,
            ast.action.domain,
            ast.action.value,
            buildArgsObj(ast, comp, e),
            ast.loc
        );
        if(ast.setting){
            fn_body.push(e(";", e("call", e("id", "ctx.scope.set", ast.setting.loc), [
                e("str", ast.setting.value, ast.setting.loc),
                module_call,
            ], ast.setting.loc), ast.setting.loc));
        }else{
            fn_body.push(e("return", module_call));
        }
    }else if(ast.action && ast.action.type === "Identifier"){
        fn_body.push(e("return", e(
            "ycall",
            e("call", e("id", "ctx.scope.get"), [e("str", ast.action.value)]),
            [e("id", "ctx"), buildArgsObj(ast, comp, e)]
        )));
    }else{
        throw new Error("Unsuported RuleAction.action");
    }
    var obj = {};
    if(ast.label && ast.label.type === "Identifier"){
        obj.label = e("str", ast.label.value, ast.label.loc);
    }
    obj.action = e("genfn", ["ctx"], fn_body);
    return e("obj", obj);
};
