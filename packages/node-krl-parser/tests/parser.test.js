var _ = require('lodash');
var test = require('tape');
var rmLoc = require('./rmLoc');
var parser = require('../');
var normalizeAST = require('./normalizeASTForTestCompare');

var parseRuleBody = function(rule_body, expected){
  var src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {\n';
  src += '    ' + rule_body + '\n';
  src += '  }\n';
  src += '}';
  return parser(src).rules[0];
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
  }else if(_.isPlainObject(v)){
    return {type: 'Map', value: _.map(v, function(val, key){
      return {
        type: 'MapKeyValuePair',
        key: {type:'String', value: key},
        value: val
      };
    })};
  }
  return v;
};
mk.id = function(value){
  return {type: 'Identifier', value: value};
};
mk.key = function(value){
  return {type: 'Keyword', value: value};
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
mk.declare = function(op, left, right){
  return {type: 'Declaration', op: op, left: left, right: right};
};
mk.meta = function(key, value){
  return {
    type: 'RulesetMetaProperty',
    key: mk.key(key),
    value: value
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

  assertAST(t, src, {
    type: 'Ruleset',
    loc: {start: 0, end: 14},

    name: {type: 'RulesetName', value: 'rs', loc: {start: 8, end: 10}},
    meta: [],
    global: [],
    rules: []
  });

  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {}\n';
  src += '}';

  assertAST(t, src, {
    type: 'Ruleset',
    loc: {start: 0, end: 27},

    name: {type: 'RulesetName', value: 'rs', loc: {start: 8, end: 10}},
    meta: [],
    global: [],
    rules: [
      {
        type: 'Rule',
        loc: {start: 15, end: 25},
        name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
        rule_state: "active",
        select: null,
        prelude: [],
        action_block: null,
        postlude: null
      }
    ]
  });

  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r1 {}\n';
  src += '  rule r2 {}\n';
  src += '}';

  assertAST(t, src, {
    type: 'Ruleset',
    loc: {start: 0, end: 40},

    name: {type: 'RulesetName', value: 'rs', loc: {start: 8, end: 10}},
    meta: [],
    global: [],
    rules: [
      {
        type: 'Rule',
        loc: {start: 15, end: 25},
        name: {type: 'Identifier', value: 'r1', loc: {start: 20, end: 22}},
        rule_state: "active",
        select: null,
        prelude: [],
        action_block: null,
        postlude: null
      },
      {
        type: 'Rule',
        loc: {start: 28, end: 38},
        name: {type: 'Identifier', value: 'r2', loc: {start: 33, end: 35}},
        rule_state: "active",
        select: null,
        prelude: [],
        action_block: null,
        postlude: null
      }
    ]
  });

  t.end();
});

test('select when', function(t){
  var asertRuleAST = function(rule_body, expected){
    var ast = parseRuleBody(rule_body);
    t.ok(ast.select.kind === 'when');
    t.deepEquals(rmLoc(ast.select.event), expected);
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

test('action', function(t){
  var testAction = function(action_body, expected){
    var src = 'ruleset rs{rule r1{select when a b '+action_body+'}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast.rules[0].action_block, normalizeAST(expected));
  };

  var src ='send_directive("say")';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: null,
        action: mk.id('send_directive'),
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
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: null,
        action: mk.id('send_directive'),
        args: [mk('say')],
        "with": [
          mk.declare('=', mk.id('something'), mk('hello world'))
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
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: null,
        action: mk.id('send_directive'),
        args: [mk('say')],
        "with": [
          mk.declare('=', mk.id('one'), mk(1)),
          mk.declare('=', mk.id('two'), mk(2)),
          mk.declare('=', mk.id('three'), mk(3))
        ]
      }
    ]
  });

  src  = 'if true then blah()';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: mk(true),
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: null,
        action: mk.id('blah'),
        args: [],
        "with": []
      }
    ]
  });

  src  = 'lbl=>blah()';
  testAction(src, {
    type: 'RuleActionBlock',
    condition: null,
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('lbl'),
        action: mk.id('blah'),
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
    block_type: "every",
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('one'),
        action: mk.id('blah'),
        args: [mk(1)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: mk.id('two'),
        action: mk.id('blah'),
        args: [mk(2)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: null,
        action: mk.id('noop'),
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
      type: 'Application',
      callee: mk.id('exp'),
      args: []
    },
    block_type: "choose",
    actions: [
      {
        type: 'RuleAction',
        label: mk.id('one'),
        action: mk.id('blah'),
        args: [mk(1)],
        "with": []
      },
      {
        type: 'RuleAction',
        label: mk.id('two'),
        action: mk.id('blah'),
        args: [mk(2)],
        "with": []
      }
    ]
  });

  t.end();
});

test('locations', function(t){
  var src = '';
  src += 'ruleset one {\n';
  src += '  rule two {\n';
  src += '  }\n';
  src += '}\n';

  t.deepEquals(parser(src), {
    type: 'Ruleset',
    loc: {start: 0, end: 32},
    name: {
      loc: {start: 8, end: 11},
      type: 'RulesetName',
      value: 'one'
    },
    meta: [],
    global: [],
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
        select: null,
        prelude: [],
        action_block: null,
        postlude: null
      }
    ]
  });

  src = 'select when a b';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}').rules[0].select.event, {
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
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}').rules[0].select.event, {
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
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}').rules[0].action_block.actions[0], {
    loc: {start: 39, end: 60},
    type: 'RuleAction',
    label: null,
    action: {
      loc: {start: 39, end: 53},
      type: 'Identifier',
      value: 'send_directive'
    },
    args: [
      {
        loc: {start: 54, end: 59},
        type: 'String',
        value: 'say'
      }
    ],
    "with": []
  });
  src = 'select when a b\nsend_directive("say") with\nblah = 1';
  t.deepEquals(parser('ruleset one {rule two {' + src + '}}').rules[0].action_block.actions[0], {
    loc: {start: 39, end: 74},
    type: 'RuleAction',
    label: null,
    action: {
      loc: {start: 39, end: 53},
      type: 'Identifier',
      value: 'send_directive'
    },
    args: [
      {
        loc: {start: 54, end: 59},
        type: 'String',
        value: 'say'
      }
    ],
    'with': [
      {
        loc: {start: 66, end: 74},
        type: 'Declaration',
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

  var testTopLoc = function(src){
    var src2 = '\n  ' + src + '  \n ';
    var ast = parser(src2);
    t.equals(
      src2.substring(ast[0].loc.start, ast[0].loc.end),
      src,
      'if loc is correct, it will match the original input'
    );
  };

  testTopLoc('name');
  testTopLoc('"some string"');
  testTopLoc('-1.2');
  testTopLoc('a => b | c');
  testTopLoc('function(a){b}');
  testTopLoc('a [ 1  ]');
  testTopLoc('a {[ "a", "b"] }');

  t.end();
});

test('literals', function(t){
  var testLiteral = function(src, expected){
    var ast = parser(src);
    ast = ast[0].expression;
    t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
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

  testLiteral('{}', {type: 'Map', value: []});
  testLiteral('{ "one" : "two" }', {type: 'Map', value: [
    {
      type: 'MapKeyValuePair',
      key: {type:'String',value:'one'},
      value: {type:'String',value:'two'}
    }
  ]});
  testLiteral('{"1":2,"3":true,"5":[]}', {type: 'Map', value: [
    {
      type: 'MapKeyValuePair',
      key: {type:'String',value:'1'},
      value: {type:'Number',value:2}
    },
    {
      type: 'MapKeyValuePair',
      key: {type:'String',value:'3'},
      value: {type:'Boolean',value:true}
    },
    {
      type: 'MapKeyValuePair',
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
    type: 'Chevron',
    value: [
      {type: 'String', value: ''}
    ]
  });
  testLiteral('<<\n  hello\n  >>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: '\n  hello\n  '}
    ]
  });
  testLiteral('<<#{1}>>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: ''},
      {type: 'Number', value: 1},
      {type: 'String', value: ''}
    ]
  });

  testLiteral('<<one#{2}three>>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: 'one'},
      {type: 'Number', value: 2},
      {type: 'String', value: 'three'}
    ]
  });

  testLiteral('<<one#{{"one":2}}three>>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: 'one'},
      {type: 'Map', value: [
        {
          type: 'MapKeyValuePair',
          key: {type:'String',value:'one'},
          value: {type:'Number',value:2}
        }
      ]},
      {type: 'String', value: 'three'}
    ]
  });

  testLiteral('<< This #{ x{"flip"} } that >>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: ' This '},
      {
        type: 'MemberExpression',
        object: mk.id('x'),
        property: mk('flip'),
        method: 'path'
      },
      {type: 'String', value: ' that '}
    ]
  });

  testLiteral('<< double <<with>\\>in >>', {
    type: 'Chevron',
    value: [
      {type: 'String', value: ' double <<with>>in '},
    ]
  });

  t.end();
});

test('operator precedence', function(t){
  var testPrec = function(src, expected){
    var ast = normalizeAST(rmLoc(parser(src)));
    ast = ast[0].expression;
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

test('expressions', function(t){
  var testExp = function(src, expected){
    var ast = parser(src);
    ast = ast[0];
    if(ast.type === 'ExpressionStatement'){
      ast = ast.expression;
    }
    t.deepEquals(normalizeAST(rmLoc(ast)), normalizeAST(expected));
  };

  testExp('one()', {
    type: 'Application',
    callee: {type: 'Identifier', value: 'one'},
    args: []
  });
  testExp('one ( 1 , 2 )', {
    type: 'Application',
    callee: {type: 'Identifier', value: 'one'},
    args: [{type: 'Number', value: 1}, {type: 'Number', value: 2}]
  });
  testExp('one(1,2)', {
    type: 'Application',
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
    body: [
      {
        type: 'ExpressionStatement',
        expression: mk.id('b')
      }
    ]
  });

  testExp('a = "one"', {
    type: 'Declaration',
    op: '=',
    left: mk.id('a'),
    right: mk('one')
  });

  testExp('a[1]', {
    type: 'MemberExpression',
    object: mk.id('a'),
    property: mk(1),
    method: 'index'
  });

  testExp('matrix[i][j]', {
    type: 'MemberExpression',
    object: {
      type: 'MemberExpression',
      object: mk.id('matrix'),
      property: mk.id('i'),
      method: 'index'
    },
    property: mk.id('j'),
    method: 'index'
  });

  testExp('foo{"bar"}', {
    type: 'MemberExpression',
    object: mk.id('foo'),
    property: mk('bar'),
    method: 'path'
  });

  testExp('foo{"bar"}()', {
    type: 'Application',
    callee: {
      type: 'MemberExpression',
      object: mk.id('foo'),
      property: mk('bar'),
      method: 'path'
    },
    args: []
  });

  testExp('one.two', {
    type: 'MemberExpression',
    object: mk.id('one'),
    property: mk.id('two'),
    method: 'dot'
  });

  testExp('one.two()', {
    type: 'Application',
    callee: {
      type: 'MemberExpression',
      object: mk.id('one'),
      property: mk.id('two'),
      method: 'dot'
    },
    args: []
  });

  testExp('one().two', {
    type: 'MemberExpression',
    object: {
      type: 'Application',
      callee: mk.id('one'),
      args: []
    },
    property: mk.id('two'),
    method: 'dot'
  });

  testExp('one().two()', {
    type: 'Application',
    callee: {
      type: 'MemberExpression',
      object: {
        type: 'Application',
        callee: mk.id('one'),
        args: []
      },
      property: mk.id('two'),
      method: 'dot'
    },
    args: []
  });

  t.end();
});

test('EventExpression', function(t){
  var testEE = function(rule_body, expected){
    if(/\)\s*$/.test(rule_body)){
      rule_body += ';';//TODO can remove this?
    }
    var ast = normalizeAST(rmLoc(parseRuleBody('select when ' + rule_body)));
    t.deepEquals(ast.select.event, normalizeAST(expected));
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
        type: 'AttributeMatch',
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
        type: 'AttributeMatch',
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
        type: 'AttributeMatch',
        key: mk.id('c'),
        value: mk(/(.*)/)
      },
      {
        type: 'AttributeMatch',
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

test('Ruleset meta', function(t){
  var testMeta = function(meta_body, expected){
    var src = 'ruleset rs{meta{' + meta_body + '}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast.meta, normalizeAST(expected));
  };

  testMeta('', []);
  testMeta('   ', []);//testing for whitespace parsing ambiguity

  testMeta('name "two"', [
    {
      type: 'RulesetMetaProperty',
      key: mk.key('name'),
      value: mk('two')
    }
  ]);

  //testing for whitespace parsing ambiguity
  testMeta('\n  name "two"\n  ', [
    mk.meta('name', mk('two'))
  ]);

  testMeta('name "blah" description <<\n  wat? ok\n  >>\nauthor "bob"', [
    mk.meta('name', mk('blah')),
    mk.meta('description', {
      type: 'Chevron',
      value: [
        {type: 'String', value: '\n  wat? ok\n  '}
      ]
    }),
    mk.meta('author', mk('bob'))
  ]);

  testMeta('keys one "one string"\n keys two {"some": "map"}', [
    mk.meta('keys', [mk.key('one'), mk('one string')]),
    mk.meta('keys', [mk.key('two'), mk({'some': mk('map')})])
  ]);

  testMeta('logging on', [mk.meta('logging', mk(true))]);
  testMeta('logging off', [mk.meta('logging', mk(false))]);

  testMeta([
    'use module com.blah',
    'use module com.blah version "2" alias blah with one = 2 three = 4'
  ].join('\n'), [
    mk.meta('use', {
      kind: 'module',
      name: {type: 'RulesetName', value: 'com.blah'},
      version: null,
      alias:   null,
      'with':  null
    }),
    mk.meta('use', {
      kind: 'module',
      name: {type: 'RulesetName', value: 'com.blah'},
      version: mk('2'),
      alias: mk.id('blah'),
      'with': [
        mk.declare('=', mk.id('one'), mk(2)),
        mk.declare('=', mk.id('three'), mk(4))
      ]
    })
  ]);

  testMeta([
    'errors to com.blah',
    'errors to com.blah version "2"'
  ].join('\n'), [
    mk.meta('errors', {
      name: {type: 'RulesetName', value: 'com.blah'},
      version: null
    }),
    mk.meta('errors', {
      name: {type: 'RulesetName', value: 'com.blah'},
      version: mk('2')
    })
  ]);

  testMeta([
    'provide x, y, z',
    'provides x, y, z',
    'provides keys s3, gmail to com.google, io.picolabs'
  ].join('\n'), [
    mk.meta('provides', {
      ids: [mk.id('x'), mk.id('y'), mk.id('z')]
    }),
    mk.meta('provides', {
      ids: [mk.id('x'), mk.id('y'), mk.id('z')]
    }),
    mk.meta('provides', {
      operator: mk.key('keys'),
      ids: [mk.id('s3'), mk.id('gmail')],
      rulesets: [
        {type: 'RulesetName', value: 'com.google'},
        {type: 'RulesetName', value: 'io.picolabs'}
      ]
    })
  ]);

  testMeta([
    'share x, y, z',
    'shares x, y, z'
  ].join('\n'), [
    mk.meta('shares', {
      ids: [mk.id('x'), mk.id('y'), mk.id('z')]
    }),
    mk.meta('shares', {
      ids: [mk.id('x'), mk.id('y'), mk.id('z')]
    })
  ]);

  t.end();
});

test('Rule prelude', function(t){
  var testPre = function(pre_body, expected){
    var src = 'ruleset rs{rule r1{pre{' + pre_body + '}}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast.rules[0].prelude, normalizeAST(expected));
  };

  testPre('a = 1 b = 2', [
    {
      type: 'Declaration',
      op: '=',
      left: mk.id('a'),
      right: mk(1)
    },
    {
      type: 'Declaration',
      op: '=',
      left: mk.id('b'),
      right: mk(2)
    }
  ]);

  t.end();
});

test('Rule state', function(t){
  var testRuleState = function(rule, expected){
    var src = 'ruleset rs{' + rule + '}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast.rules[0].rule_state, normalizeAST(expected));
  };

  testRuleState('rule r1{}', "active");
  testRuleState('rule r1 is active{}', "active");
  testRuleState('rule r1 is inactive{}', "inactive");
  testRuleState('rule r1   is    inactive   {}', "inactive");

  t.end();
});

test('RulePostlude', function(t){
  var testPost = function(postlude, expected){
    var src = 'ruleset rs{rule r1{' + postlude + '}}';
    var ast = normalizeAST(rmLoc(parser(src)));
    t.deepEquals(ast.rules[0].postlude, normalizeAST(expected));
  };

  //test location
  var src = 'ruleset rs{rule r1{always{one();two()}}}';
  t.deepEquals(parser(src).rules[0].postlude, {
    loc: {start: 19, end: 38},
    type: 'RulePostlude',
    fired: null,
    notfired: null,
    always: [
      {
        loc: {start: 26, end: 31},
        type: 'ExpressionStatement',
        expression: {
          loc: {start: 26, end: 31},
          type: 'Application',
          callee: {
            loc: {start: 26, end: 29},
            type: 'Identifier',
            value: 'one'
          },
          args: []
        }
      },
      {
        loc: {start: 32, end: 37},
        type: 'ExpressionStatement',
        expression: {
          loc: {start: 32, end: 37},
          type: 'Application',
          callee: {
            loc: {start: 32, end: 35},
            type: 'Identifier',
            value: 'two'
          },
          args: []
        }
      }
    ]
  });

  testPost('fired{}', {
    type: 'RulePostlude',
    fired: [],
    notfired: null,
    always: null
  });

  testPost('fired{}else{}', {
    type: 'RulePostlude',
    fired: [],
    notfired: [],
    always: null
  });

  testPost('fired{}else{}finally{}', {
    type: 'RulePostlude',
    fired: [],
    notfired: [],
    always: []
  });

  testPost('fired{}finally{}', {
    type: 'RulePostlude',
    fired: [],
    notfired: null,
    always: []
  });

  t.end();
});

test('ruleset global declarations', function(t){
  var testGlobal = function(global_body, expected){
    var src = [
      'ruleset rs {',
      '  global {',
      '    ' + global_body,
      '  }',
      '}'
    ].join('\n')
    var ast = rmLoc(parser(src));
    t.deepEquals(ast.global, expected);
  };

  testGlobal('', []);

  testGlobal('a = 1', [
    mk.declare('=', mk.id('a'), mk(1))
  ]);

  testGlobal('a = 1 b = 2', [
    mk.declare('=', mk.id('a'), mk(1)),
    mk.declare('=', mk.id('b'), mk(2))
  ]);

  t.end();
});

test('comments preserver locations', function(t){
  var ast = parser('1;//some comment\n2/*annother comment*/;3');
  t.deepEquals(ast, _.map([
    _.assign(mk(1), {loc: {start: 0, end: 1}}),
    _.assign(mk(2), {loc: {start: 17, end: 18}}),
    _.assign(mk(3), {loc: {start: 39, end: 40}})
  ], function(e){
    return {loc: e.loc, type: 'ExpressionStatement', expression: e};
  }));
  t.end();
});

test('parse errors', function(t){
  var src = '';
  src += '//test parse error reporting\n';
  src += 'ruleset rs {\n';
  src += '  rule r0 {\n';
  src += '    select blah\n';
  src += '  }\n';
  src += '}';
  try{
    parser(src, {filename: 'select-blah.krl'});
    t.fail();
  }catch(e){
    var emsg = '';
    emsg += 'No possible parsings\n';
    emsg += 'select-blah.krl:4:12\n';
    emsg += ' \n';//the space is a hack b/c errors usually collapse blank lines
    emsg += '    select blah\n';
    emsg += '           ^';
    t.equals(e.message, emsg);
  }
  src = '';
  src += 'ruleset rs {\n';
  src += '  rule r0 {\n';
  src += '    select when a b setting(c)\n';
  src += '  }\n';
  src += '}';
  try{
    parser(src, {filename: 'ruleset-ambiguity.krl'});
    t.fail();
  }catch(e){
    var emsg = '';
    emsg += 'Parsing Ambiguity: 2 parsings found';
    t.equals(e.message, emsg);
  }
  t.end();
});

test('no ambiguity!', function(t){
  //run $ node tests/ambiguityFinder.js to help you find them
  var testAmb = function(src, should_be_no_parsing){
    try{
      parser(src);
      if(should_be_no_parsing){
        t.fail('should_be_no_parsing');
        return;
      }
      t.ok(true);
    }catch(e){
      if(should_be_no_parsing && /No possible parsings/i.test(e + '')){
        //this is ok b/c it is not ambiguous
        t.ok(true);
      }else{
        throw e
      }
    }
  };

  testAmb('one_eq_two');
  testAmb('somelikethis');

  //map_always{} -or- map_ always { getPath();
  testAmb('ruleset a{rule b{select when a b;c() with d = map_always{getPath()}}}');

  testAmb('ruleset a{rule b{select when Domain TypeAttrib re#(.*)#}}', true);

  //a >< "blah" -or- a > "<blah"
  testAmb('a><<<blah>>');
  testAmb('<<blah>>><a', true);//"blah"><a, >< needs whitespace around it
  testAmb('<<blah>><a');//"blah"<a

  //in this case where should be an attribute
  testAmb('ruleset a{rule b{select when a b where re#(.*)#}}');

  //whitespace ambiguity in expresion lists
  testAmb('[  ]');
  testAmb('hello(    )');
  testAmb('ruleset a{rule b{select when a b;noop(     )}}');

  //whitespace ambiguity in function params
  testAmb('function(   ){}');
  testAmb('ruleset a{rule b{select when c d setting(  e  );}}');
  testAmb('ruleset a{rule b{select when repeat 5 (c d) max(  e  );}}');
  testAmb('ruleset a{rule b{select when repeat 5 (c d) push(  e  );}}');

  //whitespace ambiguity in statement list
  testAmb('function(){   }');
  testAmb('  one  (  ) ;  two  (  )  ');

  //whitespace ambiguity in Map
  testAmb('{   }');
  testAmb('{ "one"  :   2  , "  three  "   : 4  }');

  //ambiguity on the provides operator
  testAmb('ruleset rs{meta { provides notanop errors to i}}');

  t.end();
});
