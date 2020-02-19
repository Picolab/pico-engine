import test from "ava";
import { parseRuleset } from "../src/krl";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");

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
  tst('with a = "b" and = "d"', "ParseError: Expected a declaration|RAW|=|45");
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

test("select when", t => {
  function asertRuleAST(src: string, expected: any) {
    const node = parseRuleBody(src, rule => rule.select && rule.select.event);
    t.deepEqual(node, expected);
  }

  t.is(parseRuleBody(`select`), "ParseError: Expected `when`|RAW|}|23");

  t.is(
    parseRuleBody(`select when`),
    "ParseError: Expected an event expression|RAW|}|28"
  );

  t.is(parseRuleBody(`select when foo`), "ParseError: Expected `:`|RAW|}|32");

  t.is(
    parseRuleBody(`select when foo:`),
    "ParseError: Expected a bare word for the event type|RAW|}|33"
  );

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

  var src = "select when d:t";
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

  src = "if true then";
  tstActionBlock(
    src,
    "ParseError: Expected an action after `if ... then`|RAW|}|50"
  );

  src = "if true then fired {}";
  tstActionBlock(
    src,
    "ParseError: Expected an action after `if ... then`|SYMBOL|fired|51"
  );

  src = "if true then notfired {}";
  tstActionBlock(
    src,
    "ParseError: Expected an action after `if ... then`|SYMBOL|notfired|51"
  );

  src = "if true then always {}";
  tstActionBlock(
    src,
    "ParseError: Expected an action after `if ... then`|SYMBOL|always|51"
  );

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
  tstActionBlock(
    src,
    "ParseError: Expected `every`, `sample`, or `choose`|RAW|{|55"
  );

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
