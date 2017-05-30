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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, "engine", "newPico", [], []);
            }
          }]
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
        ctx.scope.set("pico_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]));
        ctx.scope.set("type", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["type"]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, "engine", "newChannel", [
                ctx.scope.get("pico_id"),
                ctx.scope.get("name"),
                ctx.scope.get("type")
              ], []);
            }
          }]
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, "engine", "removeChannel", [yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["eci"])], []);
            }
          }]
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
        ctx.scope.set("pico_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("rid", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rid"]));
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        ctx.scope.set("base", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["base"]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, "engine", "installRuleset", [
                ctx.scope.get("pico_id"),
                ctx.scope.get("rid"),
                ctx.scope.get("url"),
                ctx.scope.get("base")
              ], []);
            }
          }]
      }
    }
  }
};