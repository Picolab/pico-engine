var _ = require('lodash');
var test = require('tape');
var parser = require('./');

var normalizeAST = function(ast){
  if(_.isArray(ast)){
    return _.map(ast, normalizeAST);
  }
  if(_.isPlainObject(ast)){
    if(ast.type === 'regex'){
      ast.value = ast.value.toString();
    }
  }
  return ast;
};

var rmLoc = function(ast){
  if(_.isArray(ast)){
    return _.map(ast, rmLoc);
  }
  if(_.isPlainObject(ast)){
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
  return parser(src)[0].rules[0];
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
      loc: {start: 0, end: 14},

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
      loc: {start: 0, end: 27},

      name: 'rs',
      rules: [
        {type: 'rule', loc: {start: 15, end: 25}, name: 'r1'}
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
      loc: {start: 0, end: 40},

      name: 'rs',
      rules: [
        {type: 'rule', loc: {start: 15, end: 25}, name: 'r1'},
        {type: 'rule', loc: {start: 28, end: 38}, name: 'r2'}
      ]
    }
  ]);

  t.end();
});

test('parser - select when', function(t){
  var asertRuleAST = function(rule_body, expected){
    var ast = parseRuleBody(rule_body).select;
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
    var exp_ast = {
      name: ast.name,
      type: ast.type,
      select: {type: 'select_when', event_expressions: mkEventExp('d', 'a')},
    };
    if(_.size(expected) > 0){
      exp_ast.actions = [expected];
    }
    t.deepEquals(rmLoc(ast), exp_ast);
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


  var mkPair = function(key, val){
    return [
      {type: 'symbol', src: key},
      {type: 'number', src: val, value: parseFloat(val)}
    ];
  };
  src  = 'send_directive("say") with\n';
  src += '  one = 1\n';
  src += '  and\n';
  src += '  two = 2\n';
  src += '  and\n';
  src += '  three = 3\n';
  asertRuleAST(src, {
    type: 'send_directive',
    args: [
      {type: 'string', value: 'say'}
    ],
    "with": {
      type: "with_expression",
      pairs: [
        mkPair('one', '1'),
        mkPair('two', '2'),
        mkPair('three', '3')
      ]
    }
  });

  t.end();
});

test('parser - locations', function(t){
  var src = '';
  src += 'ruleset one {\n';
  src += '  rule two {\n';
  src += '  }\n';
  src += '}\n';

  t.deepEquals(parser(src)[0], {
    type: 'ruleset',
    loc: {start: 0, end: 32},
    name: 'one',
    rules: [
      {
        loc: {start: 16, end: 30},
        type: 'rule',
        name: 'two'
      }
    ]
  });

  src = 'select when a b';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].select, {
    loc: {start: 23, end: 38},
    type: 'select_when',
    event_expressions: {
      loc: {start: 35, end: 38},
      type: 'event_expression',
      event_domain: {
        loc: {start: 35, end: 36},
        type: 'symbol',
        src: 'a'
      },
      event_type: {
        loc: {start: 37, end: 38},
        type: 'symbol',
        src: 'b'
      }
    }
  });

  src = 'select when a b or c d';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].select.event_expressions, {
    loc: {start: 35, end: 45},
    type: 'event_op',
    op: 'or',
    args: [],
    expressions: [
      {
        loc: {start: 35, end: 38},
        type: 'event_expression',
        event_domain: {
          loc: {start: 35, end: 36},
          type: 'symbol',
          src: 'a'
        },
        event_type: {
          loc: {start: 37, end: 38},
          type: 'symbol',
          src: 'b'
        }
      },
      {
        loc: {start: 42, end: 45},
        type: 'event_expression',
        event_domain: {
          loc: {start: 42, end: 43},
          type: 'symbol',
          src: 'c'
        },
        event_type: {
          loc: {start: 44, end: 45},
          type: 'symbol',
          src: 'd'
        }
      }
    ]
  });
  src = 'select when a b\nsend_directive("say")';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].actions[0], {
    loc: {start: 39, end: 57},
    type: 'send_directive',
    args: [
      {
        loc: {start: 54, end: 57},
        type: 'string',
        value: 'say'
      }
    ]
  });
  src = 'select when a b\nsend_directive("say") with\nblah = 1';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].actions[0], {
    loc: {start: 39, end: 74},
    type: 'send_directive',
    args: [
      {
        loc: {start: 54, end: 57},
        type: 'string',
        value: 'say'
      }
    ],
    'with': {
      loc: {start: 61, end: 74},
      type: 'with_expression',
      pairs: [
        [
          {
            loc: {start: 66, end: 70},
            type: 'symbol',
            src: 'blah',
          },
          {
            loc: {start: 73, end: 74},
            type: 'number',
            value: 1,
            src: '1'
          }
        ]
      ]
    }
  });

  t.end();
});

test('parser - literals', function(t){
  var testLiteral = function(src, expected){
    var ast = parser(src);
    ast = rmLoc(ast);
    if(ast.length !== 1){
      t.fail('testLiteral -> ast.length !== 1');
    }
    ast = normalizeAST(ast[0]);
    expected = normalizeAST(expected);
    t.deepEquals(ast, expected);
  };
  testLiteral('"one"', {type: 'string', value: 'one'});
  testLiteral('"one\ntwo"', {type: 'string', value: 'one\ntwo'});
  testLiteral('"one\\"two"', {type: 'string', value: 'one"two'});

  testLiteral('123', {type: 'number', value: 123, src: '123'});
  testLiteral('-1', {type: 'number', value: -1, src: '-1'});
  testLiteral('1.5', {type: 'number', value: 1.5, src: '1.5'});
  testLiteral('+1.5', {type: 'number', value: 1.5, src: '+1.5'});
  testLiteral('-.50', {type: 'number', value: -0.5, src: '-.50'});
  testLiteral('-0.0', {type: 'number', value: 0, src: '-0.0'});

  testLiteral('true', {type: 'boolean', value: true, src: 'true'});
  testLiteral('false', {type: 'boolean', value: false, src: 'false'});

  testLiteral('[]', {type: 'array', value: []});
  testLiteral('["one"]', {type: 'array', value: [{type: 'string', value: 'one'}]});
  testLiteral('[  1,  false ]', {type: 'array', value: [
    {type: 'number', value: 1, src: '1'},
    {type: 'boolean', value: false, src: 'false'}
  ]});

  testLiteral('{}', {type: 'object', value: []});
  testLiteral('{ "one" : "two" }', {type: 'object', value: [
    [{type:'string',value:'one'},{type:'string',value:'two'}]
  ]});
  testLiteral('{"1":2,"3":true,"5":[]}', {type: 'object', value: [
    [{type:'string',value:'1'},{type:'number',value:2,src:'2'}],
    [{type:'string',value:'3'},{type:'boolean',value:true,src:'true'}],
    [{type:'string',value:'5'},{type:'array',value:[]}]
  ]});

  testLiteral('re#one#', {type: 'regex', value: /one/});
  testLiteral('re#one#i', {type: 'regex', value: /one/i});
  testLiteral('re#one#ig', {type: 'regex', value: /one/ig});
  testLiteral('re#^one(/two)? .* $#ig', {type: 'regex', value: /^one(\/two)? .* $/ig});
  testLiteral('re#\\# else\\\\#ig', {type: 'regex', value: /# else\\/ig});

  t.end();
});
