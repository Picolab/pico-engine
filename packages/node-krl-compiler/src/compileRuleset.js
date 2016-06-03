var _ = require('lodash');
var e = require('estree-builder');
var compileRule = require('./compileRule');

module.exports = function(ast){

  var rules_obj = {};

  _.each(ast.rules, function(rule){
    rules_obj[rule.name] = compileRule(rule);
  });

  return e.obj({
    name: e.str(ast.name),
    rules: e.obj(rules_obj)
  });
};
