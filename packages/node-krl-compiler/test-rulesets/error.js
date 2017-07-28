module.exports = {
  "rid": "io.picolabs.error",
  "meta": { "shares": ["getErrors"] },
  "global": function* (ctx) {
    ctx.scope.set("getErrors", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "error_log", yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "error_log"),
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, [])
          ]));
        }
      }
    },
    "continue_on_errorA": {
      "name": "continue_on_errorA",
      "select": {
        "graph": { "error": { "continue_on_error": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["continue_on_errorA"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.raiseError(ctx, "debug", "continue_on_errorA debug");
        yield ctx.raiseError(ctx, "info", "continue_on_errorA info");
        yield ctx.raiseError(ctx, "warn", "continue_on_errorA warn");
      }
    },
    "continue_on_errorB": {
      "name": "continue_on_errorB",
      "select": {
        "graph": { "error": { "continue_on_error": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["continue_on_errorB"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.raiseError(ctx, "debug", "continue_on_errorB debug");
        yield ctx.raiseError(ctx, "info", "continue_on_errorB info");
        yield ctx.raiseError(ctx, "warn", "continue_on_errorB warn");
      }
    },
    "stop_on_errorA": {
      "name": "stop_on_errorA",
      "select": {
        "graph": { "error": { "stop_on_error": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["stop_on_errorA"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        return yield ctx.raiseError(ctx, "error", "stop_on_errorA 1");
        return yield ctx.raiseError(ctx, "error", "stop_on_errorA 2 this should not fire b/c the first error stops execution");
      }
    },
    "stop_on_errorB": {
      "name": "stop_on_errorB",
      "select": {
        "graph": { "error": { "stop_on_error": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["stop_on_errorB"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        return yield ctx.raiseError(ctx, "error", "stop_on_errorB 3 this should not fire b/c the first error clears the schedule");
      }
    }
  }
};