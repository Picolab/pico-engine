var test = require('tape');
var parser = require('./');

var assertAST = function(t, src, ast){
  t.deepEquals(parser(src), ast);
};

test('parser', function(t){

  var src = 'ruleset blah {}';

  assertAST(t, src, [
    {type: 'ruleset', loc: 0, name: 'blah', value: []}
  ]);



  t.end();
});
