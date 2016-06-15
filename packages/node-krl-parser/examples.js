var _ = require('lodash');
var rmLoc = require('./rmLoc');
var parser = require('./');
var normalizeAST = require('./normalizeASTForTestCompare');

var examples = {
  '### Literals': [
    '"hello world"',
    '-12.3',
    'thing',
    'true',
    '[1, true, false]',
    '{"one": 1}'
  ],
  '### Conditionals': [
    'a => b | c',
    'a => b |\nc => d |\n     e'
  ],
  '### Functions': [
    'function(a){\n  b\n}'
  ]
};

_.each(examples, function(srcs, head){
  console.log();
  console.log(head);
  console.log();
  console.log('```js\n' + _.map(srcs, function(src){
    var ast = normalizeAST(rmLoc(parser(src)));
    ast = _.isArray(ast) && _.size(ast) === 1 ? _.head(ast) : ast;

    return src + '\n' + JSON.stringify(ast, undefined, 2);
  }).join('\n\n') + '\n```');
})
