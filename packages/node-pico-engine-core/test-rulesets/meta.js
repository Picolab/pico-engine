module.exports = {
  "rid": "io.picolabs.meta",
  "meta": {
    "name": "testing meta module",
    "shares": [
      "eci",
      "rulesetURI",
      "host"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("eci", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "meta", "eci");
    }));
    ctx.scope.set("rulesetURI", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "meta", "rulesetURI");
    }));
    ctx.scope.set("host", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "meta", "host");
    }));
  },
  "rules": {
    "meta_eci": {
      "name": "meta_eci",
      "select": {
        "graph": { "meta": { "eci": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
                "name": "eci",
                "options": { "eci": yield ctx.modules.get(ctx, "meta", "eci") }
              };
            }
          }]
      }
    },
    "meta_rulesetURI": {
      "name": "meta_rulesetURI",
      "select": {
        "graph": { "meta": { "rulesetURI": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
                "name": "rulesetURI",
                "options": { "rulesetURI": yield ctx.modules.get(ctx, "meta", "rulesetURI") }
              };
            }
          }]
      }
    }
  }
};