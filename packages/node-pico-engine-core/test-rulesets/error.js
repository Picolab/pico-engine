module.exports = {
  "rid": "io.picolabs.error",
  "meta": { "shares": ["getErrors"] },
  "global": function* (ctx) {
    ctx.scope.set("getErrors", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "ent", "error_log");
    }));
  },
  "rules": {
    "error_handle": {
      "name": "error_handle",
      "select": {
        "graph": { "system": { "error": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "error_log", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "error_log"), yield (yield ctx.modules.get(ctx, "event", "attrs"))(ctx, [])));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "basic": {
      "name": "basic",
      "select": {
        "graph": { "error": { "basic": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.raiseError(ctx, "info", "some info error");
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};
