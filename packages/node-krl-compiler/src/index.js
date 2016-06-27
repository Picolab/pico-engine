var _ = require('lodash');
var btoa = require('btoa');
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

  var out = escodegen.generate({
    'type': 'Program',
    'body': _.isArray(body) ? body : []
  }, {
    format: {
      indent: {
        style: '  '
      }
    },
    sourceMap: true,
    sourceContent: src,
    sourceMapWithCode: true
  });

  return out.code
    + '\n//# sourceMappingURL=data:application/json;base64,'
    + btoa(out.map.toString())
    + '\n';
};
