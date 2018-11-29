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
  "global": async function (ctx) {
    ctx.scope.set("hello", ctx.mkFunction(["obj"], async function (ctx, args) {
      ctx.scope.set("obj", args["obj"]);
      return await ctx.applyFn(ctx.scope.get("+"), ctx, [
        "Hello ",
        ctx.scope.get("obj")
      ]);
    }));
    ctx.scope.set("null_val", void 0);
    ctx.scope.set("infiniteRecursion", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(ctx.scope.get("infiniteRecursion"), ctx, []);
    }));
  },
  "rules": {}
};