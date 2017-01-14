module.exports = {
  "rid": "io.picolabs.foreach",
  "meta": { "name": "testing foreach" },
  "global": function (ctx) {
    ctx.scope.set("getVals", ctx.KRLClosure(ctx, function (ctx) {
      return [
        1,
        2,
        3
      ];
    }));
  },
  "rules": {
    "basic": {
      "name": "basic",
      "select": {
        "graph": { "foreach": { "basic": { "expr_0": true } } },
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
      "foreach": function (ctx, iter) {
        ctx.callKRLstdlib("map", [
          1,
          2,
          3
        ], ctx.KRLClosure(ctx, function (ctx) {
          ctx.scope.set("x", ctx.getArg(ctx.args, "value", 0));
          iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "basic",
                "options": { "x": ctx.scope.get("x") }
              };
            }
          }]
      }
    }
  }
};
