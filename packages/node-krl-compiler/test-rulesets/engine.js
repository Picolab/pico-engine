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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "newPico", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        ctx.scope.set("pico_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]));
        ctx.scope.set("type", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["type"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            ctx.scope.get("pico_id"),
            ctx.scope.get("name"),
            ctx.scope.get("type")
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "removeChannel", [yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["eci"])], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        ctx.scope.set("pico_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("rid", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rid"]));
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        ctx.scope.set("base", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["base"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "installRuleset", [
            ctx.scope.get("pico_id"),
            ctx.scope.get("rid"),
            ctx.scope.get("url"),
            ctx.scope.get("base")
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};