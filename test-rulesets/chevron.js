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
    ctx.scope.set("d", "\n            hi " + (await ctx.callKRLstdlib("beesting", [ctx.scope.get("a")])) + " + " + (await ctx.callKRLstdlib("beesting", [ctx.scope.get("b")])) + " = " + (await ctx.callKRLstdlib("beesting", [await ctx.callKRLstdlib("+", [
        1,
        2
      ])])) + "\n            " + (await ctx.callKRLstdlib("beesting", [ctx.scope.get("c")])) + "\n        ");
    ctx.scope.set("e", "static");
    ctx.scope.set("f", "");
  },
  "rules": {}
};