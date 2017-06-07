module.exports = {
  "rid": "io.picolabs.meta",
  "meta": {
    "name": "testing meta module",
    "description": "\nsome description for the meta test module\n        ",
    "author": "meta author",
    "shares": ["metaQuery"]
  },
  "global": function* (ctx) {
    ctx.scope.set("metaQuery", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return {
        "rid": yield ctx.modules.get(ctx, "meta", "rid"),
        "host": yield ctx.modules.get(ctx, "meta", "host"),
        "rulesetName": yield ctx.modules.get(ctx, "meta", "rulesetName"),
        "rulesetDescription": yield ctx.modules.get(ctx, "meta", "rulesetDescription"),
        "rulesetAuthor": yield ctx.modules.get(ctx, "meta", "rulesetAuthor"),
        "rulesetURI": yield ctx.modules.get(ctx, "meta", "rulesetURI"),
        "ruleName": yield ctx.modules.get(ctx, "meta", "ruleName"),
        "inEvent": yield ctx.modules.get(ctx, "meta", "inEvent"),
        "inQuery": yield ctx.modules.get(ctx, "meta", "inQuery"),
        "eci": yield ctx.modules.get(ctx, "meta", "eci")
      };
    }));
  },
  "rules": {
    "meta_event": {
      "name": "meta_event",
      "select": {
        "graph": { "meta": { "event": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "event",
            {
              "rid": yield ctx.modules.get(ctx, "meta", "rid"),
              "host": yield ctx.modules.get(ctx, "meta", "host"),
              "rulesetName": yield ctx.modules.get(ctx, "meta", "rulesetName"),
              "rulesetDescription": yield ctx.modules.get(ctx, "meta", "rulesetDescription"),
              "rulesetAuthor": yield ctx.modules.get(ctx, "meta", "rulesetAuthor"),
              "rulesetURI": yield ctx.modules.get(ctx, "meta", "rulesetURI"),
              "ruleName": yield ctx.modules.get(ctx, "meta", "ruleName"),
              "inEvent": yield ctx.modules.get(ctx, "meta", "inEvent"),
              "inQuery": yield ctx.modules.get(ctx, "meta", "inQuery"),
              "eci": yield ctx.modules.get(ctx, "meta", "eci")
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