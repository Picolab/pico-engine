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
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "foo",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          if (yield ctx.callKRLstdlib("==", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["stop"]), "foo"))
            ctx.stopRulesetExecution();
        },
        "notfired": undefined,
        "always": undefined
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
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "bar",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          if (yield ctx.callKRLstdlib("==", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["stop"]), "bar"))
            ctx.stopRulesetExecution();
        },
        "notfired": undefined,
        "always": undefined
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
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "baz",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          ctx.stopRulesetExecution();
        },
        "notfired": undefined,
        "always": undefined
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
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "qux",
                "options": {}
              };
            }
          }]
      }
    }
  }
};