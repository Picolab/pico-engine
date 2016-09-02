module.exports = {
  "name": "io.picolabs.execution-order",
  "meta": { "shares": ["getOrder"] },
  "global": function (ctx) {
    ctx.scope.set("getOrder", ctx.krl.Closure(ctx, function (ctx) {
      return ctx.persistent.getEnt("order");
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
          ctx.persistent.putEnt("order", ctx.krl.stdlib["append"](ctx.persistent.getEnt("order"), "first-fired"));
        },
        "notfired": undefined,
        "always": function (ctx) {
          ctx.persistent.putEnt("order", ctx.krl.stdlib["append"](ctx.persistent.getEnt("order"), "first-finally"));
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
          ctx.persistent.putEnt("order", ctx.krl.stdlib["append"](ctx.persistent.getEnt("order"), "second-fired"));
        },
        "notfired": undefined,
        "always": function (ctx) {
          ctx.persistent.putEnt("order", ctx.krl.stdlib["append"](ctx.persistent.getEnt("order"), "second-finally"));
        }
      }
    }
  }
};