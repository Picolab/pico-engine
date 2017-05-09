module.exports = {
  "rid": "io.picolabs.schedule",
  "meta": {
    "shares": [
      "getLog",
      "rmScheduled",
      "listScheduled"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getLog", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "ent", "log");
    }));
    ctx.scope.set("listScheduled", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "schedule", "list"))(ctx, []);
    }));
    ctx.scope.set("rmScheduled", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("id", getArg("id", 0));
      return yield (yield ctx.modules.get(ctx, "schedule", "remove"))(ctx, [ctx.scope.get("id")]);
    }));
  },
  "rules": {
    "clear_log": {
      "name": "clear_log",
      "select": {
        "graph": { "schedule": { "clear_log": { "expr_0": true } } },
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
                "name": "clear_log",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "log", []);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "push_log": {
      "name": "push_log",
      "select": {
        "graph": { "schedule": { "push_log": { "expr_0": true } } },
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
                "name": "push_log",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "log", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "log"), yield (yield ctx.modules.get(ctx, "event", "attrs"))(ctx, [])));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "in_5min": {
      "name": "in_5min",
      "select": {
        "graph": { "schedule": { "in_5min": { "expr_0": true } } },
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
                "name": "in_5min",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          ctx.scope.set("foo", yield (yield ctx.modules.get(ctx, "schedule", "event"))(ctx, {
            "domain": "schedule",
            "type": "push_log",
            "attributes": {
              "from": "in_5min",
              "name": yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["name"])
            },
            "at": yield (yield ctx.modules.get(ctx, "time", "add"))(ctx, [
              yield (yield ctx.modules.get(ctx, "time", "now"))(ctx, []),
              { "minutes": 5 }
            ])
          }));
          yield ctx.modules.set(ctx, "ent", "log", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "log"), { "scheduled in_5min": ctx.scope.get("foo") }));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "every_1min": {
      "name": "every_1min",
      "select": {
        "graph": { "schedule": { "every_1min": { "expr_0": true } } },
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
                "name": "every_1min",
                "options": {}
              };
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          ctx.scope.set("foo", yield (yield ctx.modules.get(ctx, "schedule", "event"))(ctx, {
            "domain": "schedule",
            "type": "push_log",
            "attributes": {
              "from": "every_1min",
              "name": yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["name"])
            },
            "timespec": "* */1 * * * *"
          }));
          yield ctx.modules.set(ctx, "ent", "log", yield ctx.callKRLstdlib("append", yield ctx.modules.get(ctx, "ent", "log"), { "scheduled every_1min": ctx.scope.get("foo") }));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};