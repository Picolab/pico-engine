var _ = require('lodash');
var rmLoc = require('./rmLoc');
var parser = require('./');
var normalizeAST = require('./normalizeASTForTestCompare');

var examples = {
  '### Literals': [
    '"hello world"'
  ]
};

_.each(examples, function(srcs, head){
  console.log();
  console.log(head);
  console.log();
  _.each(srcs, function(src){
    var ast = normalizeAST(rmLoc(parser(src)));
    ast = _.isArray(ast) && _.size(ast) === 1 ? _.head(ast) : ast;

    console.log(src);
    console.log(JSON.stringify(ast, false, 2));
    console.log();
  });
})
