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
    ctx.scope.set("add", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      return yield ctx.callKRLstdlib("+", [
        ctx.scope.get("a"),
        ctx.scope.get("b")
      ]);
    }));
    ctx.scope.set("inc", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("n", getArg("n", 0));
      return yield ctx.scope.get("add")(ctx, {
        "0": 1,
        "b": ctx.scope.get("n")
      });
    }));
    ctx.scope.set("foo", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("a", getArg("a", 0));
      return yield ctx.scope.get("add")(ctx, {
        "a": yield ctx.callKRLstdlib("*", [
          ctx.scope.get("a"),
          2
        ]),
        "b": ctx.scope.get("a")
      });
    }));
  },
  "rules": {}
};