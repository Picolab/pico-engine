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
  "global": async function (ctx) {
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
    ctx.scope.set("path1", await ctx.applyFn(ctx.scope.get("get"), ctx, [
      ctx.scope.get("obj"),
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]));
    ctx.scope.set("path2", await ctx.applyFn(ctx.scope.get("get"), ctx, [
      ctx.scope.get("obj"),
      [
        "b",
        "c",
        5
      ]
    ]));
    ctx.scope.set("index1", await ctx.applyFn(ctx.scope.get("get"), ctx, [
      ctx.scope.get("obj"),
      ["a"]
    ]));
    ctx.scope.set("index2", await ctx.applyFn(ctx.scope.get("get"), ctx, [
      await ctx.applyFn(ctx.scope.get("get"), ctx, [
        await ctx.applyFn(ctx.scope.get("get"), ctx, [
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
    ctx.scope.set("incByN", ctx.mkFunction(["n"], async function (ctx, args) {
      ctx.scope.set("n", args["n"]);
      return ctx.mkFunction(["a"], async function (ctx, args) {
        ctx.scope.set("a", args["a"]);
        return await ctx.applyFn(ctx.scope.get("+"), ctx, [
          ctx.scope.get("a"),
          ctx.scope.get("n")
        ]);
      });
    }));
    ctx.scope.set("paramFn", ctx.mkFunction([
      "foo",
      "bar",
      "baz",
      "qux"
    ], async function (ctx, args) {
      ctx.scope.set("foo", args.hasOwnProperty("foo") ? args["foo"] : await ctx.applyFn(ctx.scope.get("incByN"), ctx, [3]));
      ctx.scope.set("bar", args.hasOwnProperty("bar") ? args["bar"] : await ctx.applyFn(ctx.scope.get("foo"), ctx, [1]));
      ctx.scope.set("baz", args.hasOwnProperty("baz") ? args["baz"] : await ctx.applyFn(ctx.scope.get("+"), ctx, [
        ctx.scope.get("bar"),
        2
      ]));
      ctx.scope.set("qux", args.hasOwnProperty("qux") ? args["qux"] : await ctx.applyFn(ctx.scope.get("+"), ctx, [
        ctx.scope.get("baz"),
        "?"
      ]));
      return [
        ctx.scope.get("bar"),
        ctx.scope.get("baz"),
        ctx.scope.get("qux")
      ];
    }));
    ctx.scope.set("paramFnTest", ctx.mkFunction([], async function (ctx, args) {
      return [
        await ctx.applyFn(ctx.scope.get("paramFn"), ctx, []),
        await ctx.applyFn(ctx.scope.get("paramFn"), ctx, [
          await ctx.applyFn(ctx.scope.get("incByN"), ctx, [100]),
          "one"
        ]),
        await ctx.applyFn(ctx.scope.get("paramFn"), ctx, [
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