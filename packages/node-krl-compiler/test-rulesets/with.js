module.exports = {
  "rid": "io.picolabs.with",
  "meta": {
    "shares": [
      "add",
      "inc",
      "foo"
    ]
  },
  "global": function (ctx) {
    ctx.scope.set("add", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("a", ctx.getArg(ctx.args, "a", 0));
      ctx.scope.set("b", ctx.getArg(ctx.args, "b", 1));
      return ctx.callKRLstdlib("+", ctx.scope.get("a"), ctx.scope.get("b"));
    }));
    ctx.scope.set("inc", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("n", ctx.getArg(ctx.args, "n", 0));
      return ctx.scope.get("add")(ctx, {
        "0": 1,
        "b": ctx.scope.get("n")
      });
    }));
    ctx.scope.set("foo", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("a", ctx.getArg(ctx.args, "a", 0));
      return ctx.scope.get("add")(ctx, {
        "a": ctx.callKRLstdlib("*", ctx.scope.get("a"), 2),
        "b": ctx.scope.get("a")
      });
    }));
  },
  "rules": {}
};