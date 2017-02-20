module.exports = {
  "rid": "io.picolabs.engine",
  "rules": {
    "newPico": {
      "name": "newPico",
      "select": {
        "graph": { "engine": { "newPico": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.get(ctx, "engine", "newPico")(ctx, []);
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
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.get(ctx, "engine", "newChannel")(ctx, [{
              "name": yield ctx.modules.get(ctx, "event", "attr")(ctx, ["name"]),
              "type": yield ctx.modules.get(ctx, "event", "attr")(ctx, ["type"]),
              "pico_id": yield ctx.modules.get(ctx, "event", "attr")(ctx, ["pico_id"])
            }]);
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};