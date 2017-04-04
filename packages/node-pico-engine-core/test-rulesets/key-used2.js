module.exports = {
  "rid": "io.picolabs.key-used2",
  "meta": {
    "name": "key-used2",
    "description": "\nThis is a test file for a module that uses keys\n    ",
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.key-defined",
        "alias": "io.picolabs.key-defined"
      }],
    "shares": [
      "getFoo",
      "getBar",
      "getBarN",
      "getQuux",
      "getQuuz"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "foo"))(ctx, []);
    }));
    ctx.scope.set("getBar", ctx.KRLClosure(ctx, function* (ctx) {
      return yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, []);
    }));
    ctx.scope.set("getBarN", ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("name", ctx.getArg(ctx.args, "name", 0));
      return yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, [ctx.scope.get("name")]);
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