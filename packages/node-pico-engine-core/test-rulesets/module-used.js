module.exports = {
  "rid": "io.picolabs.module-used",
  "meta": {
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_dflt"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_conf",
        "with": function* (ctx) {
          ctx.scope.set("configured_name", "Jim");
        }
      }
    ],
    "shares": ["now"]
  },
  "global": function* (ctx) {
    ctx.scope.set("now", ctx.KRLClosure(function* (ctx, getArg) {
      return yield (yield ctx.modules.get(ctx, "time", "now"))(ctx, []);
    }));
  },
  "rules": {
    "dflt_name": {
      "name": "dflt_name",
      "select": {
        "graph": { "module_used": { "dflt_name": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "dflt_name",
                "name": yield (yield ctx.modules.get(ctx, "my_module_dflt", "getName"))(ctx, [])
              });
            }
          }]
      }
    },
    "conf_name": {
      "name": "conf_name",
      "select": {
        "graph": { "module_used": { "conf_name": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "conf_name",
                "name": yield (yield ctx.modules.get(ctx, "my_module_conf", "getName"))(ctx, [])
              });
            }
          }]
      }
    },
    "dflt_info": {
      "name": "dflt_info",
      "select": {
        "graph": { "module_used": { "dflt_info": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "dflt_info",
                "info": yield (yield ctx.modules.get(ctx, "my_module_dflt", "getInfo"))(ctx, [])
              });
            }
          }]
      }
    },
    "conf_info": {
      "name": "conf_info",
      "select": {
        "graph": { "module_used": { "conf_info": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "conf_info",
                "info": yield (yield ctx.modules.get(ctx, "my_module_conf", "getInfo"))(ctx, [])
              });
            }
          }]
      }
    }
  }
};