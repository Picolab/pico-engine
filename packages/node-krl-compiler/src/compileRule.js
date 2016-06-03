var _ = require('lodash');
var e = require('estree-builder');
var compileRuleSelect = require('./compileRuleSelect');
var compileRuleAction = require('./compileRuleAction');

module.exports = function(ast){
  return e.obj({
    select: compileRuleSelect(ast.select),
    action: compileRuleAction(ast.actions)
  });
};
