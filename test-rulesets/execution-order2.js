module.exports = {
  "rid": "io.picolabs.execution-order2",
  "meta": { "shares": ["getOrder"] },
  "global": async function (ctx) {
    ctx.scope.set("getOrder", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "order");
    }));
  },
  "rules": {
    "reset_order": {
      "name": "reset_order",
      "select": {
        "graph": { "execution_order": { "reset_order": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["2 - reset_order"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "order", []);
      }
    },
    "foo_or_bar": {
      "name": "foo_or_bar",
      "select": {
        "graph": {
          "execution_order": {
            "foo": { "expr_0": true },
            "bar": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["2 - foo_or_bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.append(ctx, "ent", "order", ["2 - foo_or_bar"]);
      }
    },
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "execution_order": { "foo": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["2 - foo"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.append(ctx, "ent", "order", ["2 - foo"]);
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "execution_order": { "bar": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["2 - bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.append(ctx, "ent", "order", ["2 - bar"]);
      }
    }
  }
};