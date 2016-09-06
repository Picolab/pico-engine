var _ = require("lodash");

module.exports = function(ast, comp, e){
  var meta = {};
  _.each(comp(ast.properties), function(pair){
    meta[pair[0]] = pair[1];
  });
  return e("obj", meta);
};
