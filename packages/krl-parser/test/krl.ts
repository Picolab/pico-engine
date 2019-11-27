import test from "ava";
import { parseExpression, parseRuleset, parse } from "../src/krl";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const normalizeAST = require("./helpers/normalizeAST");
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");

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

function parseRuleBody(src: string, map?: (node: ast.Rule) => any) {
  return parseRulesetBody(`rule a{${src}}`, n =>
    map ? map(n.rules[0]) : n.rules[0]
  );
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

test("ruleset", t => {
  t.deepEqual(parseRuleset(tokenizer("ruleset rs {\n}")), {
    type: "Ruleset",
    loc: { start: 0, end: 14 },
    rid: { type: "RulesetID", value: "rs", loc: { start: 8, end: 10 } },
    meta: null,
    global: [],
    rules: []
  });

  let src = "";
  src += "ruleset rs {\n";
  src += "  rule r1 {}\n";
  src += "  rule r2 {}\n";
  src += "}";
  t.deepEqual(parseRuleset(tokenizer(src)), {
    loc: { start: 0, end: 40 },
    type: "Ruleset",
    rid: { type: "RulesetID", value: "rs", loc: { start: 8, end: 10 } },
    meta: null,
    global: [],
    rules: [
      {
        loc: { start: 15, end: 25 },
        type: "Rule",
        name: { type: "Identifier", value: "r1", loc: { start: 20, end: 22 } },
        rule_state: "active",
        select: null,
        foreach: [],
        prelude: [],
        action_block: null,
        postlude: null
      },
      {
        loc: { start: 28, end: 38 },
        type: "Rule",
        name: { type: "Identifier", value: "r2", loc: { start: 33, end: 35 } },
        rule_state: "active",
        select: null,
        foreach: [],
        prelude: [],
        action_block: null,
        postlude: null
      }
    ]
  });
});

test("rulesetID", t => {
  function parseRID(src: string) {
    try {
      const node = parseRuleset(tokenizer(`ruleset ${src} {}`)).rid;
      if (
        Object.keys(node)
          .sort()
          .join(",") === "loc,type,value" &&
        node.type === "RulesetID" &&
        node.value === src &&
        node.loc.start === 8 &&
        node.loc.end === 8 + src.length
      ) {
        return true;
      }
      return node;
    } catch (err) {
      return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
    }
  }

  t.deepEqual(parseRID("rs"), true);
  t.deepEqual(parseRID("one.two.three"), true);

  t.deepEqual(
    parseRID("one.two."),
    "ParseError: RulesetID cannot end with a `.`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |16"
  );

  t.deepEqual(parseRID("1"), "ParseError: Expected RulesetID|NUMBER|1|8");

  t.deepEqual(parseRID("io.picolabs.some-thing"), true);
  t.deepEqual(parseRID("A.B-b9.c"), true);
  t.deepEqual(parseRID("function.not.ent.app.keys"), true);

  t.deepEqual(parseRID("1.2.3"), "ParseError: Expected RulesetID|NUMBER|1.2|8");
  t.deepEqual(parseRID(".wat"), "ParseError: Expected RulesetID|RAW|.|8");
  t.deepEqual(
    parseRID("io. picolabs"),
    "ParseError: RulesetID cannot end with a `.`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |11",
    "no spaces"
  );
  t.deepEqual(
    parseRID("some -thing"),
    "ParseError: Expected `{`|RAW|-|13",
    "no spaces"
  );
  t.deepEqual(
    parseRID("some- thing"),
    "ParseError: RulesetID cannot end with a `-`\nValid ruleset IDs are reverse domain name. i.e. `io.picolabs.some.cool.name`|WHITESPACE| |13",
    "no spaces"
  );
  t.deepEqual(parseRID("some-thing"), true);
});

test("Ruleset meta", t => {
  function parseMeta(src: string) {
    try {
      const node = parseRuleset(tokenizer(`ruleset rs{meta{${src}}}`)).meta;
      if (
        node &&
        Object.keys(node)
          .sort()
          .join(",") === "loc,properties,type" &&
        node.type === "RulesetMeta"
      ) {
        return node.properties.map(rmLoc);
      }
      return node;
    } catch (err) {
      return `${err}|${err.token.type}|${err.token.src}|${err.token.loc.start}`;
    }
  }

  t.deepEqual(parseMeta(""), []);
  t.deepEqual(parseMeta("   "), []); // testing for whitespace parsing ambiguity
  t.deepEqual(parseMeta(" /* wat */\n   // another\n  "), []); // testing for whitespace parsing ambiguity

  t.deepEqual(parseRuleset(tokenizer(`ruleset rs{meta{name "two"}}`)).meta, {
    loc: { start: 11, end: 27 },
    type: "RulesetMeta",
    properties: [
      {
        loc: { start: 16, end: 20 },
        type: "RulesetMetaProperty",
        key: { loc: { start: 16, end: 20 }, type: "Keyword", value: "name" },
        value: { loc: { start: 21, end: 26 }, type: "String", value: "two" }
      }
    ]
  });

  t.deepEqual(parseMeta('\n  name "two"\n  '), [mk.meta("name", mk("two"))]);

  t.deepEqual(
    parseMeta('name "blah" description <<\n  wat? ok\n  >>\nauthor "bob"'),
    [
      mk.meta("name", mk("blah")),
      mk.meta("description", {
        type: "Chevron",
        value: [{ type: "String", value: "\n  wat? ok\n  " }]
      }),
      mk.meta("author", mk("bob"))
    ]
  );

  t.deepEqual(parseMeta("logging on"), [mk.meta("logging", mk(true))]);

  t.deepEqual(parseMeta("logging off"), [mk.meta("logging", mk(false))]);

  t.deepEqual(parseMeta('key one "one string"\n keys two 1234'), [
    mk.meta("keys", [
      { type: "Keyword", value: "one" },
      { type: "String", value: "one string" }
    ]),
    mk.meta("keys", [
      { type: "Keyword", value: "two" },
      { type: "Number", value: 1234 }
    ])
  ]);

  t.deepEqual(
    parseMeta(
      [
        "use module com.blah",
        'use module com.blah version "2" alias blah with one = 2 three = 4'
      ].join("\n")
    ),
    [
      mk.meta("use", {
        kind: "module",
        rid: { type: "RulesetID", value: "com.blah" },
        version: null,
        alias: null,
        with: null
      }),
      mk.meta("use", {
        kind: "module",
        rid: { type: "RulesetID", value: "com.blah" },
        version: mk("2"),
        alias: mk.id("blah"),
        with: [
          mk.declare("=", mk.id("one"), mk(2)),
          mk.declare("=", mk.id("three"), mk(4))
        ]
      })
    ]
  );

  t.deepEqual(
    parseMeta(
      ["errors to com.blah", 'errors to com.blah version "2"'].join("\n")
    ),
    [
      mk.meta("errors", {
        rid: { type: "RulesetID", value: "com.blah" },
        version: null
      }),
      mk.meta("errors", {
        rid: { type: "RulesetID", value: "com.blah" },
        version: mk("2")
      })
    ]
  );

  t.deepEqual(parseMeta("configure using a = 1"), [
    mk.meta("configure", {
      declarations: [mk.declare("=", mk.id("a"), mk(1))]
    })
  ]);
  t.deepEqual(parseMeta("configure using a = 1 b = 2"), [
    mk.meta("configure", {
      declarations: [
        mk.declare("=", mk.id("a"), mk(1)),
        mk.declare("=", mk.id("b"), mk(2))
      ]
    })
  ]);

  t.deepEqual(
    parseMeta(`
      provide x, y, z
      provides x, y, z
      provides keys s3, gmail to com.google, io.picolabs
    `),
    [
      mk.meta("provides", {
        ids: [mk.id("x"), mk.id("y"), mk.id("z")]
      }),
      mk.meta("provides", {
        ids: [mk.id("x"), mk.id("y"), mk.id("z")]
      }),
      mk.meta("provides", {
        operator: mk.key("keys"),
        ids: [mk.id("s3"), mk.id("gmail")],
        rulesets: [
          { type: "RulesetID", value: "com.google" },
          { type: "RulesetID", value: "io.picolabs" }
        ]
      })
    ]
  );

  t.deepEqual(
    parseMeta(`
      share x, y, z
      shares x, y, z
    `),
    [
      mk.meta("shares", {
        ids: [mk.id("x"), mk.id("y"), mk.id("z")]
      }),
      mk.meta("shares", {
        ids: [mk.id("x"), mk.id("y"), mk.id("z")]
      })
    ]
  );

  t.deepEqual(
    parseMeta("foo bar"),
    "ParseError: Unsupported meta key: foo|SYMBOL|foo|16"
  );
});

test("with", function(t) {
  function tst(src: string, expected: any) {
    const node = parseRulesetBody(
      `meta{use module m ${src}}`,
      rs => rs.meta && rs.meta.properties[0].value["with"]
    );
    t.deepEqual(node, expected);
  }

  tst("with", "ParseError: Expected declarations after `with`|RAW|}|32");

  tst('with a = "b"', [mk.declare("=", mk.id("a"), mk("b"))]);
  tst('with a = "b" c = "d"', [
    mk.declare("=", mk.id("a"), mk("b")),
    mk.declare("=", mk.id("c"), mk("d"))
  ]);
  tst('with a = "b" and = "d"', "ParseError: Expected Identifier|RAW|=|45");
  tst('with a = "b" and c = "d"', [
    mk.declare("=", mk.id("a"), mk("b")),
    mk.declare("=", mk.id("c"), mk("d"))
  ]);
  tst('with a = "b" and c = "d" and e = 1', [
    mk.declare("=", mk.id("a"), mk("b")),
    mk.declare("=", mk.id("c"), mk("d")),
    mk.declare("=", mk.id("e"), mk(1))
  ]);

  tst('with a = "b" and c = "d" e = 1', [
    mk.declare("=", mk.id("a"), mk("b")),
    mk.declare("=", mk.id("c"), mk("d")),
    mk.declare("=", mk.id("e"), mk(1))
  ]);
  tst('with a = "b" c = "d" and e = 1', [
    mk.declare("=", mk.id("a"), mk("b")),
    mk.declare("=", mk.id("c"), mk("d")),
    mk.declare("=", mk.id("e"), mk(1))
  ]);

  tst(
    'with a = "b" with c = "d"',
    "ParseError: Unsupported meta key: with|SYMBOL|with|41"
  );

  t.deepEqual(
    parseRulesetBody(
      `meta{use module m with a = "b" and c = "d"
            shares one, two}`,
      rs => rs.meta && rs.meta.properties
    ),
    [
      mk.meta("use", {
        kind: "module",
        rid: { type: "RulesetID", value: "m" },
        version: null,
        alias: null,
        with: [
          mk.declare("=", mk.id("a"), mk("b")),
          mk.declare("=", mk.id("c"), mk("d"))
        ]
      }),
      mk.meta("shares", {
        ids: [mk.id("one"), mk.id("two")]
      })
    ]
  );
});

test("Rule", t => {
  function ruleState(src: string) {
    return parseRulesetBody(src, n => n.rules[0].rule_state);
  }
  t.is(ruleState("rule r1{}"), "active");
  t.is(ruleState("rule r1 is active{}"), "active");
  t.is(ruleState("rule r1 is inactive{}"), "inactive");
  t.is(ruleState("rule r1   is    inactive   {}"), "inactive");

  t.deepEqual(
    parseRuleBody("select when d t", rule => rule.select),
    {
      type: "RuleSelect",
      kind: "when",
      event: {
        type: "EventExpression",
        event_domain: { type: "Identifier", value: "d" },
        event_type: { type: "Identifier", value: "t" },
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
      },
      within: null
    }
  );
});

test("EventExpression", t => {
  function testEE(src: string, expected: any) {
    const node = parseRuleBody(
      "select when " + src + " noop()",
      rule => rule.select && rule.select.event
    );
    t.deepEqual(normalizeAST(node), expected);
  }

  testEE("a b", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [],
    where: null,
    setting: [],
    aggregator: null
  });

  testEE("a b where c", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [],
    where: mk.id("c"),
    setting: [],
    aggregator: null
  });

  testEE("a b where 1 / (c - 2)", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [],
    where: mk.op("/", mk(1), mk.op("-", mk.id("c"), mk(2))),
    setting: [],
    aggregator: null
  });

  testEE("a b amt re#[0-9]{4}#", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [
      {
        type: "AttributeMatch",
        key: mk.id("amt"),
        value: mk(/[0-9]{4}/)
      }
    ],
    where: null,
    setting: [],
    aggregator: null
  });

  testEE("a b amt re#([0-9]+)# setting(amt_n)", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [
      {
        type: "AttributeMatch",
        key: mk.id("amt"),
        value: mk(/([0-9]+)/)
      }
    ],
    where: null,
    setting: [mk.id("amt_n")],
    aggregator: null
  });

  testEE("a b c re#(.*)# d re#(.*)# setting(e,f)", {
    type: "EventExpression",
    event_domain: mk.id("a"),
    event_type: mk.id("b"),
    event_attrs: [
      {
        type: "AttributeMatch",
        key: mk.id("c"),
        value: mk(/(.*)/)
      },
      {
        type: "AttributeMatch",
        key: mk.id("d"),
        value: mk(/(.*)/)
      }
    ],
    where: null,
    setting: [mk.id("e"), mk.id("f")],
    aggregator: null
  });

  testEE(
    "a b a re#.# setting(c) or d e a re#.# setting(f) before g h",
    mk.eventOp("or", [
      mk.ee(
        "a",
        "b",
        [
          {
            type: "AttributeMatch",
            key: mk.id("a"),
            value: mk(/./)
          }
        ],
        ["c"]
      ),
      mk.eventOp("before", [
        mk.ee(
          "d",
          "e",
          [
            {
              type: "AttributeMatch",
              key: mk.id("a"),
              value: mk(/./)
            }
          ],
          ["f"]
        ),
        mk.ee("g", "h")
      ])
    ])
  );

  testEE(
    "a b between(c d, e f)",
    mk.eventOp("between", [mk.ee("a", "b"), mk.ee("c", "d"), mk.ee("e", "f")])
  );

  testEE(
    "a b not\n  between ( c d,e f )",
    mk.eventOp("not between", [
      mk.ee("a", "b"),
      mk.ee("c", "d"),
      mk.ee("e", "f")
    ])
  );

  testEE(
    "any 2 (a b, c d, e f)",
    mk.eventOp("any", [
      mk(2),
      mk.ee("a", "b"),
      mk.ee("c", "d"),
      mk.ee("e", "f")
    ])
  );

  testEE("count 2 (a b)", mk.eventGroupOp("count", mk(2), mk.ee("a", "b")));

  testEE("repeat 2(a b)", mk.eventGroupOp("repeat", mk(2), mk.ee("a", "b")));

  testEE(
    "and(a b, c d, e f)",
    mk.eventOp("and", [mk.ee("a", "b"), mk.ee("c", "d"), mk.ee("e", "f")])
  );

  testEE(
    "a b or and(c d, e f)",
    mk.eventOp("or", [
      mk.ee("a", "b"),
      mk.eventOp("and", [mk.ee("c", "d"), mk.ee("e", "f")])
    ])
  );

  testEE(
    "count 5 (a b) max(d)",
    mk.eventGroupOp(
      "count",
      mk(5),
      mk.ee("a", "b", [], [], null, {
        type: "EventAggregator",
        op: "max",
        args: [mk.id("d")]
      })
    )
  );

  ["min", "max", "sum", "avg", "push"].forEach(op => {
    testEE(
      "repeat 5 (a b) " + op + "(c)",
      mk.eventGroupOp(
        "repeat",
        mk(5),
        mk.ee("a", "b", [], [], null, {
          type: "EventAggregator",
          op: op,
          args: [mk.id("c")]
        })
      )
    );
  });

  testEE(
    "before (a b, c d)",
    mk.eventOp("before", [mk.ee("a", "b"), mk.ee("c", "d")])
  );
  testEE(
    "then (a b, c d)",
    mk.eventOp("then", [mk.ee("a", "b"), mk.ee("c", "d")])
  );
  testEE(
    "after (a b, c d)",
    mk.eventOp("after", [mk.ee("a", "b"), mk.ee("c", "d")])
  );
});

test("select when", t => {
  function asertRuleAST(src: string, expected: any) {
    const node = parseRuleBody(src, rule => rule.select && rule.select.event);
    t.deepEqual(node, expected);
  }

  var src = "select when d t";
  asertRuleAST(src, {
    type: "EventExpression",
    event_domain: { type: "Identifier", value: "d" },
    event_type: { type: "Identifier", value: "t" },
    event_attrs: [],
    where: null,
    setting: [],
    aggregator: null
  });

  src = "select when d a or d b";
  asertRuleAST(
    src,
    mk.eventOp("or", [
      {
        type: "EventExpression",
        event_domain: { type: "Identifier", value: "d" },
        event_type: { type: "Identifier", value: "a" },
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
      },
      {
        type: "EventExpression",
        event_domain: { type: "Identifier", value: "d" },
        event_type: { type: "Identifier", value: "b" },
        event_attrs: [],
        where: null,
        setting: [],
        aggregator: null
      }
    ])
  );

  src = "select when d a and d b";
  asertRuleAST(src, mk.eventOp("and", [mk.ee("d", "a"), mk.ee("d", "b")]));

  src = "select when d a and (d b or d c)";
  asertRuleAST(
    src,
    mk.eventOp("and", [
      mk.ee("d", "a"),
      mk.eventOp("or", [mk.ee("d", "b"), mk.ee("d", "c")])
    ])
  );

  src = "select when d:a and (d b or d:c)";
  asertRuleAST(
    src,
    mk.eventOp("and", [
      mk.ee("d", "a"),
      mk.eventOp("or", [mk.ee("d", "b"), mk.ee("d", "c")])
    ])
  );
});

test("select when ... within", t => {
  function parseSelect(src: string) {
    return parseRulesetBody(
      `rule a{select when ${src}}`,
      n => n.rules[0].select
    );
  }

  t.deepEqual(parseSelect("a a within 5 minutes"), {
    type: "RuleSelect",
    kind: "when",
    event: mk.ee("a", "a"),
    within: {
      type: "EventWithin",
      expression: mk(5),
      time_period: "minutes"
    }
  });

  t.deepEqual(
    parseSelect("a a within 5 foobar"),
    "ParseError: Expected time period: [day,days,hour,hours,minute,minutes,month,months,second,seconds,week,weeks,year,years]|SYMBOL|foobar|42"
  );

  t.deepEqual(parseSelect("a a before b b within 5 minutes"), {
    type: "RuleSelect",
    kind: "when",
    event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
    within: {
      type: "EventWithin",
      expression: mk(5),
      time_period: "minutes"
    }
  });

  t.deepEqual(parseSelect("a a before b b within 1 + 3 minutes"), {
    type: "RuleSelect",
    kind: "when",
    event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
    within: {
      type: "EventWithin",
      expression: mk.op("+", mk(1), mk(3)),
      time_period: "minutes"
    }
  });

  t.deepEqual(parseSelect("a a or (b b and c c) within 1 hour"), {
    type: "RuleSelect",
    kind: "when",
    event: mk.eventOp("or", [
      mk.ee("a", "a"),
      mk.eventOp("and", [mk.ee("b", "b"), mk.ee("c", "c")])
    ]),
    within: {
      type: "EventWithin",
      expression: mk(1),
      time_period: "hour"
    }
  });
});

test("select when ... foreach ...", t => {
  var tst = function(src: string, expected: any) {
    var ast = parseRuleBody(src, r => r.foreach);
    t.deepEqual(ast, expected);
  };

  tst("select when a b foreach [1,2,3] setting(c)", [
    {
      type: "RuleForEach",
      expression: mk([1, 2, 3]),
      setting: [mk.id("c")]
    }
  ]);

  tst("select when a b foreach c setting(d, e)", [
    {
      type: "RuleForEach",
      expression: mk.id("c"),
      setting: [mk.id("d"), mk.id("e")]
    }
  ]);

  var src = "";
  src += "select when a b\n";
  src += "foreach [1,2,3] setting(x)\n";
  src += '  foreach ["a", "b", "c"] setting(y)';
  tst(src, [
    {
      type: "RuleForEach",
      expression: mk([1, 2, 3]),
      setting: [mk.id("x")]
    },
    {
      type: "RuleForEach",
      expression: mk(["a", "b", "c"]),
      setting: [mk.id("y")]
    }
  ]);
});

test("ActionBlock", function(t) {
  var tstActionBlock = function(abSrc: string, expected: any) {
    var src = "rule r1{select when foo bar " + abSrc + "}";

    t.deepEqual(
      parseRulesetBody(src, rs => rs.rules[0].action_block),
      expected
    );
  };

  var src = 'send_directive("say")';
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "every",
    discriminant: null,
    actions: [mk.action(null, "send_directive", [mk("say")])]
  });

  src = 'foo("say", bar = "hello world")';
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "every",
    discriminant: null,
    actions: [
      mk.action(null, "foo", [mk("say"), mk.arg("bar", mk("hello world"))])
    ]
  });

  src = "hello(\n";
  src += "  foo = 1,\n";
  src += "  bar = 2,\n";
  src += "  baz = 3,\n";
  src += ")";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "every",
    discriminant: null,
    actions: [
      mk.action(null, "hello", [
        mk.arg("foo", mk(1)),
        mk.arg("bar", mk(2)),
        mk.arg("baz", mk(3))
      ])
    ]
  });

  src = "if true then blah()";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: mk(true),
    block_type: "every",
    discriminant: null,
    actions: [mk.action(null, "blah")]
  });

  src = "lbl=>blah()";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "every",
    discriminant: null,
    actions: [mk.action("lbl", "blah")]
  });

  src = "every {";
  src += " one=>blah(1)";
  src += " two => blah(2)";
  src += " noop()";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "every",
    discriminant: null,
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)]),
      mk.action(null, "noop")
    ]
  });

  src = "choose exp() {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "choose",
    discriminant: mk.app(mk.id("exp")),
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)])
    ]
  });

  src = "if foo == 2 then every {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: mk.op("==", mk.id("foo"), mk(2)),
    block_type: "every",
    discriminant: null,
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)])
    ]
  });

  src = "if foo == 2 then {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, "ParseError: Expected `}`|RAW|{|55");

  tstActionBlock(
    "if foo == 2 then choose { noop() }",
    "ParseError: Expected String|SYMBOL|noop|64"
    //"ParseError: Expected an expression|RAW|{|62"
  );

  src = "if foo == 2 then\n";
  src += "choose bar() {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: mk.op("==", mk.id("foo"), mk(2)),
    block_type: "choose",
    discriminant: mk.app(mk.id("bar")),
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)])
    ]
  });

  src = "if foo == 2 then sample {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: mk.op("==", mk.id("foo"), mk(2)),
    block_type: "sample",
    discriminant: null,
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)])
    ]
  });

  src = "sample {\n";
  src += "  one => blah(1)\n";
  src += "  two => blah(2)\n";
  src += "}";
  tstActionBlock(src, {
    type: "ActionBlock",
    condition: null,
    block_type: "sample",
    discriminant: null,
    actions: [
      mk.action("one", "blah", [mk(1)]),
      mk.action("two", "blah", [mk(2)])
    ]
  });

  tstActionBlock("choose b(c){one => foo() two => bar()}", {
    type: "ActionBlock",
    condition: null,
    block_type: "choose",
    discriminant: mk.app(mk.id("b"), [mk.id("c")]),
    actions: [mk.action("one", "foo", []), mk.action("two", "bar", [])]
  });
});

test("Action setting", t => {
  var testAction = function(abSrc: string, expected: any) {
    var src = "rule r1{select when foo bar " + abSrc + "}";

    t.deepEqual(
      parseRulesetBody(
        src,
        rs => rs.rules[0].action_block && rs.rules[0].action_block.actions[0]
      ),
      expected
    );
  };

  testAction('http:post("url", qs = {"foo": "bar"})', {
    type: "Action",
    label: null,
    action: mk.dID("http", "post"),
    args: mk.args([mk("url"), mk.arg("qs", mk({ foo: mk("bar") }))]),
    setting: []
  });

  testAction('http:post("url") setting(resp)', {
    type: "Action",
    label: null,
    action: mk.dID("http", "post"),
    args: mk.args([mk("url")]),
    setting: [mk.id("resp")]
  });

  testAction('http:post("url", qs = {"foo": "bar"}) setting(resp)', {
    type: "Action",
    label: null,
    action: mk.dID("http", "post"),
    args: mk.args([mk("url"), mk.arg("qs", mk({ foo: mk("bar") }))]),
    setting: [mk.id("resp")]
  });
});

test("RulePostlude", t => {
  var testPost = function(postlude: string, expected: any) {
    var src = "rule r1{select when foo bar " + postlude + "}";

    t.deepEqual(
      parseRulesetBody(src, rs => rs.rules[0].postlude),
      expected
    );
  };

  // test location
  var src = "ruleset rs{rule r1{always{aaa=one();bbb=two()}}}";
  t.deepEqual(parseRuleset(tokenizer(src)).rules[0].postlude, {
    loc: { start: 19, end: 46 },
    type: "RulePostlude",
    fired: null,
    notfired: null,
    always: [
      {
        loc: { start: 26, end: 35 },
        type: "Declaration",
        op: "=",
        left: {
          loc: { start: 26, end: 29 },
          type: "Identifier",
          value: "aaa"
        },
        right: {
          loc: { start: 30, end: 35 },
          type: "Application",
          callee: {
            loc: { start: 30, end: 33 },
            type: "Identifier",
            value: "one"
          },
          args: {
            loc: { start: 33, end: 35 },
            type: "Arguments",
            args: []
          }
        }
      },
      {
        loc: { start: 36, end: 45 },
        type: "Declaration",
        op: "=",
        left: {
          loc: { start: 36, end: 39 },
          type: "Identifier",
          value: "bbb"
        },
        right: {
          loc: { start: 40, end: 45 },
          type: "Application",
          callee: {
            loc: { start: 40, end: 43 },
            type: "Identifier",
            value: "two"
          },
          args: {
            loc: { start: 43, end: 45 },
            type: "Arguments",
            args: []
          }
        }
      }
    ]
  });

  testPost("fired{}", {
    type: "RulePostlude",
    fired: [],
    notfired: null,
    always: null
  });

  testPost("fired{}else{}", {
    type: "RulePostlude",
    fired: [],
    notfired: [],
    always: null
  });

  testPost("fired{}else{}finally{}", {
    type: "RulePostlude",
    fired: [],
    notfired: [],
    always: []
  });

  testPost("fired{}finally{}", {
    type: "RulePostlude",
    fired: [],
    notfired: null,
    always: []
  });

  testPost("notfired{}", {
    type: "RulePostlude",
    fired: null,
    notfired: [],
    always: null
  });

  testPost("notfired{}else{}", {
    type: "RulePostlude",
    fired: [],
    notfired: [],
    always: null
  });

  testPost("notfired{}else{}finally{}", {
    type: "RulePostlude",
    fired: [],
    notfired: [],
    always: []
  });

  testPost("notfired{}finally{}", {
    type: "RulePostlude",
    fired: null,
    notfired: [],
    always: []
  });
});

function makeTestPostlude(t: any) {
  return function(srcCore: string, expected: any) {
    var src = "rule a{ fired{" + srcCore + "}}";

    t.deepEqual(
      parseRulesetBody(
        src,
        rs => rs.rules[0].postlude && rs.rules[0].postlude.fired
      ),
      expected
    );
  };
}

test("ClearPersistentVariable", t => {
  var testPostlude = makeTestPostlude(t);

  testPostlude("clear ent:foo", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("ent", "foo"),
      path_expression: null
    }
  ]);

  testPostlude("clear app:bar", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: null
    }
  ]);

  testPostlude("clear app:bar{key}", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: mk.id("key")
    }
  ]);

  testPostlude("clear app:bar{[key]}", [
    {
      type: "ClearPersistentVariable",
      variable: mk.dID("app", "bar"),
      path_expression: { type: "Array", value: [mk.id("key")] }
    }
  ]);
});

test("LastStatement", t => {
  var testPostlude = makeTestPostlude(t);

  testPostlude("last", [
    {
      type: "LastStatement"
    }
  ]);

  testPostlude("last if(x==4)", [
    {
      type: "GuardCondition",
      condition: mk.op("==", mk.id("x"), mk(4)),
      statement: {
        type: "LastStatement"
      }
    }
  ]);

  testPostlude("last if x == 4", [
    {
      type: "GuardCondition",
      condition: mk.op("==", mk.id("x"), mk(4)),
      statement: {
        type: "LastStatement"
      }
    }
  ]);
});

test("LogStatement", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('log info "foo"', [
    {
      type: "LogStatement",
      level: "info",
      expression: mk("foo")
    }
  ]);

  testPostlude('log error {"baz": [1, 2]}', [
    {
      type: "LogStatement",
      level: "error",
      expression: mk({ baz: mk([1, 2]) })
    }
  ]);
});

test("ErrorStatement", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('error error "foo"', [
    {
      type: "ErrorStatement",
      level: "error",
      expression: mk("foo")
    }
  ]);

  testPostlude('error warn {"baz": [1, 2]}', [
    {
      type: "ErrorStatement",
      level: "warn",
      expression: mk({ baz: mk([1, 2]) })
    }
  ]);

  testPostlude("error info info", [
    {
      type: "ErrorStatement",
      level: "info",
      expression: mk.id("info")
    }
  ]);

  testPostlude("error debug debug()", [
    {
      type: "ErrorStatement",
      level: "debug",
      expression: mk.app(mk.id("debug"))
    }
  ]);
});

test("raise event", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('raise domain event "type"', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude('raise domain event "type" for "io.picolabs.test"', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: mk("io.picolabs.test"),
      event_attrs: null
    }
  ]);

  testPostlude('raise domain event "type" attributes {"a":1,"b":2}', [
    {
      type: "RaiseEventStatement",
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      for_rid: null,
      event_attrs: mk({ a: mk(1), b: mk(2) })
    }
  ]);

  // dynamic event domain and type

  testPostlude('raise event "foo:bar"', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude('raise event "foo:bar" for "some.rid.ok"', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: mk("some.rid.ok"),
      event_attrs: null
    }
  ]);

  testPostlude('raise event "foo:bar" attributes {"a":1,"b":2}', [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk("foo:bar"),
      for_rid: null,
      event_attrs: mk({ a: mk(1), b: mk(2) })
    }
  ]);

  testPostlude(
    'raise event "foo:bar" for "some.rid.ok" attributes {"a":1,"b":2}',
    [
      {
        type: "RaiseEventStatement",
        event_domainAndType: mk("foo:bar"),
        for_rid: mk("some.rid.ok"),
        event_attrs: mk({ a: mk(1), b: mk(2) })
      }
    ]
  );

  testPostlude("raise event event", [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk.id("event"),
      for_rid: null,
      event_attrs: null
    }
  ]);

  testPostlude("raise event event attributes {}", [
    {
      type: "RaiseEventStatement",
      event_domainAndType: mk.id("event"),
      for_rid: null,
      event_attrs: mk({})
    }
  ]);
});

test("schedule event", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude('schedule domain event "type" at "time"', [
    {
      type: "ScheduleEventStatement",
      at: mk("time"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude(
    'schedule domain event "type" at "time" attributes {"a":1,"b":2}',
    [
      {
        type: "ScheduleEventStatement",
        at: mk("time"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({ a: mk(1), b: mk(2) }),
        setting: null
      }
    ]
  );

  testPostlude('schedule domain event "type" at "time" setting(foo)', [
    {
      type: "ScheduleEventStatement",
      at: mk("time"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: mk.id("foo")
    }
  ]);

  testPostlude(
    'schedule domain event "type" at "time" attributes {} setting(foo)',
    [
      {
        type: "ScheduleEventStatement",
        at: mk("time"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({}),
        setting: mk.id("foo")
      }
    ]
  );

  testPostlude('schedule domain event "type" repeat "5 0 * * *"', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude(
    'schedule domain event "type" repeat "5 0 * * *" attributes {"a":1,"b":2}',
    [
      {
        type: "ScheduleEventStatement",
        timespec: mk("5 0 * * *"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({ a: mk(1), b: mk(2) }),
        setting: null
      }
    ]
  );

  testPostlude('schedule domain event "type" repeat "5 0 * * *" setting(foo)', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domain: mk.id("domain"),
      event_type: mk("type"),
      event_attrs: null,
      setting: mk.id("foo")
    }
  ]);

  testPostlude(
    'schedule domain event "type" repeat "5 0 * * *" attributes {} setting(foo)',
    [
      {
        type: "ScheduleEventStatement",
        timespec: mk("5 0 * * *"),
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        event_attrs: mk({}),
        setting: mk.id("foo")
      }
    ]
  );

  testPostlude('schedule event "foo:bar" at "sometime"', [
    {
      type: "ScheduleEventStatement",
      at: mk("sometime"),
      event_domainAndType: mk("foo:bar"),
      event_attrs: null,
      setting: null
    }
  ]);

  testPostlude('schedule event "foo:bar" repeat "5 0 * * *"', [
    {
      type: "ScheduleEventStatement",
      timespec: mk("5 0 * * *"),
      event_domainAndType: mk("foo:bar"),
      event_attrs: null,
      setting: null
    }
  ]);
});

test("GuardCondition", t => {
  const testPost = makeTestPostlude(t);

  testPost('raise domain event "type" on final', [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: {
        type: "RaiseEventStatement",
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        for_rid: null,
        event_attrs: null
      }
    }
  ]);

  testPost("ent:foo := bar on final", [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: {
        type: "PersistentVariableAssignment",
        op: ":=",
        left: mk.dID("ent", "foo"),
        path_expression: null,
        right: mk.id("bar")
      }
    }
  ]);

  testPost("foo = bar on final", [
    {
      type: "GuardCondition",
      condition: "on final",
      statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
    }
  ]);

  testPost("foo = bar if baz > 0", [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: mk.declare("=", mk.id("foo"), mk.id("bar"))
    }
  ]);

  testPost("ent:foo := bar if baz > 0", [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: {
        type: "PersistentVariableAssignment",
        op: ":=",
        left: mk.dID("ent", "foo"),
        path_expression: null,
        right: mk.id("bar")
      }
    }
  ]);

  testPost('raise domain event "type" if baz > 0', [
    {
      type: "GuardCondition",
      condition: mk.op(">", mk.id("baz"), mk(0)),
      statement: {
        type: "RaiseEventStatement",
        event_domain: mk.id("domain"),
        event_type: mk("type"),
        for_rid: null,
        event_attrs: null
      }
    }
  ]);
});

test("PersistentVariableAssignment", t => {
  const testPostlude = makeTestPostlude(t);

  testPostlude("ent:name := 1", [
    {
      type: "PersistentVariableAssignment",
      op: ":=",
      left: mk.dID("ent", "name"),
      path_expression: null,
      right: mk(1)
    }
  ]);

  testPostlude('ent:user{["firstname"]} := "bob"', [
    {
      type: "PersistentVariableAssignment",
      op: ":=",
      left: mk.dID("ent", "user"),
      path_expression: mk(["firstname"]),
      right: mk("bob")
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

test("potentially ambiguous cases", t => {
  t.deepEqual(
    rmLoc(
      parse(
        tokenizer(`function(){
          one = 1;
          {"two":one}
        }`)
      )
    ),
    [
      {
        type: "Function",
        params: mk.params([]),
        body: [mk.declare("=", mk.id("one"), mk(1))],
        return: mk({ two: mk.id("one") })
      }
    ]
  );

  t.deepEqual(
    rmLoc(
      parse(
        tokenizer(`function(){
          one = 1;
          [index]
        }`)
      )
    ),
    [
      {
        type: "Function",
        params: mk.params([]),
        body: [mk.declare("=", mk.id("one"), mk(1))],
        return: { type: "Array", value: [mk.id("index")] }
      }
    ]
  );

  t.deepEqual(
    parseRuleBody("choose one{noop()}", rule => rule.action_block),
    {
      type: "ActionBlock",
      block_type: "choose",
      condition: null,
      discriminant: mk.id("one"),
      actions: [mk.action(null, "noop", [])]
    }
  );

  t.deepEqual(
    parseRuleBody("choose (one{noop()}) {noop()}", rule => rule.action_block),
    {
      type: "ActionBlock",
      block_type: "choose",
      condition: null,
      discriminant: mk.get(mk.id("one"), mk.app(mk.id("noop")), "path"),
      actions: [mk.action(null, "noop", [])]
    }
  );
});
