module.exports = {
  "rid": "io.picolabs.engine",
  "rules": {
    "newPico": {
      "name": "newPico",
      "select": {
        "graph": { "engine": { "newPico": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield (yield ctx.modules.get(ctx, "engine", "newPico"))(ctx, []);
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
      "prelude": function* (ctx) {
        ctx.scope.set("pico_id", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["pico_id"]));
        ctx.scope.set("name", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["name"]));
        ctx.scope.set("type", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["type"]));
      },
      "postlude": {
        "fired": function* (ctx) {
          yield (yield ctx.modules.get(ctx, "engine", "newChannel"))(ctx, [
            ctx.scope.get("pico_id"),
            ctx.scope.get("name"),
            ctx.scope.get("type")
          ]);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "removeChannel": {
      "name": "removeChannel",
      "select": {
        "graph": { "engine": { "removeChannel": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield (yield ctx.modules.get(ctx, "engine", "removeChannel"))(ctx, [yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["eci"])]);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "installRuleset": {
      "name": "installRuleset",
      "select": {
        "graph": { "engine": { "installRuleset": { "expr_0": true } } },
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
      "prelude": function* (ctx) {
        ctx.scope.set("pico_id", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["pico_id"]));
        ctx.scope.set("rid", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["rid"]));
        ctx.scope.set("url", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["url"]));
        ctx.scope.set("base", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["base"]));
      },
      "postlude": {
        "fired": function* (ctx) {
          yield (yield ctx.modules.get(ctx, "engine", "installRuleset"))(ctx, [
            ctx.scope.get("pico_id"),
            ctx.scope.get("rid"),
            ctx.scope.get("url"),
            ctx.scope.get("base")
          ]);
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};