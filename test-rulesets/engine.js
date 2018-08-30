module.exports = {
  "rid": "io.picolabs.engine",
  "rules": {
    "newPico": {
      "name": "newPico",
      "select": {
        "graph": { "engine": { "newPico": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, "engine", "newPico", [], []);
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("pico_id", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("name", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]));
        ctx.scope.set("type", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["type"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, "engine", "newChannel", [
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, "engine", "removeChannel", [await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["eci"])], []);
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("pico_id", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["pico_id"]));
        ctx.scope.set("rid", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["rid"]));
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        ctx.scope.set("base", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["base"]));
        ctx.scope.set("rid_provided", !!ctx.scope.get("rid") ? "True" : "False");
        var fired = true;
        if (fired) {
          switch (ctx.scope.get("rid_provided")) {
          case "True":
            await runAction(ctx, "engine", "installRuleset", [
              ctx.scope.get("pico_id"),
              ctx.scope.get("rid")
            ], []);
            break;
          case "False":
            await runAction(ctx, "engine", "installRuleset", {
              "0": ctx.scope.get("pico_id"),
              "url": ctx.scope.get("url"),
              "base": ctx.scope.get("base")
            }, []);
            break;
          }
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};