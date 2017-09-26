module.exports = {
  "rid": "io.picolabs.key-configurable",
  "meta": {
    "name": "key-configurable",
    "description": "\nThis is a test for api libraries that depend on keys as input\n        ",
    "configure": function* (ctx) {
      ctx.scope.set("key1", "default-key1");
      ctx.scope.set("key2", "default-key2");
    },
    "provides": ["getKeys"]
  },
  "global": function* (ctx) {
    ctx.scope.set("getKeys", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return [
        ctx.scope.get("key1"),
        ctx.scope.get("key2")
      ];
    }));
  },
  "rules": {}
};