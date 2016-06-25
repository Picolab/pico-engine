var _ = require('lodash');
var parser = require('krl-parser');
var compile = require('./compile');
var escodegen = require('escodegen');
var EStreeLoc = require('estree-loc');

module.exports = function(input){
  var src = _.isString(input) ? input : null;
  var toLoc = src ? EStreeLoc(src) : _.noop;
  var ast = src ? parser(src) : input;

  var body = compile(ast, {
    toLoc: toLoc
  });

  return escodegen.generate({
    'type': 'Program',
    'body': _.isArray(body) ? body : []
  });
};
