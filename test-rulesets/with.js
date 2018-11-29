module.exports = {
  "rid": "io.picolabs.with",
  "meta": {
    "shares": [
      "add",
      "inc",
      "foo"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("add", ctx.mkFunction([
      "a",
      "b"
    ], async function (ctx, args) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      return await ctx.applyFn(ctx.scope.get("+"), ctx, [
        ctx.scope.get("a"),
        ctx.scope.get("b")
      ]);
    }));
    ctx.scope.set("inc", ctx.mkFunction(["n"], async function (ctx, args) {
      ctx.scope.set("n", args["n"]);
      return await ctx.applyFn(ctx.scope.get("add"), ctx, {
        "0": 1,
        "b": ctx.scope.get("n")
      });
    }));
    ctx.scope.set("foo", ctx.mkFunction(["a"], async function (ctx, args) {
      ctx.scope.set("a", args["a"]);
      return await ctx.applyFn(ctx.scope.get("add"), ctx, {
        "a": await ctx.applyFn(ctx.scope.get("*"), ctx, [
          ctx.scope.get("a"),
          2
        ]),
        "b": ctx.scope.get("a")
      });
    }));
  },
  "rules": {}
};