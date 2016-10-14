var callModuleFn = require("../utils/callModuleFn");

module.exports = function(ast, comp, e){

  var args = [e("obj", {
    domain: e("string", ast.event_domain.value, ast.event_domain.loc),
    type: comp(ast.event_type),
    for_rid: ast.for_rid ? comp(ast.for_rid) : e("nil"),
    attributes: ast.attributes ? comp(ast.attributes) : e("nil")
  })];

  return e(";", callModuleFn(e, "event", "raise", args, ast.loc));
};
