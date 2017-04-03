module.exports = {
  "rid": "io.picolabs.key-used",
  "meta": {
    "name": "key-used",
    "description": "\nThis is a test file for a module that uses keys\n    ",
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.key-defined",
        "alias": "io.picolabs.key-defined"
      }],
    "shares": [
      "getFoo",
      "getBar",
      "getQuux",
      "getQuuz"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "foo"))(ctx, []);
    }));
    ctx.scope.set("getBar", ctx.KRLClosure(ctx, function* (ctx) {
      return [
        yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, []),
        yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, ["baz"]),
        yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, ["qux"]),
        yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, ["not_here"])
      ];
    }));
    ctx.scope.set("getQuux", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "quux"))(ctx, []);
    }));
    ctx.scope.set("getQuuz", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "quuz"))(ctx, []);
    }));
  },
  "rules": {}
};