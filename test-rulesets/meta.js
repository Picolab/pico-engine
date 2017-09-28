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
        "rid": yield ctx.modules.get(ctx, "meta", "rid", undefined),
        "host": yield ctx.modules.get(ctx, "meta", "host", undefined),
        "rulesetName": yield ctx.modules.get(ctx, "meta", "rulesetName", undefined),
        "rulesetDescription": yield ctx.modules.get(ctx, "meta", "rulesetDescription", undefined),
        "rulesetAuthor": yield ctx.modules.get(ctx, "meta", "rulesetAuthor", undefined),
        "rulesetURI": yield ctx.modules.get(ctx, "meta", "rulesetURI", undefined),
        "ruleName": yield ctx.modules.get(ctx, "meta", "ruleName", undefined),
        "inEvent": yield ctx.modules.get(ctx, "meta", "inEvent", undefined),
        "inQuery": yield ctx.modules.get(ctx, "meta", "inQuery", undefined),
        "eci": yield ctx.modules.get(ctx, "meta", "eci", undefined)
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
              "rid": yield ctx.modules.get(ctx, "meta", "rid", undefined),
              "host": yield ctx.modules.get(ctx, "meta", "host", undefined),
              "rulesetName": yield ctx.modules.get(ctx, "meta", "rulesetName", undefined),
              "rulesetDescription": yield ctx.modules.get(ctx, "meta", "rulesetDescription", undefined),
              "rulesetAuthor": yield ctx.modules.get(ctx, "meta", "rulesetAuthor", undefined),
              "rulesetURI": yield ctx.modules.get(ctx, "meta", "rulesetURI", undefined),
              "ruleName": yield ctx.modules.get(ctx, "meta", "ruleName", undefined),
              "inEvent": yield ctx.modules.get(ctx, "meta", "inEvent", undefined),
              "inQuery": yield ctx.modules.get(ctx, "meta", "inQuery", undefined),
              "eci": yield ctx.modules.get(ctx, "meta", "eci", undefined)
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