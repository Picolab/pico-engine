module.exports = {
  "rid": "io.picolabs.key-used3",
  "meta": {
    "name": "key-used3",
    "description": "\nThis is a test file who was shared a key, but doesn't \"use\" it\n        ",
    "shares": ["getFoo"]
  },
  "global": async function (ctx) {
    ctx.scope.set("getFoo", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "keys", "foo");
    }));
  },
  "rules": {}
};