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
    ctx.scope.set("add", ctx.mkFunction([
      "a",
      "b"
    ], function* (ctx, args) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      return yield ctx.callKRLstdlib("+", [
        ctx.scope.get("a"),
        ctx.scope.get("b")
      ]);
    }));
    ctx.scope.set("inc", ctx.mkFunction(["n"], function* (ctx, args) {
      ctx.scope.set("n", args["n"]);
      return yield ctx.applyFn(ctx.scope.get("add"), ctx, {
        "0": 1,
        "b": ctx.scope.get("n")
      });
    }));
    ctx.scope.set("foo", ctx.mkFunction(["a"], function* (ctx, args) {
      ctx.scope.set("a", args["a"]);
      return yield ctx.applyFn(ctx.scope.get("add"), ctx, {
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