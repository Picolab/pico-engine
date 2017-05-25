module.exports = {
  "rid": "io.picolabs.chevron",
  "meta": {
    "description": "\nHello Chevrons!\n        ",
    "shares": ["d"]
  },
  "global": function* (ctx) {
    ctx.scope.set("a", 1);
    ctx.scope.set("b", 2);
    ctx.scope.set("c", "<h1>some<b>html</b></h1>");
    ctx.scope.set("d", "\n            hi " + (yield ctx.callKRLstdlib("beesting", [ctx.scope.get("a")])) + " + " + (yield ctx.callKRLstdlib("beesting", [ctx.scope.get("b")])) + " = " + (yield ctx.callKRLstdlib("beesting", [yield ctx.callKRLstdlib("+", [
        1,
        2
      ])])) + "\n            " + (yield ctx.callKRLstdlib("beesting", [ctx.scope.get("c")])) + "\n        ");
    ctx.scope.set("e", "static");
    ctx.scope.set("f", "");
  },
  "rules": {}
};