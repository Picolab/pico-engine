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
        "with": async function (ctx) {
          ctx.scope.set("configured_name", "Jim");
        }
      }
    ],
    "shares": [
      "now",
      "getEntVal",
      "dfltName"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("now", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(await ctx.modules.get(ctx, "time", "now"), ctx, []);
    }));
    ctx.scope.set("getEntVal", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "val");
    }));
    ctx.scope.set("dfltName", await ctx.applyFn(await ctx.modules.get(ctx, "my_module_dflt", "getName"), ctx, []));
  },
  "rules": {
    "dflt_name": {
      "name": "dflt_name",
      "select": {
        "graph": { "module_used": { "dflt_name": { "expr_0": true } } },
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
            "dflt_name",
            { "name": await ctx.applyFn(await ctx.modules.get(ctx, "my_module_dflt", "getName"), ctx, []) }
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
            "conf_name",
            { "name": await ctx.applyFn(await ctx.modules.get(ctx, "my_module_conf", "getName"), ctx, []) }
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
            "dflt_info",
            { "info": await ctx.applyFn(await ctx.modules.get(ctx, "my_module_dflt", "getInfo"), ctx, []) }
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
            "conf_info",
            { "info": await ctx.applyFn(await ctx.modules.get(ctx, "my_module_conf", "getInfo"), ctx, []) }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "dflt_getInfoAction": {
      "name": "dflt_getInfoAction",
      "select": {
        "graph": { "module_used": { "dflt_getInfoAction": { "expr_0": true } } },
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
          await runAction(ctx, "my_module_dflt", "getInfoAction", [], ["info"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "val", ctx.scope.get("info"));
      }
    },
    "conf_getInfoAction": {
      "name": "conf_getInfoAction",
      "select": {
        "graph": { "module_used": { "conf_getInfoAction": { "expr_0": true } } },
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
          await runAction(ctx, "my_module_conf", "getInfoAction", [], ["info"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "val", ctx.scope.get("info"));
      }
    },
    "sayHelloWithOperator": {
      "name": "sayHelloWithOperator",
      "select": {
        "graph": { "module_used": { "sayHelloWithOperator": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", [await ctx.applyFn(await ctx.modules.get(ctx, "my_module_dflt", "sayHello"), ctx, ["bob"])], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};