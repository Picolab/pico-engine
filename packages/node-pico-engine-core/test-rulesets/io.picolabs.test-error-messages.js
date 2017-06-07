module.exports = {
  "rid": "io.picolabs.test-error-messages",
  "meta": {
    "description": "\nThis is a ruleset that will compile, but does things\nthe wrong way to test how they are handled at runtime\n        ",
    "shares": [
      "hello",
      "null_val",
      "somethingNotDefined"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("hello", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("obj", getArg("obj", 0));
      return yield ctx.callKRLstdlib("+", [
        "Hello ",
        ctx.scope.get("obj")
      ]);
    }));
    ctx.scope.set("null_val", void 0);
  },
  "rules": {}
};