module.exports = {
  "rid": "io.picolabs.js-module",
  "meta": { "shares": ["qFn"] },
  "global": async function (ctx) {
    ctx.scope.set("qFn", ctx.mkFunction(["a"], async function (ctx, args) {
      ctx.scope.set("a", args["a"]);
      return await ctx.applyFn(await ctx.modules.get(ctx, "myJsModule", "fun0"), ctx, {
        "0": ctx.scope.get("a"),
        "b": 2
      });
    }));
  },
  "rules": {
    "action": {
      "name": "action",
      "select": {
        "graph": { "js_module": { "action": { "expr_0": true } } },
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
          await runAction(ctx, "myJsModule", "act", {
            "0": 100,
            "b": 30
          }, ["val"]);
          await runAction(ctx, void 0, "send_directive", [
            "resp",
            { "val": ctx.scope.get("val") }
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