module.exports = {
  "rid": "io.picolabs.with",
  "meta": {
    "shares": [
      "add",
      "inc",
      "foo"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("add", yield ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("a", ctx.getArg(ctx.args, "a", 0));
      ctx.scope.set("b", ctx.getArg(ctx.args, "b", 1));
      return yield ctx.callKRLstdlib("+", ctx.scope.get("a"), ctx.scope.get("b"));
    }));
    ctx.scope.set("inc", yield ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("n", ctx.getArg(ctx.args, "n", 0));
      return yield ctx.scope.get("add")(ctx, {
        "0": 1,
        "b": ctx.scope.get("n")
      });
    }));
    ctx.scope.set("foo", yield ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("a", ctx.getArg(ctx.args, "a", 0));
      return yield ctx.scope.get("add")(ctx, {
        "a": yield ctx.callKRLstdlib("*", ctx.scope.get("a"), 2),
        "b": ctx.scope.get("a")
      });
    }));
  },
  "rules": {}
};