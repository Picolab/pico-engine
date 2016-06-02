var _ = require('lodash');
var toEstreeObject = require('./toEstreeObject');
var compileRuleSelect = require('./compileRuleSelect');
var compileRuleAction = require('./compileRuleAction');

module.exports = function(ast){
  return toEstreeObject({
    select: compileRuleSelect(ast.actions),
    action: compileRuleAction(ast.actions)
  });
};
