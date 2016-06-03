var _ = require('lodash');
var e = require('estree-builder');
var parser = require('krl-parser');
var escodegen = require('escodegen');
var compileRuleset = require('./compileRuleset');

module.exports = function(src){
  var ast = parser(src);

  if(!_.isArray(ast) || ast.length !== 1 || ast[0].type !== 'ruleset'){
    throw new Error('one ruleset per file');
  }

  var estree = {
    'type': 'Program',
    'body': [
      e(';', e('=', e('.', e.id('module'), e.id('exports')), compileRuleset(ast[0])))
    ]
  };
  return escodegen.generate(estree);
};
