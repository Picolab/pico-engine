module.exports = {
  "rid": "io.picolabs.foreach",
  "meta": { "name": "testing foreach" },
  "global": function* (ctx) {
    ctx.scope.set("doubleThis", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("arr", getArg("arr", 0));
      return [
        ctx.scope.get("arr"),
        ctx.scope.get("arr")
      ];
    }));
  },
  "rules": {
    "basic": {
      "name": "basic",
      "select": {
        "graph": { "foreach": { "basic": { "expr_0": true } } },
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
        ], ctx.KRLClosure(function* (ctx, getArg) {
          ctx.scope.set("x", getArg("value", 0));
          yield iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "basic",
                "x": ctx.scope.get("x")
              });
            }
          }]
      }
    },
    "map": {
      "name": "map",
      "select": {
        "graph": { "foreach": { "map": { "expr_0": true } } },
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
        yield foreach({
          "a": 1,
          "b": 2,
          "c": 3
        }, ctx.KRLClosure(function* (ctx, getArg) {
          ctx.scope.set("v", getArg("value", 0));
          ctx.scope.set("k", getArg("key", 1));
          yield iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "map",
                "k": ctx.scope.get("k"),
                "v": ctx.scope.get("v")
              });
            }
          }]
      }
    },
    "nested": {
      "name": "nested",
      "select": {
        "graph": { "foreach": { "nested": { "expr_0": true } } },
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
        ], ctx.KRLClosure(function* (ctx, getArg) {
          ctx.scope.set("x", getArg("value", 0));
          yield foreach([
            "a",
            "b",
            "c"
          ], ctx.KRLClosure(function* (ctx, getArg) {
            ctx.scope.set("y", getArg("value", 0));
            yield iter(ctx);
          }));
        }));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "nested",
                "x": ctx.scope.get("x"),
                "y": ctx.scope.get("y")
              });
            }
          }]
      }
    },
    "scope": {
      "name": "scope",
      "select": {
        "graph": { "foreach": { "scope": { "expr_0": true } } },
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
        yield foreach(yield ctx.scope.get("doubleThis")(ctx, [[
            1,
            2,
            3
          ]]), ctx.KRLClosure(function* (ctx, getArg) {
          ctx.scope.set("arr", getArg("value", 0));
          yield foreach(ctx.scope.get("arr"), ctx.KRLClosure(function* (ctx, getArg) {
            ctx.scope.set("foo", getArg("value", 0));
            yield foreach(yield ctx.callKRLstdlib("range", 0, ctx.scope.get("foo")), ctx.KRLClosure(function* (ctx, getArg) {
              ctx.scope.set("bar", getArg("value", 0));
              yield iter(ctx);
            }));
          }));
        }));
      },
      "prelude": function* (ctx) {
        ctx.scope.set("baz", yield ctx.callKRLstdlib("*", ctx.scope.get("foo"), ctx.scope.get("bar")));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "scope",
                "foo": ctx.scope.get("foo"),
                "bar": ctx.scope.get("bar"),
                "baz": ctx.scope.get("baz")
              });
            }
          }]
      }
    }
  }
};