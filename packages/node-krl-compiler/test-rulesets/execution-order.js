module.exports = {
  "rid": "io.picolabs.execution-order",
  "meta": { "shares": ["getOrder"] },
  "global": function (ctx) {
    ctx.scope.set("getOrder", ctx.krl.Closure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "order");
    }));
  },
  "rules": {
    "first": {
      "name": "first",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "first",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "order", ctx.callKRLstdlib("append", ctx.modules.get(ctx, "ent", "order"), "first-fired"));
        },
        "notfired": undefined,
        "always": function (ctx) {
          ctx.modules.set(ctx, "ent", "order", ctx.callKRLstdlib("append", ctx.modules.get(ctx, "ent", "order"), "first-finally"));
        }
      }
    },
    "second": {
      "name": "second",
      "select": {
        "graph": { "execution_order": { "all": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "second",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "order", ctx.callKRLstdlib("append", ctx.modules.get(ctx, "ent", "order"), "second-fired"));
        },
        "notfired": undefined,
        "always": function (ctx) {
          ctx.modules.set(ctx, "ent", "order", ctx.callKRLstdlib("append", ctx.modules.get(ctx, "ent", "order"), "second-finally"));
        }
      }
    }
  }
};