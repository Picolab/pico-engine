var _ = require('lodash');
var compileRule = require('./compileRule');
var toEstreeObject = require('./toEstreeObject');

module.exports = function(ast){

  var rules_obj = {};

  _.each(ast.rules, function(rule){
    rules_obj[rule.name] = compileRule(rule);
  });

  return toEstreeObject({
    name: {
      "type": "Literal",
      "value": ast.name
    },
    rules: toEstreeObject(rules_obj)
  });
};
