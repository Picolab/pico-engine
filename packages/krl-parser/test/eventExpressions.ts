import test from "ava";
import { parseRuleset } from "../src/krl";
import tokenizer from "../src/tokenizer";
import * as ast from "../src/types";
const normalizeAST = require("./helpers/normalizeAST");
const mk = require("./helpers/astMaker");
const rmLoc = require("./helpers/rmLoc");

test("EventExpression", t => {
  function testEE(src: string, expected: any) {
    const node = parseRuleset(
      tokenizer(`ruleset a{rule a{select when ${src} noop()}}`)
    ) as any;
    t.deepEqual(normalizeAST(rmLoc(node.rules[0].select.event)), expected);
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
