module.exports = {
  "rid": "io.picolabs.last",
  "meta": { "name": "testing postlude `last` statement" },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
      "action_block": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["foo"], []);
        }
        return fired;
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          if (yield ctx.callKRLstdlib("==", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["stop"]),
              "foo"
            ]))
            ctx.stopRulesetExecution();
        }
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
      "action_block": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["bar"], []);
        }
        return fired;
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          if (yield ctx.callKRLstdlib("==", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["stop"]),
              "bar"
            ]))
            ctx.stopRulesetExecution();
        }
      }
    },
    "baz": {
      "name": "baz",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
      "action_block": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["baz"], []);
        }
        return fired;
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          ctx.stopRulesetExecution();
        }
      }
    },
    "qux": {
      "name": "qux",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
      "action_block": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", ["qux"], []);
        }
        return fired;
      }
    }
  }
};