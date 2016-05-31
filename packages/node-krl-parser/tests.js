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

var parseRuleBody = function(rule_body, expected){
  var src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {\n';
  src += '    ' + rule_body + '\n';
  src += '  }\n';
  src += '}';
  return parser(src)[0].rules[0].body;
};

var mkEventExp = function(domain, type){
  return {
    type: 'event_expression',
    event_domain: {type: 'symbol', src: domain},
    event_type: {type: 'symbol', src: type}
  };
};

var mkEventOp = function(op, exprs, args){
  return {
    type: 'event_op',
    op: op,
    args: args || [],
    expressions: exprs
  };
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
    var ast = parseRuleBody(rule_body)[0];
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
    args: [],
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
  asertRuleAST(src, mkEventOp('and', [mkEventExp('d', 'a'), mkEventExp('d', 'b')]));

  src = 'select when d a and (d b or d c)';
  asertRuleAST(src, mkEventOp('and', [
    mkEventExp('d', 'a'),
    mkEventOp('or', [mkEventExp('d', 'b'), mkEventExp('d', 'c')])
  ]));

  t.end();
});

test('parser - action', function(t){
  var asertRuleAST = function(rule_body, expected){
    var ast = parseRuleBody('select when d a\n' + rule_body);
    t.deepEquals(rmLoc(ast), [
      {type: 'select_when', event_expressions: mkEventExp('d', 'a')},
      expected
    ]);
  };

  var src ='send_directive("say")';
  asertRuleAST(src, {
    type: 'send_directive',
    args: [
      {type: 'string', value: 'say'}
    ]
  });

  src  = 'send_directive("say") with\n';
  src += '  something = "hello world"\n';
  asertRuleAST(src, {
    type: 'send_directive',
    args: [
      {type: 'string', value: 'say'}
    ],
    "with": {
      type: "with_expression",
      pairs: [
        [
          {type: 'symbol', src: 'something'},
          {type: 'string', value: 'hello world'}
        ]
      ]
    }
  });

  t.end();
});
