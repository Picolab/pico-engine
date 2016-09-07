module.exports = {
  "rid": "io.picolabs.module-used",
  "meta": {
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_conf",
        "with": function (ctx) {
          ctx.scope.set("greeting", "Greetings ");
        }
      }
    ]
  },
  "rules": {
    "say_hello": {
      "name": "say_hello",
      "select": {
        "graph": { "module_used": { "say_hello": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.event.getAttrMatches([[
                "name",
                new RegExp("(.*)", "")
              ]]);
            if (!matches)
              return false;
            ctx.scope.set("name", matches[0]);
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
                "name": "say_hello",
                "options": {
                  "something": ctx.modules.get(ctx, "my_module", "hello")(ctx, [ctx.scope.get("name")]),
                  "configured": ctx.modules.get(ctx, "my_module_conf", "hello")(ctx, [ctx.scope.get("name")])
                }
              };
            }
          }]
      }
    },
    "privateFn": {
      "name": "privateFn",
      "select": {
        "graph": { "module_used": { "privateFn": { "expr_0": true } } },
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
                "name": "privateFn",
                "options": { "something": ctx.modules.get(ctx, "my_module", "privateFn")(ctx, ["{{name}}"]) }
              };
            }
          }]
      }
    },
    "queryFn": {
      "name": "queryFn",
      "select": {
        "graph": { "module_used": { "queryFn": { "expr_0": true } } },
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
                "name": "queryFn",
                "options": { "something": ctx.modules.get(ctx, "my_module", "queryFn")(ctx, ["{{name}}"]) }
              };
            }
          }]
      }
    }
  }
};