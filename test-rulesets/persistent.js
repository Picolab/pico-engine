module.exports = {
  "rid": "io.picolabs.persistent",
  "meta": {
    "shares": [
      "getName",
      "getAppVar",
      "getUser",
      "getUserFirstname"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getName", ctx.mkFunction(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "name", undefined);
    }));
    ctx.scope.set("getAppVar", ctx.mkFunction(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "app", "appvar", undefined);
    }));
    ctx.scope.set("getUser", ctx.mkFunction(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "user", undefined);
    }));
    ctx.scope.set("getUserFirstname", ctx.mkFunction(function* (ctx, getArg, hasArg) {
      return yield ctx.callKRLstdlib("get", [
        yield ctx.modules.get(ctx, "ent", "user", undefined),
        ["firstname"]
      ]);
    }));
  },
  "rules": {
    "store_my_name": {
      "name": "store_my_name",
      "select": {
        "graph": { "store": { "name": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches", undefined), ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
            "store_name",
            { "name": ctx.scope.get("my_name") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "name", undefined, ctx.scope.get("my_name"));
      }
    },
    "store_appvar": {
      "name": "store_appvar",
      "select": {
        "graph": { "store": { "appvar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches", undefined), ctx, [[[
                  "appvar",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_appvar", matches[0]);
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
            "store_appvar",
            { "appvar": ctx.scope.get("my_appvar") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "app", "appvar", undefined, ctx.scope.get("my_appvar"));
      }
    },
    "store_user_firstname": {
      "name": "store_user_firstname",
      "select": {
        "graph": { "store": { "user_firstname": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches", undefined), ctx, [[[
                  "firstname",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("firstname", matches[0]);
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
            "store_user_firstname",
            { "name": ctx.scope.get("firstname") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "user", undefined, { "lastname": "McCoy" });
        yield ctx.modules.set(ctx, "ent", "user", ["firstname"], ctx.scope.get("firstname"));
      }
    },
    "clear_user": {
      "name": "clear_user",
      "select": {
        "graph": { "store": { "clear_user": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["clear_user"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "ent", "user", undefined);
      }
    },
    "clear_appvar": {
      "name": "clear_appvar",
      "select": {
        "graph": { "store": { "clear_appvar": { "expr_0": true } } },
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
          yield runAction(ctx, void 0, "send_directive", ["clear_appvar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "app", "appvar", undefined);
      }
    }
  }
};