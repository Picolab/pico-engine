module.exports = {
  "rid": "io.picolabs.meta",
  "meta": {
    "name": "testing meta module",
    "description": "\nsome description for the meta test module\n        ",
    "author": "meta author",
    "shares": ["metaQuery"]
  },
  "global": async function (ctx) {
    ctx.scope.set("metaQuery", ctx.mkFunction([], async function (ctx, args) {
      return {
        "rid": await ctx.modules.get(ctx, "meta", "rid"),
        "host": await ctx.modules.get(ctx, "meta", "host"),
        "rulesetName": await ctx.modules.get(ctx, "meta", "rulesetName"),
        "rulesetDescription": await ctx.modules.get(ctx, "meta", "rulesetDescription"),
        "rulesetAuthor": await ctx.modules.get(ctx, "meta", "rulesetAuthor"),
        "rulesetURI": await ctx.modules.get(ctx, "meta", "rulesetURI"),
        "ruleName": await ctx.modules.get(ctx, "meta", "ruleName"),
        "inEvent": await ctx.modules.get(ctx, "meta", "inEvent"),
        "inQuery": await ctx.modules.get(ctx, "meta", "inQuery"),
        "eci": await ctx.modules.get(ctx, "meta", "eci")
      };
    }));
  },
  "rules": {
    "meta_event": {
      "name": "meta_event",
      "select": {
        "graph": { "meta": { "event": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", [
            "event",
            {
              "rid": await ctx.modules.get(ctx, "meta", "rid"),
              "host": await ctx.modules.get(ctx, "meta", "host"),
              "rulesetName": await ctx.modules.get(ctx, "meta", "rulesetName"),
              "rulesetDescription": await ctx.modules.get(ctx, "meta", "rulesetDescription"),
              "rulesetAuthor": await ctx.modules.get(ctx, "meta", "rulesetAuthor"),
              "rulesetURI": await ctx.modules.get(ctx, "meta", "rulesetURI"),
              "ruleName": await ctx.modules.get(ctx, "meta", "ruleName"),
              "inEvent": await ctx.modules.get(ctx, "meta", "inEvent"),
              "inQuery": await ctx.modules.get(ctx, "meta", "inQuery"),
              "eci": await ctx.modules.get(ctx, "meta", "eci")
            }
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