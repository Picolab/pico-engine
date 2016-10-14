var _ = require("lodash");

module.exports = function(ast, comp, e){

  if(_.has(ast, "expression")){
    return comp(ast.expression);
  }

  return e("obj", _.fromPairs(_.map(ast["with"], function(dec){
    return [dec.left.value, comp(dec.right)];
  })));
};
