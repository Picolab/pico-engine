var _ = require('lodash');
var test = require('tape');
var rmLoc = require('./rmLoc');
var parser = require('./');
var normalizeAST = require('./normalizeASTForTestCompare');

var parseRuleBody = function(rule_body, expected){
  var src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {\n';
  src += '    ' + rule_body + '\n';
  src += '  }\n';
  src += '}';
  return parser(src)[0].rules[0];
};

var mk = function(v){
  if(_.isNumber(v)){
    return {type: 'Number', value: v};
  }else if(v === true || v === false){
    return {type: 'Boolean', value: v};
  }else if(_.isString(v)){
    return {type: 'String', value: v};
  }else if(_.isRegExp(v)){
    return {type: 'RegExp', value: v};
  }
  return v;
};
mk.id = function(value){
  return {type: 'Identifier', value: value};
};
mk.op = function(op, left, right){
  return {
    type: 'InfixOperator',
    op: op,
    left: left,
    right: right
  };
};
mk.ee = function(domain, type, attrs, where, setting){
  return {
    type: 'EventExpression',
    event_domain: mk.id(domain),
    event_type: mk.id(type),
    attributes: attrs || [],
    where: where || null,
    setting: setting ? setting.map(mk.id) : []
  };
};

var mkEventExp = function(domain, type){
  return {
    type: 'EventExpression',
    event_domain: mk.id(domain),
    event_type: mk.id(type),
    attributes: [],
    where: null,
    setting: []
  };
};

var mkEventOp = function(op, args){
  return {
    type: 'EventOperator',
    op: op,
    args: args
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
      type: 'Ruleset',
      loc: {start: 0, end: 14},

      name: {type: 'Identifier', value: 'rs', loc: {start: 8, end: 10}},
      rules: []
    }
  ]);

  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {}\n';
  src += '}';

  assertAST(t, src, [
    {
      type: 'Ruleset',
      loc: {start: 0, end: 27},

      name: {type: 'Identifier', value: 'rs', loc: {start: 8, end: 10}},
      rules: [
        {
          type: 'Rule',
          loc: {start: 15, end: 25},
          name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
          select_when: null,
          actions: []
        }
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
      type: 'Ruleset',
      loc: {start: 0, end: 40},

      name: {type: 'Identifier', value: 'rs', loc: {start: 8, end: 10}},
      rules: [
        {
          type: 'Rule',
          loc: {start: 15, end: 25},
          name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
          select_when: null,
          actions: []
        },
        {
          type: 'Rule',
          loc: {start: 28, end: 38},
          name: {type: 'Identifier', value: 'r2', loc: {start: 33, end: 35}},
          select_when: null,
          actions: []
        }
      ]
    }
  ]);

  t.end();
});

test('parser - select when', function(t){
  var asertRuleAST = function(rule_body, expected){
    var ast = parseRuleBody(rule_body);
    t.ok(_.has(ast, 'select_when'));
    t.deepEquals(rmLoc(ast.select_when), expected);
  }; 

  var src = 'select when d t';
  asertRuleAST(src, {
    type: 'EventExpression',
    event_domain: {type: 'Identifier', value: 'd'},
    event_type: {type: 'Identifier', value: 't'},
    attributes: [],
    where: null,
    setting: []
  });

  src = 'select when d a or d b';
  asertRuleAST(src, {
    type: 'EventOperator',
    op: 'or',
    args: [
      {
        type: 'EventExpression',
        event_domain: {type: 'Identifier', value: 'd'},
        event_type: {type: 'Identifier', value: 'a'},
        attributes: [],
        where: null,
        setting: []
      },
      {
        type: 'EventExpression',
        event_domain: {type: 'Identifier', value: 'd'},
        event_type: {type: 'Identifier', value: 'b'},
        attributes: [],
        where: null,
        setting: []
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
      name: rmLoc(ast.name),
      type: ast.type,
      select_when: mkEventExp('d', 'a'),
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
      {type: 'String', value: 'say'}
    ]
  });

  src  = 'send_directive("say") with\n';
  src += '  something = "hello world"\n';
  asertRuleAST(src, {
    type: 'send_directive',
    args: [
      {type: 'String', value: 'say'}
    ],
    "with": {
      type: "with_expression",
      pairs: [
        [
          {type: 'Identifier', value: 'something'},
          {type: 'String', value: 'hello world'}
        ]
      ]
    }
  });


  var mkPair = function(key, val){
    return [
      {type: 'Identifier', value: key},
      {type: 'Number', value: parseFloat(val)}
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
      {type: 'String', value: 'say'}
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
    type: 'Ruleset',
    loc: {start: 0, end: 32},
    name: {
      loc: {start: 8, end: 11},
      type: 'Identifier',
      value: 'one'
    },
    rules: [
      {
        loc: {start: 16, end: 30},
        type: 'Rule',
        name: {
          loc: {start: 21, end: 24},
          type: 'Identifier',
          value: 'two'
        },
        select_when: null,
        actions: []
      }
    ]
  });

  src = 'select when a b';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].select_when, {
    loc: {start: 35, end: 38},
    type: 'EventExpression',
    event_domain: {
      loc: {start: 35, end: 36},
      type: 'Identifier',
      value: 'a'
    },
    event_type: {
      loc: {start: 37, end: 38},
      type: 'Identifier',
      value: 'b'
    },
    attributes: [],
    where: null,
    setting: []
  });

  src = 'select when a b or c d';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].select_when, {
    loc: {start: 35, end: 45},
    type: 'EventOperator',
    op: 'or',
    args: [
      {
        loc: {start: 35, end: 38},
        type: 'EventExpression',
        event_domain: {
          loc: {start: 35, end: 36},
          type: 'Identifier',
          value: 'a'
        },
        event_type: {
          loc: {start: 37, end: 38},
          type: 'Identifier',
          value: 'b'
        },
        attributes: [],
        where: null,
        setting: []
      },
      {
        loc: {start: 42, end: 45},
        type: 'EventExpression',
        event_domain: {
          loc: {start: 42, end: 43},
          type: 'Identifier',
          value: 'c'
        },
        event_type: {
          loc: {start: 44, end: 45},
          type: 'Identifier',
          value: 'd'
        },
        attributes: [],
        where: null,
        setting: []
      }
    ]
  });
  src = 'select when a b\nsend_directive("say")';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].actions[0], {
    loc: {start: 39, end: 58},
    type: 'send_directive',
    args: [
      {
        loc: {start: 53, end: 58},
        type: 'String',
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
        loc: {start: 53, end: 58},
        type: 'String',
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
            type: 'Identifier',
            value: 'blah',
          },
          {
            loc: {start: 73, end: 74},
            type: 'Number',
            value: 1
          }
        ]
      ]
    }
  });

  t.deepEquals(parser('a => b | c')[0], {
    loc: {start: 0, end: 10},
    type: 'ConditionalExpression',
    test:       {type: 'Identifier', value: 'a', loc: {start: 0, end: 1}},
    consequent: {type: 'Identifier', value: 'b', loc: {start: 5, end: 6}},
    alternate:  {type: 'Identifier', value: 'c', loc: {start: 9, end: 10}}
  });

  t.deepEquals(parser('function(a){b}')[0], {
    loc: {start: 0, end: 14},
    type: 'Function',
    params: [{type: 'Identifier', value: 'a', loc: {start: 9, end: 10}}],
    body: [{type: 'Identifier', value: 'b', loc: {start: 12, end: 13}}]
  });

  t.end();
});

test('parser - literals', function(t){
  var testLiteral = function(src, expected){
    var ast = normalizeAST(rmLoc(parser(src)));
    expected = normalizeAST(expected);
    t.deepEquals(ast, [expected]);
  };
  testLiteral('"one"', {type: 'String', value: 'one'});
  testLiteral('"one\ntwo"', {type: 'String', value: 'one\ntwo'});
  testLiteral('"one\\"two"', {type: 'String', value: 'one"two'});

  testLiteral('123', {type: 'Number', value: 123});
  testLiteral('-1', {type: 'Number', value: -1});
  testLiteral('1.5', {type: 'Number', value: 1.5});
  testLiteral('+1.5', {type: 'Number', value: 1.5});
  testLiteral('-.50', {type: 'Number', value: -0.5});
  testLiteral('-0.0', {type: 'Number', value: 0});

  testLiteral('true', {type: 'Boolean', value: true});
  testLiteral('false', {type: 'Boolean', value: false});

  testLiteral('[]', {type: 'Array', value: []});
  testLiteral('["one"]', {type: 'Array', value: [{type: 'String', value: 'one'}]});
  testLiteral('[  1,  false ]', {type: 'Array', value: [
    {type: 'Number', value: 1},
    {type: 'Boolean', value: false}
  ]});

  testLiteral('{}', {type: 'Object', value: []});
  testLiteral('{ "one" : "two" }', {type: 'Object', value: [
    {
      type: 'ObjectProperty',
      key: {type:'String',value:'one'},
      value: {type:'String',value:'two'}
    }
  ]});
  testLiteral('{"1":2,"3":true,"5":[]}', {type: 'Object', value: [
    {
      type: 'ObjectProperty',
      key: {type:'String',value:'1'},
      value: {type:'Number',value:2}
    },
    {
      type: 'ObjectProperty',
      key: {type:'String',value:'3'},
      value: {type:'Boolean',value:true}
    },
    {
      type: 'ObjectProperty',
      key: {type:'String',value:'5'},
      value: {type:'Array',value:[]}
    }
  ]});

  testLiteral('re#one#', {type: 'RegExp', value: /one/});
  testLiteral('re#one#i', {type: 'RegExp', value: /one/i});
  testLiteral('re#one#ig', {type: 'RegExp', value: /one/ig});
  testLiteral('re#^one(/two)? .* $#ig', {type: 'RegExp', value: /^one(\/two)? .* $/ig});
  testLiteral('re#\\# else\\\\#ig', {type: 'RegExp', value: /# else\\/ig});
  testLiteral('re#/ok/g#ig', {type: 'RegExp', value: /\/ok\/g/ig});

  testLiteral('<<>>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: ''}
    ]
  });
  testLiteral('<<\n  hello\n  >>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: '\n  hello\n  '}
    ]
  });
  testLiteral('<<#{1}>>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: ''},
      {type: 'Number', value: 1},
      {type: 'String', value: ''}
    ]
  });

  testLiteral('<<one#{2}three>>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: 'one'},
      {type: 'Number', value: 2},
      {type: 'String', value: 'three'}
    ]
  });

  testLiteral('<<one#{{"one":2}}three>>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: 'one'},
      {type: 'Object', value: [
        {
          type: 'ObjectProperty',
          key: {type:'String',value:'one'},
          value: {type:'Number',value:2}
        }
      ]},
      {type: 'String', value: 'three'}
    ]
  });

  t.end();
});

test('parser - operator precedence', function(t){
  var testPrec = function(src, expected){
    var ast = normalizeAST(rmLoc(parser(src)));
    var s = function(ast){
      if(_.isArray(ast)){
        return _.map(ast, s).join(' ');
      }else if(ast.type === 'InfixOperator'){
        return '(' + ast.op + ' ' + s(ast.left) + ' ' + s(ast.right) + ')';
      }
      return ast.value;
    };
    t.equals(s(ast), expected);
  };

  testPrec('a + b', '(+ a b)');
  testPrec('a+b+c', '(+ (+ a b) c)');
  testPrec('a+b*c', '(+ a (* b c))');

  testPrec('a || b && c', '(|| a (&& b c))');
  testPrec('(a || b) && c', '(&& (|| a b) c)');

  testPrec('a && b cmp c', '(&& a (cmp b c))');

  testPrec('a * b < c && d', '(&& (< (* a b) c) d)');

  t.end();
});

test('parser - expressions', function(t){
  var testExp = function(src, expected){
    var ast = normalizeAST(rmLoc(parser(src)));
    expected = normalizeAST(expected);
    t.deepEquals(ast, [expected]);
  };

  testExp('one()', {
    type: 'CallExpression',
    callee: {type: 'Identifier', value: 'one'},
    args: []
  });
  testExp('one ( 1 , 2 )', {
    type: 'CallExpression',
    callee: {type: 'Identifier', value: 'one'},
    args: [{type: 'Number', value: 1}, {type: 'Number', value: 2}]
  });
  testExp('one(1,2)', {
    type: 'CallExpression',
    callee: {type: 'Identifier', value: 'one'},
    args: [{type: 'Number', value: 1}, {type: 'Number', value: 2}]
  });

  testExp('1 + "two"', {
    type: 'InfixOperator',
    op: '+',
    left: {type: 'Number', value: 1},
    right: {type: 'String', value: 'two'}
  });

  testExp('1 like re#one#i', {
    type: 'InfixOperator',
    op: 'like',
    left: {type: 'Number', value: 1},
    right: {type: 'RegExp', value: /one/i}
  });

  testExp('a => b | c', {
    type: 'ConditionalExpression',
    test:       {type: 'Identifier', value: 'a'},
    consequent: {type: 'Identifier', value: 'b'},
    alternate:  {type: 'Identifier', value: 'c'}
  });

  testExp('a => b | c => d | e', {
    type: 'ConditionalExpression',
    test:       {type: 'Identifier', value: 'a'},
    consequent: {type: 'Identifier', value: 'b'},
    alternate:  {
      type: 'ConditionalExpression',
      test:       {type: 'Identifier', value: 'c'},
      consequent: {type: 'Identifier', value: 'd'},
      alternate:  {type: 'Identifier', value: 'e'}
    }
  });

  testExp('a=>b|c=>d|e', {
    type: 'ConditionalExpression',
    test:       {type: 'Identifier', value: 'a'},
    consequent: {type: 'Identifier', value: 'b'},
    alternate:  {
      type: 'ConditionalExpression',
      test:       {type: 'Identifier', value: 'c'},
      consequent: {type: 'Identifier', value: 'd'},
      alternate:  {type: 'Identifier', value: 'e'}
    }
  });

  testExp('function (){}', {
    type: 'Function',
    params: [],
    body: []
  });
  testExp('function(a){b}', {
    type: 'Function',
    params: [mk.id('a')],
    body: [mk.id('b')]
  });

  testExp('a = "one"', {
    type: 'AssignmentExpression',
    op: '=',
    left: mk.id('a'),
    right: mk('one')
  });

  t.end();
});

test('parser - EventExpression', function(t){
  var testEE = function(rule_body, expected){
    var ast = normalizeAST(rmLoc(parseRuleBody('select when ' + rule_body)));
    t.deepEquals(ast.select_when, normalizeAST(expected));
  }; 

  testEE('a b', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [],
    where: null,
    setting: []
  });

  testEE('a b where c', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [],
    where: mk.id('c'),
    setting: []
  });

  testEE('a b where 1 / (c - 2)', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [],
    where: mk.op('/', mk(1), mk.op('-', mk.id('c'), mk(2))),
    setting: []
  });

  testEE('a b amt re#[0-9]{4}#', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [mk.id('amt'), mk(/[0-9]{4}/)],
    where: null,
    setting: []
  });

  testEE('a b amt re#([0-9]+)# setting(amt_n)', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [mk.id('amt'), mk(/[0-9]{4}/)],
    where: null,
    setting: [mk.id('amt_n')]
  });

  testEE('a b c re#(.*)# d re#(.*)# setting(e,f)', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [mk.id('c'), mk(/(.*)/), mk.id('d'), mk(/(.*)/)],
    where: null,
    setting: [mk.id('e'), mk.id('f')]
  });

  testEE('a b setting(c) or d e setting(f) before g h', {
    type: 'EventOperator',
    op: 'or',
    args: [
      mk.ee('a', 'b', [], null, ['c']),
      {
        type: 'EventOperator',
        op: 'before',
        args: [
          mk.ee('d', 'e', [], null, ['f']),
          mk.ee('g', 'h')
        ]
      }
    ]
  });

  testEE('a b between(c d, e f)', {
    type: 'EventOperator',
    op: 'between',
    args: [
      mk.ee('a', 'b'),
      mk.ee('c', 'd'),
      mk.ee('e', 'f')
    ]
  });

  testEE('a b not\n  between ( c d,e f )', {
    type: 'EventOperator',
    op: 'not between',
    args: [
      mk.ee('a', 'b'),
      mk.ee('c', 'd'),
      mk.ee('e', 'f')
    ]
  });

  testEE('any 2 (a b, c d, e f)', {
    type: 'EventOperator',
    op: 'any',
    args: [
      mk(2),
      mk.ee('a', 'b'),
      mk.ee('c', 'd'),
      mk.ee('e', 'f')
    ]
  });

  testEE('count 2 (a b)', {
    type: 'EventOperator',
    op: 'count',
    args: [
      mk(2),
      mk.ee('a', 'b')
    ]
  });

  testEE('repeat 2(a b)', {
    type: 'EventOperator',
    op: 'repeat',
    args: [
      mk(2),
      mk.ee('a', 'b')
    ]
  });

  //TODO
  //TODO
  //https://picolabs.atlassian.net/wiki/display/docs/Group+Operators
  //TODO
  //TODO
  t.end();
});
