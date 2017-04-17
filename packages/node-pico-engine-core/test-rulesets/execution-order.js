module.exports = {
  "rid": "io.picolabs.execution-order",
  "meta": { "shares": ["getOrder"] },
  "global": function* (ctx) {
    ctx.scope.set("getOrder", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "ent", "order");
    }));
  },
  "rules": {
    "first": {
      "name": "first",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
                "name": "first",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "order"), "first-fired"));
        },
        "notfired": undefined,
        "always": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "order"), "first-finally"));
        }
      }
    },
    "second": {
      "name": "second",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
                "name": "second",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "order"), "second-fired"));
        },
        "notfired": undefined,
        "always": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "order", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "order"), "second-finally"));
        }
      }
    }
  }
};