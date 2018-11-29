module.exports = {
  "rid": "io.picolabs.last",
  "meta": { "name": "testing postlude `last` statement" },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["foo"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          if (await ctx.applyFn(ctx.scope.get("=="), ctx, [
              await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["stop"]),
              "foo"
            ]))
            ctx.stopRulesetExecution(ctx);
        }
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          if (await ctx.applyFn(ctx.scope.get("=="), ctx, [
              await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["stop"]),
              "bar"
            ]))
            ctx.stopRulesetExecution(ctx);
        }
      }
    },
    "baz": {
      "name": "baz",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["baz"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution(ctx);
        }
      }
    },
    "qux": {
      "name": "qux",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["qux"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};