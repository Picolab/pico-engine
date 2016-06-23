var _ = require('lodash');
var e = require('estree-builder');
var parser = require('krl-parser');
var compile = require('./compile');
var escodegen = require('escodegen');

module.exports = function(ast){
  if(_.isString(ast)){
    ast = parser(ast);
  }

  if(!_.isArray(ast) || ast.length !== 1 || ast[0].type !== 'Ruleset'){
    throw new Error('one ruleset per file');
  }

  var estree = {
    'type': 'Program',
    'body': [
      e(';', e('=', e('.', e.id('module'), e.id('exports')), compile(ast[0])))
    ]
  };
  return escodegen.generate(estree);
};
