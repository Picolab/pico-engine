module.exports = {
  "rid": "io.picolabs.key-used",
  "meta": {
    "name": "key-used",
    "description": "\nThis is a test file for a module that uses keys\n        ",
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.key-defined",
        "alias": "io.picolabs.key-defined"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.key-configurable",
        "alias": "api",
        "with": function* (ctx) {
          ctx.scope.set("key1", yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []));
          ctx.scope.set("key2", yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "bar"), ctx, ["baz"]));
        }
      }
    ],
    "shares": [
      "getFoo",
      "getBar",
      "getBarN",
      "getQuux",
      "getQuuz",
      "getAPIKeys",
      "getFooPostlude",
      "foo_global"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []);
    }));
    ctx.scope.set("getBar", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "bar"), ctx, []);
    }));
    ctx.scope.set("getBarN", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("name", getArg("name", 0));
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "bar"), ctx, [ctx.scope.get("name")]);
    }));
    ctx.scope.set("getQuux", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "quux"), ctx, []);
    }));
    ctx.scope.set("getQuuz", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "quuz"), ctx, []);
    }));
    ctx.scope.set("getAPIKeys", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "api", "getKeys"), ctx, []);
    }));
    ctx.scope.set("getFooPostlude", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "foo_postlude");
    }));
    ctx.scope.set("foo_global", yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []));
  },
  "rules": {
    "key_used_foo": {
      "name": "key_used_foo",
      "select": {
        "graph": { "key_used": { "foo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "prelude": function* (ctx) {
        ctx.scope.set("foo_pre", yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "foo",
                {
                  "foo": yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []),
                  "foo_pre": ctx.scope.get("foo_pre")
                }
              ], []);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "foo_postlude", yield ctx.applyFn(yield ctx.modules.get(ctx, "keys", "foo"), ctx, []));
      }
    }
  }
};