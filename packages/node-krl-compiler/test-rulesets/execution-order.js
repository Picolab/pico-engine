module.exports = {
  "rid": "io.picolabs.execution-order",
  "meta": { "shares": ["getOrder"] },
  "global": function* (ctx) {
    ctx.scope.set("getOrder", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "order");
    }));
  },
  "rules": {
    "first": {
      "name": "first",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["first"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "order"),
            "first-fired"
          ]));
        }
        yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order"),
          "first-finally"
        ]));
      }
    },
    "second": {
      "name": "second",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["second"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "order"),
            "second-fired"
          ]));
        }
        yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order"),
          "second-finally"
        ]));
      }
    },
    "reset_order": {
      "name": "reset_order",
      "select": {
        "graph": { "execution_order": { "reset_order": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["reset_order"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "order", []);
      }
    },
    "foo_or_bar": {
      "name": "foo_or_bar",
      "select": {
        "graph": {
          "execution_order": {
            "foo": { "expr_0": true },
            "bar": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["foo_or_bar"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order"),
          "foo_or_bar"
        ]));
      }
    },
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "execution_order": { "foo": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["foo"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order"),
          "foo"
        ]));
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "execution_order": { "bar": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["bar"]);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", [
          yield ctx.modules.get(ctx, "ent", "order"),
          "bar"
        ]));
      }
    }
  }
};