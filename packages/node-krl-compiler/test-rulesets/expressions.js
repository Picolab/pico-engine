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
  "global": function* (ctx) {
    ctx.scope.set("cond_exp_1", true ? 1 : 2);
    ctx.scope.set("cond_exp_2", false ? 1 : 2);
    ctx.scope.set("obj", {
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
    });
    ctx.scope.set("obj", yield ctx.callKRLstdlib("set", [
      ctx.scope.get("obj"),
      [
        "b",
        "c",
        3,
        "d",
        "e"
      ],
      "changed 5"
    ]));
    ctx.scope.set("obj", yield ctx.callKRLstdlib("set", [
      ctx.scope.get("obj"),
      ["a"],
      "changed 1"
    ]));
    ctx.scope.set("path1", yield ctx.callKRLstdlib("get", [
      ctx.scope.get("obj"),
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]));
    ctx.scope.set("path2", yield ctx.callKRLstdlib("get", [
      ctx.scope.get("obj"),
      [
        "b",
        "c",
        5
      ]
    ]));
    ctx.scope.set("index1", yield ctx.callKRLstdlib("get", [
      ctx.scope.get("obj"),
      ["a"]
    ]));
    ctx.scope.set("index2", yield ctx.callKRLstdlib("get", [
      yield ctx.callKRLstdlib("get", [
        yield ctx.callKRLstdlib("get", [
          ctx.scope.get("obj"),
          ["b"]
        ]),
        ["c"]
      ]),
      [1]
    ]));
    ctx.scope.set("not_true", !true);
    ctx.scope.set("not_null", !void 0);
    ctx.scope.set("true_or_false", true || false);
    ctx.scope.set("true_and_false", true && false);
    ctx.scope.set("incByN", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("n", getArg("n", 0));
      return ctx.KRLClosure(function* (ctx, getArg, hasArg) {
        ctx.scope.set("a", getArg("a", 0));
        return yield ctx.callKRLstdlib("+", [
          ctx.scope.get("a"),
          ctx.scope.get("n")
        ]);
      });
    }));
    ctx.scope.set("paramFn", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("foo", hasArg("foo", 0) ? getArg("foo", 0) : yield ctx.scope.get("incByN")(ctx, [3]));
      ctx.scope.set("bar", hasArg("bar", 1) ? getArg("bar", 1) : yield ctx.scope.get("foo")(ctx, [1]));
      ctx.scope.set("baz", hasArg("baz", 2) ? getArg("baz", 2) : yield ctx.callKRLstdlib("+", [
        ctx.scope.get("bar"),
        2
      ]));
      ctx.scope.set("qux", hasArg("qux", 3) ? getArg("qux", 3) : yield ctx.callKRLstdlib("+", [
        ctx.scope.get("baz"),
        "?"
      ]));
      return [
        ctx.scope.get("bar"),
        ctx.scope.get("baz"),
        ctx.scope.get("qux")
      ];
    }));
    ctx.scope.set("paramFnTest", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return [
        yield ctx.scope.get("paramFn")(ctx, []),
        yield ctx.scope.get("paramFn")(ctx, [
          yield ctx.scope.get("incByN")(ctx, [100]),
          "one"
        ]),
        yield ctx.scope.get("paramFn")(ctx, [
          void 0,
          3,
          4,
          5
        ])
      ];
    }));
  },
  "rules": {}
};