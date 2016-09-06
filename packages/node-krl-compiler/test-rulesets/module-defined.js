module.exports = {
  "rid": "io.picolabs.module-defined",
  "meta": {
    "provides": ["hello"],
    "configure": function (ctx) {
      ctx.scope.set("greeting", "Hello ");
    }
  },
  "global": function (ctx) {
    ctx.scope.set("hello", ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set("obj", ctx.getArg(ctx.args, "obj", 0));
      return ctx.krl.stdlib["+"](ctx.scope.get("greeting"), ctx.scope.get("obj"));
    }));
  },
  "rules": {
    "should_not_handle_events": {
      "name": "should_not_handle_events",
      "select": {
        "graph": { "module_defined": { "hello": { "expr_0": true } } },
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
                "name": "module_defined - should_not_handle_events !",
                "options": {}
              };
            }
          }]
      }
    }
  }
};