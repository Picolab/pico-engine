module.exports = {
  "rid": "io.picolabs.key-used3",
  "meta": {
    "name": "key-used3",
    "description": "\nThis is a test file who was shared a key, but doesn't \"use\" it\n        ",
    "shares": ["getFoo"]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo", undefined), ctx, []);
    }));
  },
  "rules": {}
};