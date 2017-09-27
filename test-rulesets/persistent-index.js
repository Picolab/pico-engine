module.exports = {
  "rid": "io.picolabs.persistent-index",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey"
    ],
    "index": null
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "foo");
    }));
    ctx.scope.set("getFooKey", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("key", getArg("key", 0));
      return yield ctx.callKRLstdlib("get", [
        yield ctx.modules.get(ctx, "ent", "foo"),
        ctx.scope.get("key")
      ]);
    }));
  },
  "rules": {
    "putfoo": {
      "name": "putfoo",
      "select": {
        "graph": { "pindex": { "putfoo": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        ctx.scope.set("value", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["value"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "putfoo",
            {
              "key": ctx.scope.get("key"),
              "value": ctx.scope.get("value")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "foo", yield ctx.callKRLstdlib("set", [
          yield ctx.modules.get(ctx, "ent", "foo"),
          ctx.scope.get("key"),
          ctx.scope.get("value")
        ]));
      }
    }
  }
};