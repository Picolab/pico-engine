var test = require('tape');
var parser = require('./');

var assertAST = function(t, src, ast){
  t.deepEquals(parser(src), ast);
};

test('parser', function(t){
  var src = '';
  src += 'ruleset rs {\n';
  src += '}';

  assertAST(t, src, [
    {
      type: 'ruleset',
      loc: 0,

      name: 'rs',
      rules: []
    }
  ]);

  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {}\n';
  src += '}';

  assertAST(t, src, [
    {
      type: 'ruleset',
      loc: 0,

      name: 'rs',
      rules: [
        {type: 'rule', loc: 15, name: 'r1'}
      ]
    }
  ]);

  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {}\n';
  src += '  rule r2 {}\n';
  src += '}';

  assertAST(t, src, [
    {
      type: 'ruleset',
      loc: 0,

      name: 'rs',
      rules: [
        {type: 'rule', loc: 15, name: 'r1'},
        {type: 'rule', loc: 28, name: 'r2'}
      ]
    }
  ]);

  t.end();
});
