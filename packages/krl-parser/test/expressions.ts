import test from "ava";
import { parse, parseExpression, parseRuleset } from "../src/krl";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");

function parseIt(src: string) {
  return rmLoc(parse(tokenizer(src)));
}

function parseE(src: string) {
  return rmLoc(parseExpression(tokenizer(src)));
}

function parseRulesetBody(src: string, map?: (node: ast.Ruleset) => any) {
  try {
    const node = parseRuleset(tokenizer(`ruleset a{${src}}`));
    return rmLoc(map ? map(node) : node);
  } catch (err) {
    return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
  }
}

test("parser - basic expression", t => {
  t.deepEqual(parseExpression(tokenizer("123")), {
    loc: { start: 0, end: 3 },
    type: "Number",
    value: 123
  });

  t.deepEqual(parseExpression(tokenizer('"abcd"')), {
    loc: { start: 0, end: 6 },
    type: "String",
    value: "abcd"
  });

  t.deepEqual(parseExpression(tokenizer('"abcd"')), {
    loc: { start: 0, end: 6 },
    type: "String",
    value: "abcd"
  });

  t.deepEqual(parseExpression(tokenizer("re#one#")), {
    loc: { start: 0, end: 7 },
    type: "RegExp",
    value: /one/
  });

  t.deepEqual(parseExpression(tokenizer("re#one#ig")), {
    loc: { start: 0, end: 9 },
    type: "RegExp",
    value: /one/gi
  });

  t.deepEqual(parseE("re#one#i"), {
    type: "RegExp",
    value: /one/i
  });

  t.deepEqual(parseE("re#^one(/two)? .* $#ig"), {
    type: "RegExp",
    value: /^one(\/two)? .* $/gi
  });

  t.deepEqual(parseE("re#\\# else\\\\#ig"), {
    type: "RegExp",
    value: /# else\\/gi
  });

  t.deepEqual(parseE("re#/ok/g#ig"), {
    type: "RegExp",
    value: /\/ok\/g/gi
  });

  t.deepEqual(parseE("re##"), {
    type: "RegExp",
    value: new RegExp("", "")
  });

  t.deepEqual(parseE("<<>>"), {
    type: "Chevron",
    value: []
  });

  t.deepEqual(parseE("<<\n  hello\n  >>"), {
    type: "Chevron",
    value: [{ type: "String", value: "\n  hello\n  " }]
  });
  t.deepEqual(parseE("<<#{1}>>"), {
    type: "Chevron",
    value: [{ type: "Number", value: 1 }]
  });
  t.deepEqual(parseE("<<one#{2}three>>"), {
    type: "Chevron",
    value: [
      { type: "String", value: "one" },
      { type: "Number", value: 2 },
      { type: "String", value: "three" }
    ]
  });
});

test("literals", function(t) {
  var testLiteral = function(src: string, expected: any) {
    const node = rmLoc(parseExpression(tokenizer(src)));
    t.deepEqual(node, expected);
  };

  testLiteral('"one"', { type: "String", value: "one" });
  testLiteral('"one\ntwo"', { type: "String", value: "one\ntwo" });
  testLiteral('"one\\"two"', { type: "String", value: 'one"two' });

  testLiteral("123", { type: "Number", value: 123 });
  testLiteral("-1", mk.unary("-", { type: "Number", value: 1 }));
  testLiteral("1.5", { type: "Number", value: 1.5 });
  testLiteral("+1.5", mk.unary("+", { type: "Number", value: 1.5 }));
  testLiteral("-.50", mk.unary("-", { type: "Number", value: 0.5 }));
  testLiteral("-0.0", mk.unary("-", { type: "Number", value: 0 }));

  testLiteral("true", { type: "Boolean", value: true });
  testLiteral("false", { type: "Boolean", value: false });
  testLiteral("null", { type: "Null" });

  testLiteral("foo", mk.id("foo"));
  testLiteral("ent:foo", mk.dID("ent", "foo"));

  testLiteral("[]", { type: "Array", value: [] });
  testLiteral('["one"]', {
    type: "Array",
    value: [{ type: "String", value: "one" }]
  });
  testLiteral("[  1,  false ]", {
    type: "Array",
    value: [
      { type: "Number", value: 1 },
      { type: "Boolean", value: false }
    ]
  });

  // allow dangling comma
  testLiteral("[ 1, ]", {
    type: "Array",
    value: [{ type: "Number", value: 1 }]
  });
  testLiteral('{ "one" : "two", }', {
    type: "Map",
    value: [
      {
        type: "MapKeyValuePair",
        key: { type: "String", value: "one" },
        value: { type: "String", value: "two" }
      }
    ]
  });

  testLiteral("{}", { type: "Map", value: [] });
  testLiteral('{ "one" : "two" }', {
    type: "Map",
    value: [
      {
        type: "MapKeyValuePair",
        key: { type: "String", value: "one" },
        value: { type: "String", value: "two" }
      }
    ]
  });
  testLiteral('{"1":2,"3":true,"5":[]}', {
    type: "Map",
    value: [
      {
        type: "MapKeyValuePair",
        key: { type: "String", value: "1" },
        value: { type: "Number", value: 2 }
      },
      {
        type: "MapKeyValuePair",
        key: { type: "String", value: "3" },
        value: { type: "Boolean", value: true }
      },
      {
        type: "MapKeyValuePair",
        key: { type: "String", value: "5" },
        value: { type: "Array", value: [] }
      }
    ]
  });

  testLiteral("re#one#", { type: "RegExp", value: /one/ });
  testLiteral("re#one#i", { type: "RegExp", value: /one/i });
  testLiteral("re#one#ig", { type: "RegExp", value: /one/gi });
  testLiteral("re#^one(/two)? .* $#ig", {
    type: "RegExp",
    value: /^one(\/two)? .* $/gi
  });
  testLiteral("re#\\# else\\\\#ig", { type: "RegExp", value: /# else\\/gi });
  testLiteral("re#/ok/g#ig", { type: "RegExp", value: /\/ok\/g/gi });
  testLiteral("re##", { type: "RegExp", value: new RegExp("", "") });

  testLiteral("<<>>", {
    type: "Chevron",
    value: []
  });
  testLiteral("<<\n  hello\n  >>", {
    type: "Chevron",
    value: [{ type: "String", value: "\n  hello\n  " }]
  });
  testLiteral("<<#{1}>>", {
    type: "Chevron",
    value: [{ type: "Number", value: 1 }]
  });

  testLiteral("<<one#{2}three>>", {
    type: "Chevron",
    value: [
      { type: "String", value: "one" },
      { type: "Number", value: 2 },
      { type: "String", value: "three" }
    ]
  });

  testLiteral('<<one#{{"one":2}}three>>', {
    type: "Chevron",
    value: [
      { type: "String", value: "one" },
      {
        type: "Map",
        value: [
          {
            type: "MapKeyValuePair",
            key: { type: "String", value: "one" },
            value: { type: "Number", value: 2 }
          }
        ]
      },
      { type: "String", value: "three" }
    ]
  });

  testLiteral('<< This #{ x{"flip"} } that >>', {
    type: "Chevron",
    value: [
      { type: "String", value: " This " },
      {
        type: "MemberExpression",
        object: mk.id("x"),
        property: mk("flip"),
        method: "path"
      },
      { type: "String", value: " that " }
    ]
  });

  testLiteral("<< double <<with>\\>in >>", {
    type: "Chevron",
    value: [{ type: "String", value: " double <<with>>in " }]
  });

  testLiteral("<<one#{<<two#{three}>>}>>", {
    type: "Chevron",
    value: [
      { type: "String", value: "one" },
      {
        type: "Chevron",
        value: [
          { type: "String", value: "two" },
          { type: "Identifier", value: "three" }
        ]
      }
    ]
  });

  testLiteral('<<one#{{"two":function(){<<#{three{four}}five>>}}}>>', {
    type: "Chevron",
    value: [
      { type: "String", value: "one" },
      mk({
        two: {
          type: "Function",
          params: mk.params([]),
          body: [],
          return: {
            type: "Chevron",
            value: [
              mk.get(mk.id("three"), mk.id("four"), "path"),
              { type: "String", value: "five" }
            ]
          }
        }
      })
    ]
  });
});

test("expressions", function(t) {
  function testExp(src: string, expected: any) {
    const node = rmLoc(parseExpression(tokenizer(src)));
    t.deepEqual(node, expected);
  }

  testExp("one()", {
    type: "Application",
    callee: { type: "Identifier", value: "one" },
    args: { type: "Arguments", args: [] }
  });
  testExp("one ( 1 , 2 )", mk.app(mk.id("one"), [mk(1), mk(2)]));
  testExp("one (1,2)", mk.app(mk.id("one"), [mk(1), mk(2)]));
  testExp(
    "one(1, 2, a = 3, b = 4)",
    mk.app(mk.id("one"), [mk(1), mk(2), mk.arg("a", mk(3)), mk.arg("b", mk(4))])
  );

  testExp('1 + "two"', {
    type: "InfixOperator",
    op: "+",
    left: { type: "Number", value: 1 },
    right: { type: "String", value: "two" }
  });

  testExp("1 like re#one#i", {
    type: "InfixOperator",
    op: "like",
    left: { type: "Number", value: 1 },
    right: { type: "RegExp", value: /one/i }
  });

  testExp("a => b | c", {
    type: "ConditionalExpression",
    test: { type: "Identifier", value: "a" },
    consequent: { type: "Identifier", value: "b" },
    alternate: { type: "Identifier", value: "c" }
  });

  testExp("a => b | c => d | e", {
    type: "ConditionalExpression",
    test: { type: "Identifier", value: "a" },
    consequent: { type: "Identifier", value: "b" },
    alternate: {
      type: "ConditionalExpression",
      test: { type: "Identifier", value: "c" },
      consequent: { type: "Identifier", value: "d" },
      alternate: { type: "Identifier", value: "e" }
    }
  });

  testExp("a=>b|c=>d|e", {
    type: "ConditionalExpression",
    test: { type: "Identifier", value: "a" },
    consequent: { type: "Identifier", value: "b" },
    alternate: {
      type: "ConditionalExpression",
      test: { type: "Identifier", value: "c" },
      consequent: { type: "Identifier", value: "d" },
      alternate: { type: "Identifier", value: "e" }
    }
  });

  let err = t.throws(() => testExp("function (){}", {}));
  t.is(err + "", "ParseError: Expected the function return expression");

  testExp("function(a){b}", {
    type: "Function",
    params: mk.params(["a"]),
    body: [],
    return: mk.id("b")
  });

  testExp("function(){ent:foo}", {
    type: "Function",
    params: mk.params([]),
    body: [],
    return: mk.dID("ent", "foo")
  });

  // Declarations are not expressions
  err = t.throws(() => testExp('a = "one"', {}));
  t.is(err + "", "ParseError: Expected `(end)` but was =");

  testExp("a[1]", {
    type: "MemberExpression",
    object: mk.id("a"),
    property: mk(1),
    method: "index"
  });

  testExp("matrix[i][j]", {
    type: "MemberExpression",
    object: {
      type: "MemberExpression",
      object: mk.id("matrix"),
      property: mk.id("i"),
      method: "index"
    },
    property: mk.id("j"),
    method: "index"
  });

  testExp('foo{"bar"}', {
    type: "MemberExpression",
    object: mk.id("foo"),
    property: mk("bar"),
    method: "path"
  });

  testExp(
    'foo{"bar"}()',
    mk.app({
      type: "MemberExpression",
      object: mk.id("foo"),
      property: mk("bar"),
      method: "path"
    })
  );

  testExp("one.two", {
    type: "MemberExpression",
    object: mk.id("one"),
    property: mk.id("two"),
    method: "dot"
  });

  testExp(
    "one.two()",
    mk.app({
      type: "MemberExpression",
      object: mk.id("one"),
      property: mk.id("two"),
      method: "dot"
    })
  );

  testExp("one().two", {
    type: "MemberExpression",
    object: mk.app(mk.id("one")),
    property: mk.id("two"),
    method: "dot"
  });

  testExp(
    "one().two()",
    mk.app({
      type: "MemberExpression",
      object: mk.app(mk.id("one")),
      property: mk.id("two"),
      method: "dot"
    })
  );

  testExp(
    "1.isnull()",
    mk.app({
      type: "MemberExpression",
      object: mk(1),
      property: mk.id("isnull"),
      method: "dot"
    })
  );

  testExp("not a", mk.unary("not", mk.id("a")));
  testExp("nota", mk.id("nota"));
  testExp(
    "not not a || b",
    mk.op("||", mk.unary("not", mk.unary("not", mk.id("a"))), mk.id("b"))
  );
  testExp(
    "not (not a || b)",
    mk.unary("not", mk.op("||", mk.unary("not", mk.id("a")), mk.id("b")))
  );

  err = t.throws(() => testExp("function(a){b = 1;a = 1;}", {}));
  t.is(err + "", "ParseError: Expected the function return expression");

  testExp("function(a){b = 1;a(b);}", {
    type: "Function",
    params: mk.params(["a"]),
    body: [mk.declare("=", mk.id("b"), mk(1))],
    return: mk.app(mk.id("a"), [mk.id("b")])
  });

  t.deepEqual(rmLoc(parse(tokenizer("foo(1).bar(baz(2))"))), [
    mk.app(mk.get(mk.app(mk.id("foo"), [mk(1)]), mk.id("bar"), "dot"), [
      mk.app(mk.id("baz"), [mk(2)])
    ])
  ]);

  t.deepEqual(rmLoc(parse(tokenizer(`"str".trim()`))), [
    mk.app(mk.get(mk("str"), mk.id("trim"), "dot"), [])
  ]);
});

test("operator precedence", function(t) {
  function testPrec(src: string, expected: string) {
    const node = parseExpression(tokenizer(src));
    t.is(lispify(node), expected);

    function lispify(ast: any): string {
      if (Array.isArray(ast)) {
        return ast.map(lispify).join(" ");
      } else if (ast.type === "InfixOperator") {
        return (
          "(" +
          ast.op +
          " " +
          lispify(ast.left) +
          " " +
          lispify(ast.right) +
          ")"
        );
      }
      return ast.value + "";
    }
  }

  testPrec("a + b", "(+ a b)");
  testPrec("a+b+c", "(+ (+ a b) c)");
  testPrec("a+b*c", "(+ a (* b c))");

  testPrec("a || b && c", "(|| a (&& b c))");
  testPrec("(a || b) && c", "(&& (|| a b) c)");

  testPrec("a && b cmp c", "(&& a (cmp b c))");

  testPrec("a * b < c && d", "(&& (< (* a b) c) d)");
});

test("function return", function(t) {
  t.throws(() => parseIt("function(a){b = c [i]}"));

  t.deepEqual(parseIt("function(a){b = c return [i]}"), [
    {
      type: "Function",
      params: mk.params(["a"]),
      body: [mk.declare("=", mk.id("b"), mk.id("c"))],
      return: { type: "Array", value: [mk.id("i")] }
    }
  ]);
});

test("DefAction", t => {
  function tstDA(src: string, expected: any) {
    const node = parseRulesetBody(
      "global{" + src + "}rule r1{pre{" + src + "}}"
    );
    if (typeof node === "string") {
      t.is(node, expected);
      return;
    }
    t.deepEqual(node.global, expected);
    t.deepEqual(node.rules[0].prelude, expected);
  }

  tstDA('a = defaction(){send_directive("foo")}', [
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params([]),
      body: [],
      action_block: {
        type: "ActionBlock",
        condition: null,
        block_type: "every",
        discriminant: null,
        actions: [mk.action(null, "send_directive", [mk("foo")])]
      },
      returns: []
    })
  ]);

  tstDA(
    'a = defaction(b, c){d = 2 e = 3 every { notify("foo", f = 4, g=5) noop()}}',
    [
      mk.declare("=", mk.id("a"), {
        type: "DefAction",
        params: mk.params(["b", "c"]),
        body: [
          mk.declare("=", mk.id("d"), mk(2)),
          mk.declare("=", mk.id("e"), mk(3))
        ],
        action_block: {
          type: "ActionBlock",
          condition: null,
          block_type: "every",
          discriminant: null,
          actions: [
            mk.action(null, "notify", [
              mk("foo"),
              mk.arg("f", mk(4)),
              mk.arg("g", mk(5))
            ]),
            mk.action(null, "noop")
          ]
        },
        returns: []
      })
    ]
  );

  tstDA("a = defaction(){d = 2; noop()}", [
    // semi-colon after single declaration
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params([]),
      body: [mk.declare("=", mk.id("d"), mk(2))],
      action_block: {
        type: "ActionBlock",
        condition: null,
        block_type: "every",
        discriminant: null,
        actions: [mk.action(null, "noop", [])]
      },
      returns: []
    })
  ]);

  tstDA("a = defaction(b, c){if b || c then blah();}", [
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params(["b", "c"]),
      body: [],
      action_block: {
        type: "ActionBlock",
        condition: mk.op("||", mk.id("b"), mk.id("c")),
        block_type: "every",
        discriminant: null,
        actions: [mk.action(null, "blah")]
      },
      returns: []
    })
  ]);

  tstDA("a = defaction(){if b && c then every{foo() bar()}}", [
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params([]),
      body: [],
      action_block: {
        type: "ActionBlock",
        condition: mk.op("&&", mk.id("b"), mk.id("c")),
        block_type: "every",
        discriminant: null,
        actions: [mk.action(null, "foo"), mk.action(null, "bar")]
      },
      returns: []
    })
  ]);

  tstDA("a = defaction(){choose b(c) {one => foo() two => bar()}}", [
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params([]),
      body: [],
      action_block: {
        type: "ActionBlock",
        condition: null,
        block_type: "choose",
        discriminant: mk.app(mk.id("b"), [mk.id("c")]),
        actions: [mk.action("one", "foo"), mk.action("two", "bar")]
      },
      returns: []
    })
  ]);

  tstDA("a = defaction(b){c = b + 1 noop() return c}", [
    mk.declare("=", mk.id("a"), {
      type: "DefAction",
      params: mk.params(["b"]),
      body: [mk.declare("=", mk.id("c"), mk.op("+", mk.id("b"), mk(1)))],
      action_block: {
        type: "ActionBlock",
        condition: null,
        block_type: "every",
        discriminant: null,
        actions: [mk.action(null, "noop")]
      },
      returns: [mk.id("c")]
    })
  ]);

  var tstReturn = function(src: string, expected: any) {
    tstDA("a = defaction(){noop()" + src + "}", [
      mk.declare("=", mk.id("a"), {
        type: "DefAction",
        params: mk.params([]),
        body: [],
        action_block: {
          type: "ActionBlock",
          condition: null,
          block_type: "every",
          discriminant: null,
          actions: [mk.action(null, "noop")]
        },
        returns: expected
      })
    ]);
  };

  tstReturn("return a", [mk.id("a")]);
  tstReturn("returns foo, 1 + bar, baz()", [
    mk.id("foo"),
    mk.op("+", mk(1), mk.id("bar")),
    mk.app(mk.id("baz"))
  ]);

  tstReturn("return semi;", [mk.id("semi")]);

  tstReturn("return ", []);
  tstReturn("returns ", []);

  tstReturn("returns a, b,", [mk.id("a"), mk.id("b")]);
});

test("Parameters", t => {
  function tstParams(paramsSrc: string, expected: any) {
    var src = "global{";
    src += " a = defaction(" + paramsSrc + "){noop()}; ";
    src += " b = function(" + paramsSrc + "){null}; ";
    src += "}";

    const node = parseRulesetBody(src);
    if (typeof node === "string") {
      t.is(node, expected);
    }

    var expAst = mk.params(expected);

    t.deepEqual(node.global[0].right.params, expAst);
    t.deepEqual(node.global[1].right.params, expAst);
  }

  tstParams(" asdf ", [mk.param("asdf")]);

  tstParams("a, b, c", [mk.param("a"), mk.param("b"), mk.param("c")]);

  tstParams("\n    foo,\n    bar,\n    ", [mk.param("foo"), mk.param("bar")]);

  tstParams("a, b = 2", [mk.param("a"), mk.param("b", mk(2))]);

  tstParams('a, b = "wat", c = b + " da"', [
    mk.param("a"),
    mk.param("b", mk("wat")),
    mk.param("c", mk.op("+", mk.id("b"), mk(" da")))
  ]);
});
