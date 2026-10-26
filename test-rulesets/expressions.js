module.exports = {
  "rid": "io.picolabs.expressions",
  "meta": {
    "shares": [
      "obj",
      "path1",
      "path2",
      "index1",
      "index2",
      "paramFnTest"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "obj",
          "args": []
        },
        {
          "name": "path1",
          "args": []
        },
        {
          "name": "path2",
          "args": []
        },
        {
          "name": "index1",
          "args": []
        },
        {
          "name": "index2",
          "args": []
        },
        {
          "name": "paramFnTest",
          "args": []
        }
      ],
      "events": []
    };
    const cond_exp_12 = true ? 1 : 2;
    const cond_exp_22 = false ? 1 : 2;
    const obj2 = {
      "a": 1,
      "b": {
        "c": [
          2,
          3,
          4,
          { "d": { "e": 5 } },
          6,
          7
        ]
      }
    };
    const path12 = await $stdlib["get"]($ctx, [
      obj2,
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]);
    const path22 = await $stdlib["get"]($ctx, [
      obj2,
      [
        "b",
        "c",
        5
      ]
    ]);
    const index12 = await $stdlib["get"]($ctx, [
      obj2,
      ["a"]
    ]);
    const index22 = await $stdlib["get"]($ctx, [
      await $stdlib["get"]($ctx, [
        await $stdlib["get"]($ctx, [
          obj2,
          ["b"]
        ]),
        ["c"]
      ]),
      [1]
    ]);
    const not_true2 = !true;
    const not_null2 = !void 0;
    const true_or_false2 = true || false;
    const true_and_false2 = true && false;
    const incByN2 = $ctx.krl.Function(["n"], async function (n3) {
      return $ctx.krl.Function(["a"], async function (a4) {
        return await $stdlib["+"]($ctx, [
          a4,
          n3
        ]);
      });
    });
    const paramFn2 = $ctx.krl.Function([
      "foo",
      "bar",
      "baz",
      "qux"
    ], async function (foo3 = $default, bar3 = $default, baz3 = $default, qux3 = $default) {
      if (foo3 == $default) {
        foo3 = await incByN2($ctx, [3]);
      }
      if (bar3 == $default) {
        bar3 = await $ctx.krl.assertFunction(foo3)($ctx, [1]);
      }
      if (baz3 == $default) {
        baz3 = await $stdlib["+"]($ctx, [
          bar3,
          2
        ]);
      }
      if (qux3 == $default) {
        qux3 = await $stdlib["+"]($ctx, [
          baz3,
          "?"
        ]);
      }
      return [
        bar3,
        baz3,
        qux3
      ];
    });
    const paramFnTest2 = $ctx.krl.Function([], async function () {
      return [
        await paramFn2($ctx, []),
        await paramFn2($ctx, [
          await incByN2($ctx, [100]),
          "one"
        ]),
        await paramFn2($ctx, [
          void 0,
          3,
          4,
          5
        ])
      ];
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    const $consoleGlobalRefs = {
      "cond_exp_1": cond_exp_12,
      "cond_exp_2": cond_exp_22,
      "obj": obj2,
      "path1": path12,
      "path2": path22,
      "index1": index12,
      "index2": index22,
      "not_true": not_true2,
      "not_null": not_null2,
      "true_or_false": true_or_false2,
      "true_and_false": true_and_false2,
      "incByN": incByN2,
      "paramFn": paramFn2,
      "paramFnTest": paramFnTest2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.expressions {\n    meta {\n        shares obj, path1, path2, index1, index2, paramFnTest\n    }\n    global {\n        cond_exp_1 = true => 1 |\n            2\n        cond_exp_2 = false => 1 |\n            2\n        obj = {\n            \"a\": 1,\n            \"b\": {\"c\": [2, 3, 4, {\"d\": {\"e\": 5}}, 6, 7]}\n        }\n        path1 = obj{[\"b\", \"c\", 3, \"d\"]}\n        path2 = obj{[\"b\", \"c\", 5]}\n        index1 = obj[\"a\"]\n        index2 = obj[\"b\"][\"c\"][1]\n        not_true = not true\n        not_null = not null\n        true_or_false = true || false\n        true_and_false = true && false\n        incByN = function(n){\n            function(a){\n                a + n;\n            };\n        }\n        paramFn = function(\n            foo = incByN(3),\n            bar = foo(1),\n            baz = bar + 2,\n            qux = baz + \"?\",\n        ){\n            [bar, baz, qux];\n        }\n        paramFnTest = function(){\n            [\n                paramFn(),\n                paramFn(incByN(100), \"one\"),\n                paramFn(null, 3, 4, 5)\n            ];\n        }\n    }\n\n}\n";
    const $compileEvalExpression = $ctx["compileEvalExpression"];
    const $consoleEvalCache = new Map();
    const $runConsoleEval = async expr => {
      let runner = $consoleEvalCache.get(expr);
      if (!runner) {
        runner = $compileEvalExpression(expr, { rulesetKrl: $rulesetKrlSource }).run;
        $consoleEvalCache.set(expr, runner);
      }
      return await runner($ctx, $consoleGlobalRefs);
    };
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return {
          "directives": $ctx.drainDirectives(),
          "ruleOutcomes": $ctx.drainRuleOutcomes()
        };
      },
      "query": {
        "obj": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return obj2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path1": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path12;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path2": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path22;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index1": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index12;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index2": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index22;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "paramFnTest": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await paramFnTest2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        },
        "__consoleEval": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await $runConsoleEval(query["args"]["expr"]);
          } finally {
            $ctx.setQuery(null);
          }
        }
      },
      "consoleGlobalRefs": $consoleGlobalRefs
    };
  }
};
