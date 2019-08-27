module.exports = {
  "rid": "io.picolabs.schedule",
  "meta": {
    "shares": [
      "getLog",
      "listScheduled"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("getLog", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "log");
    }));
    ctx.scope.set("listScheduled", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(await ctx.modules.get(ctx, "schedule", "list"), ctx, []);
    }));
  },
  "rules": {
    "clear_log": {
      "name": "clear_log",
      "select": {
        "graph": { "schedule": { "clear_log": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["clear_log"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "log", []);
        }
      }
    },
    "push_log": {
      "name": "push_log",
      "select": {
        "graph": { "schedule": { "push_log": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["push_log"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.append(ctx, "ent", "log", [await ctx.modules.get(ctx, "event", "attrs")]);
        }
      }
    },
    "in_5min": {
      "name": "in_5min",
      "select": {
        "graph": { "schedule": { "in_5min": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["in_5min"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("foo", await ctx.scheduleEvent({
            "attributes": {
              "from": "in_5min",
              "name": await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["name"])
            },
            "domain": "schedule",
            "type": "push_log",
            "at": await ctx.applyFn(await ctx.modules.get(ctx, "time", "add"), ctx, [
              await ctx.applyFn(await ctx.modules.get(ctx, "time", "now"), ctx, []),
              { "minutes": 5 }
            ])
          }));
          await ctx.modules.append(ctx, "ent", "log", [{ "scheduled in_5min": ctx.scope.get("foo") }]);
        }
      }
    },
    "every_1min": {
      "name": "every_1min",
      "select": {
        "graph": { "schedule": { "every_1min": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", ["every_1min"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("foo", await ctx.scheduleEvent({
            "attributes": {
              "from": "every_1min",
              "name": await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["name"])
            },
            "domain": "schedule",
            "type": "push_log",
            "timespec": "* */1 * * * *"
          }));
          await ctx.modules.append(ctx, "ent", "log", [{ "scheduled every_1min": ctx.scope.get("foo") }]);
        }
      }
    },
    "rm_from_schedule": {
      "name": "rm_from_schedule",
      "select": {
        "graph": { "schedule": { "rm_from_schedule": { "expr_0": true } } },
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
          await runAction(ctx, "schedule", "remove", [await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["id"])], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "dynamic_at": {
      "name": "dynamic_at",
      "select": {
        "graph": { "schedule": { "dynamic_at": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("foo", await ctx.scheduleEvent({
            "attributes": {
              "from": "dynamic_at",
              "name": await ctx.applyFn(ctx.scope.get("get"), ctx, [
                await ctx.modules.get(ctx, "event", "attrs"),
                "name"
              ])
            },
            "domainAndType": await ctx.applyFn(ctx.scope.get("get"), ctx, [
              await ctx.modules.get(ctx, "event", "attrs"),
              "dn"
            ]),
            "at": await ctx.applyFn(ctx.scope.get("get"), ctx, [
              await ctx.modules.get(ctx, "event", "attrs"),
              "at"
            ])
          }));
          await ctx.modules.append(ctx, "ent", "log", [{ "scheduled dynamic_at": ctx.scope.get("foo") }]);
        }
      }
    },
    "dynamic_repeat": {
      "name": "dynamic_repeat",
      "select": {
        "graph": { "schedule": { "dynamic_repeat": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("foo", await ctx.scheduleEvent({
            "attributes": {
              "from": "dynamic_repeat",
              "name": await ctx.applyFn(ctx.scope.get("get"), ctx, [
                await ctx.modules.get(ctx, "event", "attrs"),
                "name"
              ])
            },
            "domainAndType": await ctx.applyFn(ctx.scope.get("get"), ctx, [
              await ctx.modules.get(ctx, "event", "attrs"),
              "dn"
            ]),
            "timespec": await ctx.applyFn(ctx.scope.get("get"), ctx, [
              await ctx.modules.get(ctx, "event", "attrs"),
              "timespec"
            ])
          }));
          await ctx.modules.append(ctx, "ent", "log", [{ "scheduled dynamic_repeat": ctx.scope.get("foo") }]);
        }
      }
    }
  }
};