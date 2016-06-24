var _ = require('lodash');
var parser = require('krl-parser');
var compile = require('./compile');
var escodegen = require('escodegen');

module.exports = function(ast){
  if(_.isString(ast)){
    ast = parser(ast);
  }

  var body = compile(ast);

  return escodegen.generate({
    'type': 'Program',
    'body': _.isArray(body) ? body : []
  });
};
