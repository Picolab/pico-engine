var _ = require("lodash");

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
    console.log(ast.action);
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
