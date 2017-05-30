module.exports = {
  "rid": "io.picolabs.module-defined",
  "meta": {
    "provides": [
      "getInfo",
      "getName"
    ],
    "shares": ["getInfo"],
    "configure": function* (ctx) {
      ctx.scope.set("configured_name", "Bob");
    }
  },
  "global": function* (ctx) {
    ctx.scope.set("privateFn", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            "privateFn = name: ",
            ctx.scope.get("configured_name")
          ]),
          " memo: "
        ]),
        yield ctx.modules.get(ctx, "ent", "memo")
      ]);
    }));
    ctx.scope.set("getName", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return ctx.scope.get("configured_name");
    }));
    ctx.scope.set("getInfo", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return {
        "name": yield ctx.applyFn(ctx.scope.get("getName"), ctx, []),
        "memo": yield ctx.modules.get(ctx, "ent", "memo"),
        "privateFn": yield ctx.applyFn(ctx.scope.get("privateFn"), ctx, [])
      };
    }));
  },
  "rules": {
    "store_memo": {
      "name": "store_memo",
      "select": {
        "graph": { "module_defined": { "store_memo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "store_memo",
                {
                  "name": ctx.scope.get("configured_name"),
                  "memo_to_store": ctx.scope.get("text")
                }
              ], []);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "memo", yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            yield ctx.callKRLstdlib("+", [
              yield ctx.callKRLstdlib("+", [
                "[\"",
                ctx.scope.get("text")
              ]),
              "\" by "
            ]),
            ctx.scope.get("configured_name")
          ]),
          "]"
        ]));
      }
    }
  }
};