module.exports = {
  "rid": "io.picolabs.key-used3",
  "meta": {
    "name": "key-used3",
    "description": "\nThis is a test file who was shared a key, but doesn't \"use\" it\n    ",
    "shares": ["getFoo"]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "foo"))(ctx, []);
    }));
  },
  "rules": {}
};