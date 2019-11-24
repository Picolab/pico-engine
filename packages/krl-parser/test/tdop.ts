import test from "ava";
import { parseExpression, parseRuleset } from "../src/tdop";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const mk = require("./helpers/astMaker");

function rmLoc(node: any): any {
  if (Array.isArray(node)) {
    return node.map(rmLoc);
  }
  if (Object.prototype.toString.call(node) === "[object Object]") {
    const cleanNode: any = {};
    for (const key of Object.keys(node)) {
      if (key !== "loc") cleanNode[key] = rmLoc(node[key]);
    }
    return cleanNode;
  }
  return node;
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

function parseRuleBody(src: string, map?: (node: any) => any) {
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

  // testLiteral('', {
  //   type: 'Chevron',
  //   value: [
  //     { type: 'String', value: 'one' },
  //     { type: 'Map',
  //       value: [
  //         {
  //           type: 'MapKeyValuePair',
  //           key: { type: 'String', value: 'one' },
  //           value: { type: 'Number', value: 2 }
  //         }
  //       ] },
  //     { type: 'String', value: 'three' }
  //   ]
  // })

  // testLiteral('<< This #{ x{"flip"} } that >>', {
  //   type: 'Chevron',
  //   value: [
  //     { type: 'String', value: ' This ' },
  //     {
  //       type: 'MemberExpression',
  //       object: mk.id('x'),
  //       property: mk('flip'),
  //       method: 'path'
  //     },
  //     { type: 'String', value: ' that ' }
  //   ]
  // })

  // testLiteral('<< double <<with>\\>in >>', {
  //   type: 'Chevron',
  //   value: [
  //     { type: 'String', value: ' double <<with>>in ' }
  //   ]
  // })

  // testLiteral('<<one#{<<two#{three}>>}>>', {
  //   type: 'Chevron',
  //   value: [
  //     { type: 'String', value: 'one' },
  //     { type: 'Chevron',
  //       value: [
  //         { type: 'String', value: 'two' },
  //         { type: 'Identifier', value: 'three' }
  //       ] }
  //   ]
  // })

  // testLiteral('<<one#{{"two":function(){<<#{three{four}}five>>}}}>>', {
  //   type: 'Chevron',
  //   value: [
  //     { type: 'String', value: 'one' },
  //     mk({ two: {
  //       type: 'Function',
  //       params: mk.params([]),
  //       body: [
  //         {
  //           type: 'ExpressionStatement',
  //           expression: {
  //             type: 'Chevron',
  //             value: [
  //               mk.get(mk.id('three'), mk.id('four'), 'path'),
  //               { type: 'String', value: 'five' }
  //             ]
  //           }
  //         }
  //       ]
  //     } })
  //   ]
  // })
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

test("Rule", t => {
  function ruleState(src: string) {
    return parseRulesetBody(src, n => n.rules[0].rule_state);
  }
  t.is(ruleState("rule r1{}"), "active");
  t.is(ruleState("rule r1 is active{}"), "active");
  t.is(ruleState("rule r1 is inactive{}"), "inactive");
  t.is(ruleState("rule r1   is    inactive   {}"), "inactive");

  t.deepEqual(parseRuleBody("select when d t").select, {
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
  });
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

  // t.deepEqual(parseSelect("a a before b b within 5 minutes"), {
  //   type: "RuleSelect",
  //   kind: "when",
  //   event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
  //   within: {
  //     type: "EventWithin",
  //     expression: mk(5),
  //     time_period: "minutes"
  //   }
  // });

  // t.deepEqual(parseSelect("a a before b b within 1 + 3 minutes"), {
  //   type: "RuleSelect",
  //   kind: "when",
  //   event: mk.eventOp("before", [mk.ee("a", "a"), mk.ee("b", "b")]),
  //   within: {
  //     type: "EventWithin",
  //     expression: mk.op("+", mk(1), mk(3)),
  //     time_period: "minutes"
  //   }
  // });

  // t.deepEqual(parseSelect("a a or (b b and c c) within 1 hour"), {
  //   type: "RuleSelect",
  //   kind: "when",
  //   event: mk.eventOp("or", [
  //     mk.ee("a", "a"),
  //     mk.eventOp("and", [mk.ee("b", "b"), mk.ee("c", "c")])
  //   ]),
  //   within: {
  //     type: "EventWithin",
  //     expression: mk(1),
  //     time_period: "hour"
  //   }
  // });
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
    "ParseError: Expected an expression|RAW|{|62"
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
