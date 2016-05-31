var _ = require('lodash');
var test = require('tape');
var parser = require('./');

var rmLoc = function(ast){
  if(_.isArray(ast)){
    return _.map(_.compact(ast), rmLoc);
  }
  if(_.isObject(ast)){
    return _.mapValues(_.omit(ast, 'loc'), rmLoc);
  }
  return ast;
};

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

test('parser - select when', function(t){
  var asertRuleAST = function(rule_body, expected){
    var src = '';
    src += 'ruleset rs {\n';
    src += '  rule r1 {\n';
    src += '    ' + rule_body + '\n';
    src += '  }\n';
    src += '}';
    var ast = parser(src)[0].rules[0].body[0];
    t.equals(ast.type, 'select_when');
    t.deepEquals(rmLoc(ast.event_expressions), expected);
  }; 

  var src = 'select when d t';
  asertRuleAST(src, {
    type: 'event_expression',
    event_domain: {type: 'symbol', src: 'd'},
    event_type: {type: 'symbol', src: 't'}
  });

  src = 'select when d a or d b';
  asertRuleAST(src, {
    type: 'event_op',
    op: 'or',
    args: undefined,
    expressions: [
      {
        type: 'event_expression',
        event_domain: {type: 'symbol', src: 'd'},
        event_type: {type: 'symbol', src: 'a'}
      },
      {
        type: 'event_expression',
        event_domain: {type: 'symbol', src: 'd'},
        event_type: {type: 'symbol', src: 'b'}
      }
    ]
  });

  src = 'select when d a and d b';
  asertRuleAST(src, {
    type: 'event_op',
    op: 'and',
    args: undefined,
    expressions: [
      {
        type: 'event_expression',
        event_domain: {type: 'symbol', src: 'd'},
        event_type: {type: 'symbol', src: 'a'}
      },
      {
        type: 'event_expression',
        event_domain: {type: 'symbol', src: 'd'},
        event_type: {type: 'symbol', src: 'b'}
      }
    ]
  });

  t.end();
});
