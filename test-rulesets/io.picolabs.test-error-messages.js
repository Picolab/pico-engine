module.exports = {
  "rid": "io.picolabs.test-error-messages",
  "meta": {
    "description": "\nThis is a ruleset that will compile, but does things\nthe wrong way to test how they are handled at runtime\n        ",
    "shares": [
      "hello",
      "null_val",
      "somethingNotDefined",
      "infiniteRecursion"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("hello", ctx.mkFunction(["obj"], function* (ctx, args) {
      ctx.scope.set("obj", args["obj"]);
      return yield ctx.callKRLstdlib("+", [
        "Hello ",
        ctx.scope.get("obj")
      ]);
    }));
    ctx.scope.set("null_val", null);
    ctx.scope.set("infiniteRecursion", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.applyFn(ctx.scope.get("infiniteRecursion"), ctx, []);
    }));
  },
  "rules": {}
};