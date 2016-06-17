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
mk.assign = function(op, left, right){
  return {type: 'AssignmentExpression', op: op, left: left, right: right};
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
      meta: [],
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
      meta: [],
      rules: [
        {
          type: 'Rule',
          loc: {start: 15, end: 25},
          name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
          rule_state: "active",
          select_when: null,
          prelude: [],
          action_block: null,
          postlude: null
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
      meta: [],
      rules: [
        {
          type: 'Rule',
          loc: {start: 15, end: 25},
          name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
          rule_state: "active",
          select_when: null,
          prelude: [],
          action_block: null,
          postlude: null
        },
        {
          type: 'Rule',
          loc: {start: 28, end: 38},
          name: {type: 'Identifier', value: 'r2', loc: {start: 33, end: 35}},
          rule_state: "active",
          select_when: null,
          prelude: [],
          action_block: null,
          postlude: null
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
  var testAction = function(action_body, expected){
    var src = 'ruleset rs{rule r1{select when a b '+action_body+'}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast[0].rules[0].action_block, normalizeAST(expected));
  };

  var src ='send_directive("say")';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: null,
        callee: mk.id('send_directive'),
        args: [mk('say')],
        "with": []
      }
    ]
  });

  src  = 'send_directive("say") with\n';
  src += '  something = "hello world"\n';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: null,
        callee: mk.id('send_directive'),
        args: [mk('say')],
        "with": [
          mk.assign('=', mk.id('something'), mk('hello world'))
        ]
      }
    ]
  });


  src  = 'send_directive("say") with\n';
  src += '  one = 1\n';
  src += '  two = 2\n';
  src += '  three = 3\n';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: null,
        callee: mk.id('send_directive'),
        args: [mk('say')],
        "with": [
          mk.assign('=', mk.id('one'), mk(1)),
          mk.assign('=', mk.id('two'), mk(2)),
          mk.assign('=', mk.id('three'), mk(3))
        ]
      }
    ]
  });

  src  = 'if true then blah()';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: mk(true),
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: null,
        callee: mk.id('blah'),
        args: [],
        "with": []
      }
    ]
  });

  src  = 'lbl=>blah()';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('lbl'),
        callee: mk.id('blah'),
        args: [],
        "with": []
      }
    ]
  });

  src  = 'one=>blah(1) ';
  src += 'two => blah(2)';
  src += ' noop()';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    is_choose: false,
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('one'),
        callee: mk.id('blah'),
        args: [mk(1)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: mk.id('two'),
        callee: mk.id('blah'),
        args: [mk(2)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: null,
        callee: mk.id('noop'),
        args: [],
        "with": []
      }
    ]
  });

  src  = 'if exp() then\n';
  src += 'choose\n';
  src += 'one => blah(1)\n';
  src += 'two => blah(2)';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: {
      type: 'CallExpression',
      callee: mk.id('exp'),
      args: []
    },
    is_choose: true,
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('one'),
        callee: mk.id('blah'),
        args: [mk(1)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: mk.id('two'),
        callee: mk.id('blah'),
        args: [mk(2)],
        "with": []
      }
    ]
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
    meta: [],
    rules: [
      {
        loc: {start: 16, end: 30},
        type: 'Rule',
        name: {
          loc: {start: 21, end: 24},
          type: 'Identifier',
          value: 'two'
        },
        rule_state: "active",
        select_when: null,
        prelude: [],
        action_block: null,
        postlude: null
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
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].action_block.actions[0], {
    loc: {start: 39, end: 60},
    type: 'RuleAction',
    label: null,
    callee: {
      loc: {start: 39, end: 53},
      type: 'Identifier',
      value: 'send_directive'
    },
    args: [
      {
        loc: {start: 53, end: 58},
        type: 'String',
        value: 'say'
      }
    ],
    "with": []
  });
  src = 'select when a b\nsend_directive("say") with\nblah = 1';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}')[0].rules[0].action_block.actions[0], {
    loc: {start: 39, end: 74},
    type: 'RuleAction',
    label: null,
    callee: {
      loc: {start: 39, end: 53},
      type: 'Identifier',
      value: 'send_directive'
    },
    args: [
      {
        loc: {start: 53, end: 58},
        type: 'String',
        value: 'say'
      }
    ],
    'with': [
      {
        loc: {start: 66, end: 74},
        type: 'AssignmentExpression',
        op: '=',
        left: {
          loc: {start: 66, end: 70},
          type: 'Identifier',
          value: 'blah',
        },
        right: {
          loc: {start: 73, end: 74},
          type: 'Number',
          value: 1
        }
      }
    ]
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

  testLiteral('<< double <<with>\\>in >>', {
    type: 'DoubleQuote',
    value: [
      {type: 'String', value: ' double <<with>>in '},
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
    if(/\)\s*$/.test(rule_body)){
      rule_body += ';';//TODO can remove this?
    }
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
    attributes: [
      {
        type: 'EventAttributePair',
        key: mk.id('amt'),
        value: mk(/[0-9]{4}/)
      }
    ],
    where: null,
    setting: []
  });

  testEE('a b amt re#([0-9]+)# setting(amt_n)', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [
      {
        type: 'EventAttributePair',
        key: mk.id('amt'),
        value: mk(/[0-9]{4}/)
      }
    ],
    where: null,
    setting: [mk.id('amt_n')]
  });

  testEE('a b c re#(.*)# d re#(.*)# setting(e,f)', {
    type: 'EventExpression',
    event_domain: mk.id('a'),
    event_type: mk.id('b'),
    attributes: [
      {
        type: 'EventAttributePair',
        key: mk.id('c'),
        value: mk(/(.*)/)
      },
      {
        type: 'EventAttributePair',
        key: mk.id('d'),
        value: mk(/(.*)/)
      }
    ],
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

  testEE('and(a b, c d, e f)', {
    type: 'EventOperator',
    op: 'and',
    args: [
      mk.ee('a', 'b'),
      mk.ee('c', 'd'),
      mk.ee('e', 'f')
    ]
  });

  testEE('a b or and(c d, e f)', {
    type: 'EventOperator',
    op: 'or',
    args: [
      mk.ee('a', 'b'),
      {
        type: 'EventOperator',
        op: 'and',
        args: [
          mk.ee('c', 'd'),
          mk.ee('e', 'f')
        ]
      }
    ]
  });

  //TODO only after count and repeat??
  testEE('a b max(d)', {
    type: 'EventOperator',
    op: 'max',
    args: [
      mk.ee('a', 'b'),
      mk.id('d')
    ]
  });

  testEE('repeat 5 (a b) max(d)', {
    type: 'EventOperator',
    op: 'max',
    args: [
      {
        type: 'EventOperator',
        op: 'repeat',
        args: [
          mk(5),
          mk.ee('a', 'b')
        ]
      },
      mk.id('d')
    ]
  });

  testEE('a b within 5 minutes', {
    type: 'EventOperator',
    op: 'within',
    args: [
      mk.ee('a', 'b'),
      mk(5),
      mk('minutes')
    ]
  });

  testEE('a b before c d within 5 minutes', {
    type: 'EventOperator',
    op: 'within',
    args: [
      {
        type: 'EventOperator',
        op: 'before',
        args: [
          mk.ee('a', 'b'),
          mk.ee('c', 'd')
        ]
      },
      mk(5),
      mk('minutes')
    ]
  });

  t.end();
});

test('parser - Ruleset meta', function(t){
  var testMeta = function(meta_body, expected){
    var src = 'ruleset rs{meta{' + meta_body + '}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast[0].meta, normalizeAST(expected));
  };

  testMeta('one two', [
    {
      type: 'RulesetMetaProperty',
      key: mk.id('one'),
      value: mk.id('two')
    }
  ]);

  testMeta('name "blah" description <<\n  wat? ok\n  >>\nauthor "bob"', [
    {
      type: 'RulesetMetaProperty',
      key: mk.id('name'),
      value: mk('blah')
    },
    {
      type: 'RulesetMetaProperty',
      key: mk.id('description'),
      value: {
        type: 'DoubleQuote',
        value: [
          {type: 'String', value: '\n  wat? ok\n  '}
        ]
      }
    },
    {
      type: 'RulesetMetaProperty',
      key: mk.id('author'),
      value: mk('bob')
    }
  ]);

  t.end();
});

test('parser - Rule prelude', function(t){
  var testPre = function(pre_body, expected){
    var src = 'ruleset rs{rule r1{pre{' + pre_body + '}}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast[0].rules[0].prelude, normalizeAST(expected));
  };

  testPre('a = 1 b = 2', [
    {
      type: 'AssignmentExpression',
      op: '=',
      left: mk.id('a'),
      right: mk(1)
    },
    {
      type: 'AssignmentExpression',
      op: '=',
      left: mk.id('b'),
      right: mk(2)
    }
  ]);

  t.end();
});

test('parser - Rule state', function(t){
  var testRuleState = function(rule, expected){
    var src = 'ruleset rs{' + rule + '}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast[0].rules[0].rule_state, normalizeAST(expected));
  };

  testRuleState('rule r1{}', "active");
  testRuleState('rule r1 is active{}', "active");
  testRuleState('rule r1 is inactive{}', "inactive");
  testRuleState('rule r1   is    inactive   {}', "inactive");

  t.end();
});

test('parser - RulePostlude', function(t){
  //test location
  var src = 'ruleset rs{rule r1{always{one();two()}}}';
  t.deepEquals(parser(src)[0].rules[0].postlude, {
    loc: {start: 19, end: 38},
    type: 'RulePostlude',
    fired: null,
    notfired: null,
    always: [
      {
        loc: {start: 26, end: 31},
        type: 'CallExpression',
        callee: {
          loc: {start: 26, end: 29},
          type: 'Identifier',
          value: 'one'
        },
        args: []
      },
      {
        loc: {start: 32, end: 37},
        type: 'CallExpression',
        callee: {
          loc: {start: 32, end: 35},
          type: 'Identifier',
          value: 'two'
        },
        args: []
      }
    ]
  });

  t.end();
});
