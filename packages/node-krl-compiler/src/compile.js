var _ = require('lodash');
var e = require('estree-builder');

var comp_by_type = {
  'String': function(ast, compile){
    return e.str(ast.value);
  }
};

module.exports = function(ast, options){
  options = options || {};

  var compile = function compile(ast){
    if(!ast){
      throw new Error('Invalid ast node: ' + JSON.stringify(ast));
    }
    if(_.isArray(ast)){
      return _.map(ast, function(a){
        return compile(a);
      });
    }
    if(_.has(comp_by_type, ast.type)){
      return comp_by_type[ast.type](ast, compile);
    }
    throw new Error('Unsupported ast node type: ' + ast.type);
  };

  return compile(ast, 0);
};
