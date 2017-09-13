module.exports = {
  "rid": "io.picolabs.js-module",
  "meta": { "shares": ["qFn"] },
  "global": function* (ctx) {
    ctx.scope.set("qFn", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("a", getArg("a", 0));
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "myJsModule", "fun0"), ctx, {
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
          yield runAction(ctx, "myJsModule", "act", {
            "0": 100,
            "b": 30
          }, ["val"]);
          yield runAction(ctx, void 0, "send_directive", [
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