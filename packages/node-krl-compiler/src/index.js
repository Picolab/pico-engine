var _ = require('lodash');
var e = require('estree-builder');
var parser = require('krl-parser');
var compile = require('./compile');
var escodegen = require('escodegen');

module.exports = function(ast){
  if(_.isString(ast)){
    ast = parser(ast);
  }

  if(!ast || ast.type !== 'Ruleset'){
    throw new Error('expected to compile a ruleset');
  }

  var estree = {
    'type': 'Program',
    'body': [
      e(';', e('=', e('.', e.id('module'), e.id('exports')), compile(ast)))
    ]
  };
  return escodegen.generate(estree);
};
