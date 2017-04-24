module.exports = {
  "rid": "io.picolabs.meta",
  "meta": {
    "name": "testing meta module",
    "description": "\nsome description for the meta test module\n    ",
    "author": "meta author",
    "shares": ["metaQuery"]
  },
  "global": function* (ctx) {
    ctx.scope.set("metaQuery", ctx.KRLClosure(function* (ctx, getArg) {
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
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "event",
                "options": {
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
              };
            }
          }]
      }
    }
  }
};