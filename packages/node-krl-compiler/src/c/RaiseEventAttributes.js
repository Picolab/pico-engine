var _ = require("lodash");

module.exports = function(ast, comp, e){

  return e("obj", _.fromPairs(_.map(ast["with"], function(dec){
    return [dec.left.value, comp(dec.right)];
  })));
};
