var _ = require("lodash");
var callModuleFn = require("../utils/callModuleFn");

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
    fn_body.push(e("return", callModuleFn(e,
            ast.action.domain,
            ast.action.value,
            comp(ast.args),
            ast.loc)));
  }else if(ast.action && ast.action.type === "Identifier"){
    var args_obj;
    if(_.isEmpty(ast.with)){
      args_obj = e("array", comp(ast.args));
    }else{
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
      args_obj = e("obj", a_obj);
    }
    fn_body.push(e("return", e(
      "call",
      e("call", e("id", "ctx.scope.get"), [e("str", ast.action.value)]),
      [e("id", "ctx"), args_obj]
    )));
  }else{
    throw new Error("Unsuported RuleAction.action");
  }
  var obj = {};
  if(ast.label && ast.label.type === "Identifier"){
    obj.label = e("str", ast.label.value, ast.label.loc);
  }
  obj.action = e("fn", ["ctx"], fn_body);
  return e("obj", obj);
};
