module.exports = {
  "rid": "io.picolabs.key-configurable",
  "meta": {
    "name": "key-configurable",
    "description": "\nThis is a test for api libraries that depend on keys as input\n        ",
    "configure": async function (ctx) {
      ctx.scope.set("key1", "default-key1");
      ctx.scope.set("key2", "default-key2");
    },
    "provides": ["getKeys"]
  },
  "global": async function (ctx) {
    ctx.scope.set("getKeys", ctx.mkFunction([], async function (ctx, args) {
      return [
        ctx.scope.get("key1"),
        ctx.scope.get("key2")
      ];
    }));
  },
  "rules": {}
};