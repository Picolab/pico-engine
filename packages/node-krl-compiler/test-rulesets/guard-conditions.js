module.exports = {
  "rid": "io.picolabs.guard-conditions",
  "meta": { "shares": ["getB"] },
  "global": function* (ctx) {
    ctx.scope.set("getB", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "b");
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "foo": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield (yield ctx.modules.get(ctx, "event", "attrMatches"))(ctx, [[[
                  "b",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("b", matches[0]);
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", [
                "foo",
                { "b": ctx.scope.get("b") }
              ]);
            }
          }]
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function* (ctx) {
          if (yield ctx.callKRLstdlib("match", [
              ctx.scope.get("b"),
              new RegExp("foo", "")
            ]))
            yield ctx.modules.set(ctx, "ent", "b", ctx.scope.get("b"));
        }
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "bar": { "a": { "expr_0": true } } },
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
      "foreach": function* (ctx, foreach, iter) {
        yield foreach([
          1,
          2,
          3
        ], ctx.KRLClosure(function* (ctx, getArg, hasArg) {
          ctx.scope.set("x", getArg("value", 0));
          yield iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", [
                "bar",
                {
                  "b": ctx.scope.get("x"),
                  "b": yield ctx.modules.get(ctx, "ent", "b")
                }
              ]);
            }
          }]
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function* (ctx) {
          if (ctx.foreach_is_final)
            yield ctx.modules.set(ctx, "ent", "b", ctx.scope.get("x"));
        }
      }
    }
  }
};