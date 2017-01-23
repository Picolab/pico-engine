module.exports = {
  "rid": "io.picolabs.module-defined",
  "meta": {
    "provides": [
      "getInfo",
      "getName"
    ],
    "shares": ["getInfo"],
    "configure": function (ctx) {
      ctx.scope.set("configured_name", "Bob");
    }
  },
  "global": function (ctx) {
    ctx.scope.set("privateFn", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.callKRLstdlib("+", ctx.callKRLstdlib("+", ctx.callKRLstdlib("+", "privateFn = name: ", ctx.scope.get("configured_name")), " memo: "), ctx.modules.get(ctx, "ent", "memo"));
    }));
    ctx.scope.set("getName", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.scope.get("configured_name");
    }));
    ctx.scope.set("getInfo", ctx.KRLClosure(ctx, function (ctx) {
      return {
        "name": ctx.scope.get("getName")(ctx, []),
        "memo": ctx.modules.get(ctx, "ent", "memo"),
        "privateFn": ctx.scope.get("privateFn")(ctx, [])
      };
    }));
  },
  "rules": {
    "store_memo": {
      "name": "store_memo",
      "select": {
        "graph": { "module_defined": { "store_memo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "memo",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("text", matches[0]);
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
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "store_memo",
                "options": {
                  "name": ctx.scope.get("configured_name"),
                  "memo_to_store": ctx.scope.get("text")
                }
              };
            }
          }]
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function (ctx) {
          ctx.modules.set(ctx, "ent", "memo", ctx.callKRLstdlib("+", ctx.callKRLstdlib("+", ctx.callKRLstdlib("+", ctx.callKRLstdlib("+", "[\"", ctx.scope.get("text")), "\" by "), ctx.scope.get("configured_name")), "]"));
        }
      }
    }
  }
};