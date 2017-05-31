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
    ctx.scope.set("now", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, []);
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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "dflt_name",
            { "name": yield ctx.applyFn(yield ctx.modules.get(ctx, "my_module_dflt", "getName"), ctx, []) }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "conf_name",
            { "name": yield ctx.applyFn(yield ctx.modules.get(ctx, "my_module_conf", "getName"), ctx, []) }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "dflt_info",
            { "info": yield ctx.applyFn(yield ctx.modules.get(ctx, "my_module_dflt", "getInfo"), ctx, []) }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "conf_info",
            { "info": yield ctx.applyFn(yield ctx.modules.get(ctx, "my_module_conf", "getInfo"), ctx, []) }
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