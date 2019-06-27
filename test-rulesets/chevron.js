module.exports = {
  "rid": "io.picolabs.chevron",
  "meta": {
    "description": "\nHello Chevrons!\n        ",
    "shares": ["d"]
  },
  "global": async function (ctx) {
    ctx.scope.set("a", 1);
    ctx.scope.set("b", 2);
    ctx.scope.set("c", "<h1>some<b>html</b></h1>");
    ctx.scope.set("d", "\n            hi " + await ctx.applyFn(ctx.scope.get("as"), ctx, [
      ctx.scope.get("a"),
      "String"
    ]) + " + " + await ctx.applyFn(ctx.scope.get("as"), ctx, [
      ctx.scope.get("b"),
      "String"
    ]) + " = " + await ctx.applyFn(ctx.scope.get("as"), ctx, [
      await ctx.applyFn(ctx.scope.get("+"), ctx, [
        1,
        2
      ]),
      "String"
    ]) + "\n            " + await ctx.applyFn(ctx.scope.get("as"), ctx, [
      ctx.scope.get("c"),
      "String"
    ]) + "\n        ");
    ctx.scope.set("e", "static");
    ctx.scope.set("f", "");
  },
  "rules": {}
};