module.exports = {
  "rid": "io.picolabs.engine",
  "rules": {
    "newPico": {
      "name": "newPico",
      "select": {
        "graph": { "engine": { "newPico": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.get(ctx, "engine", "newPico")(ctx, []);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "newChannel": {
      "name": "newChannel",
      "select": {
        "graph": { "engine": { "newChannel": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.get(ctx, "engine", "newChannel")(ctx, [{
              "name": ctx.modules.get(ctx, "event", "attr")(ctx, ["name"]),
              "type": ctx.modules.get(ctx, "event", "attr")(ctx, ["type"]),
              "pico_id": ctx.modules.get(ctx, "event", "attr")(ctx, ["pico_id"])
            }]);
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};