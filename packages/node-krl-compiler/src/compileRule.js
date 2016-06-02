var _ = require('lodash');
var toEstreeObject = require('./toEstreeObject');
var compileRuleSelect = require('./compileRuleSelect');
var compileRuleAction = require('./compileRuleAction');

module.exports = function(ast){
  return toEstreeObject({
    select: compileRuleSelect(ast.select),
    action: compileRuleAction(ast.actions)
  });
};
