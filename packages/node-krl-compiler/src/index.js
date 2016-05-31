var _ = require('lodash');
var parser = require('krl-parser');
var escodegen = require('escodegen');
var compileRuleset = require('./compileRuleset');

module.exports = function(src){
  var ast = parser(src);

  if(!_.isArray(ast) || ast.length !== 1 || ast[0].type !== 'ruleset'){
    throw new Error('one ruleset per file');
  }

  var estree = {
    "type": "Program",
    "body": [
      {
        "type": "ExpressionStatement",
        "expression": {
          "type": "AssignmentExpression",
          "operator": "=",
          "left": {
            "type": "MemberExpression",
            "computed": false,
            "object": {
              "type": "Identifier",
              "name": "module"
            },
            "property": {
              "type": "Identifier",
              "name": "exports"
            }
          },
          "right": compileRuleset(ast[0])
        }
      }
    ]
  };
  return escodegen.generate(estree);
};
