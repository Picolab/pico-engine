module.exports = {
  "rid": "io.picolabs.error",
  "meta": { "shares": ["getErrors"] },
  "global": async function (ctx) {
    ctx.scope.set("getErrors", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "error_log");
    }));
  },
  "rules": {
    "error_handle": {
      "name": "error_handle",
      "select": {
        "graph": { "system": { "error": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.append(ctx, "ent", "error_log", [await ctx.modules.get(ctx, "event", "attrs")]);
        }
      }
    },
    "continue_on_errorA": {
      "name": "continue_on_errorA",
      "select": {
        "graph": { "error": { "continue_on_error": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["continue_on_errorA"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.raiseError(ctx, "debug", "continue_on_errorA debug");
        await ctx.raiseError(ctx, "info", "continue_on_errorA info");
        await ctx.raiseError(ctx, "warn", "continue_on_errorA warn");
      }
    },
    "continue_on_errorB": {
      "name": "continue_on_errorB",
      "select": {
        "graph": { "error": { "continue_on_error": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["continue_on_errorB"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.raiseError(ctx, "debug", "continue_on_errorB debug");
        await ctx.raiseError(ctx, "info", "continue_on_errorB info");
        await ctx.raiseError(ctx, "warn", "continue_on_errorB warn");
      }
    },
    "stop_on_errorA": {
      "name": "stop_on_errorA",
      "select": {
        "graph": { "error": { "stop_on_error": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["stop_on_errorA"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        return await ctx.raiseError(ctx, "error", "stop_on_errorA 1");
        return await ctx.raiseError(ctx, "error", "stop_on_errorA 2 this should not fire b/c the first error stops execution");
      }
    },
    "stop_on_errorB": {
      "name": "stop_on_errorB",
      "select": {
        "graph": { "error": { "stop_on_error": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["stop_on_errorB"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        return await ctx.raiseError(ctx, "error", "stop_on_errorB 3 this should not fire b/c the first error clears the schedule");
      }
    }
  }
};