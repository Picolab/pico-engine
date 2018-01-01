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
          ctx.scope.set("key1", yield ctx.modules.get(ctx, "keys", "foo"));
          ctx.scope.set("key2", yield ctx.callKRLstdlib("get", [
            yield ctx.modules.get(ctx, "keys", "bar"),
            "baz"
          ]));
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
    ctx.scope.set("getFoo", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "keys", "foo");
    }));
    ctx.scope.set("getBar", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "keys", "bar");
    }));
    ctx.scope.set("getBarN", ctx.mkFunction(["name"], function* (ctx, args) {
      ctx.scope.set("name", args["name"]);
      return yield ctx.callKRLstdlib("get", [
        yield ctx.modules.get(ctx, "keys", "bar"),
        ctx.scope.get("name")
      ]);
    }));
    ctx.scope.set("getQuux", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "keys", "quux");
    }));
    ctx.scope.set("getQuuz", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "keys", "quuz");
    }));
    ctx.scope.set("getAPIKeys", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "api", "getKeys"), ctx, []);
    }));
    ctx.scope.set("getFooPostlude", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "foo_postlude");
    }));
    ctx.scope.set("foo_global", yield ctx.modules.get(ctx, "keys", "foo"));
  },
  "rules": {
    "key_used_foo": {
      "name": "key_used_foo",
      "select": {
        "graph": { "key_used": { "foo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("foo_pre", yield ctx.modules.get(ctx, "keys", "foo"));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "foo",
            {
              "foo": yield ctx.modules.get(ctx, "keys", "foo"),
              "foo_pre": ctx.scope.get("foo_pre")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "foo_postlude", yield ctx.modules.get(ctx, "keys", "foo"));
      }
    }
  }
};