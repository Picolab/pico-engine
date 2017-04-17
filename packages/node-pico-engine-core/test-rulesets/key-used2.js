module.exports = {
  "rid": "io.picolabs.key-used2",
  "meta": {
    "name": "key-used2",
    "description": "\nThis is a test file for a module that uses keys\n    ",
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.key-defined",
        "alias": "io.picolabs.key-defined"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.key-configurable",
        "alias": "api"
      }
    ],
    "shares": [
      "getFoo",
      "getBar",
      "getBarN",
      "getQuux",
      "getQuuz",
      "getAPIKeys"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "keys", "foo"))(ctx, []);
    }));
    ctx.scope.set("getBar", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, []);
    }));
    ctx.scope.set("getBarN", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("name", getArg("name", 0));
      return yield (yield ctx.modules.get(ctx, "keys", "bar"))(ctx, [ctx.scope.get("name")]);
    }));
    ctx.scope.set("getQuux", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "keys", "quux"))(ctx, []);
    }));
    ctx.scope.set("getQuuz", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "keys", "quuz"))(ctx, []);
    }));
    ctx.scope.set("getAPIKeys", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "api", "getKeys"))(ctx, []);
    }));
  },
  "rules": {}
};