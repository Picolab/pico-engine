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
  "global": async function (ctx) {
    ctx.scope.set("getName", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "name");
    }));
    ctx.scope.set("getAppVar", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "app", "appvar");
    }));
    ctx.scope.set("getUser", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "user");
    }));
    ctx.scope.set("getUserFirstname", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", {
        "key": "user",
        "path": ["firstname"]
      });
    }));
  },
  "rules": {
    "store_my_name": {
      "name": "store_my_name",
      "select": {
        "graph": {
          "store": {
            "name": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "store_name",
            { "name": ctx.scope.get("my_name") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "name", ctx.scope.get("my_name"));
      }
    },
    "store_appvar": {
      "name": "store_appvar",
      "select": {
        "graph": {
          "store": {
            "appvar": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "appvar"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_appvar", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "store_appvar",
            { "appvar": ctx.scope.get("my_appvar") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "app", "appvar", ctx.scope.get("my_appvar"));
      }
    },
    "store_user_firstname": {
      "name": "store_user_firstname",
      "select": {
        "graph": {
          "store": {
            "user_firstname": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "firstname"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("firstname", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "store_user_firstname",
            { "name": ctx.scope.get("firstname") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "user", { "lastname": "McCoy" });
        await ctx.modules.set(ctx, "ent", {
          "key": "user",
          "path": ["firstname"]
        }, ctx.scope.get("firstname"));
      }
    },
    "clear_user": {
      "name": "clear_user",
      "select": {
        "graph": { "store": { "clear_user": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["clear_user"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.del(ctx, "ent", "user");
      }
    },
    "clear_appvar": {
      "name": "clear_appvar",
      "select": {
        "graph": { "store": { "clear_appvar": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["clear_appvar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.del(ctx, "app", "appvar");
      }
    }
  }
};