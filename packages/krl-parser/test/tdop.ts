import test from "ava";
import { parseExpression, parseRuleset } from "../src/tdop";
import tokenizer from "../src/tokenizer";
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
    meta: null
    // global: [],
    // rules: []
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

test.only("Ruleset meta", t => {
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
