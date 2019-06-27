module.exports = {
  "rid": "io.picolabs.module-defined",
  "meta": {
    "provides": [
      "getInfo",
      "getName",
      "getInfoAction"
    ],
    "shares": ["getInfo"],
    "configure": async function (ctx) {
      ctx.scope.set("configured_name", "Bob");
    }
  },
  "global": async function (ctx) {
    ctx.scope.set("privateFn", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(ctx.scope.get("+"), ctx, [
        await ctx.applyFn(ctx.scope.get("+"), ctx, [
          await ctx.applyFn(ctx.scope.get("+"), ctx, [
            "privateFn = name: ",
            ctx.scope.get("configured_name")
          ]),
          " memo: "
        ]),
        await ctx.modules.get(ctx, "ent", "memo")
      ]);
    }));
    ctx.scope.set("getName", ctx.mkFunction([], async function (ctx, args) {
      return ctx.scope.get("configured_name");
    }));
    ctx.scope.set("getInfo", ctx.mkFunction([], async function (ctx, args) {
      return {
        "name": await ctx.applyFn(ctx.scope.get("getName"), ctx, []),
        "memo": await ctx.modules.get(ctx, "ent", "memo"),
        "privateFn": await ctx.applyFn(ctx.scope.get("privateFn"), ctx, [])
      };
    }));
    ctx.scope.set("getInfoAction", ctx.mkAction([], async function (ctx, args, runAction) {
      var fired = true;
      if (fired) {
        await runAction(ctx, void 0, "send_directive", [
          "getInfoAction",
          await ctx.applyFn(ctx.scope.get("getInfo"), ctx, [])
        ], []);
      }
      return [{
          "name": await ctx.applyFn(ctx.scope.get("get"), ctx, [
            await ctx.applyFn(ctx.scope.get("getInfo"), ctx, []),
            ["name"]
          ])
        }];
    }));
    ctx.scope.set("sayHello", ctx.mkFunction(["name"], async function (ctx, args) {
      ctx.scope.set("name", args["name"]);
      return "hello " + await ctx.applyFn(ctx.scope.get("as"), ctx, [
        ctx.scope.get("name"),
        "String"
      ]) + ".";
    }));
  },
  "rules": {
    "store_memo": {
      "name": "store_memo",
      "select": {
        "graph": {
          "module_defined": {
            "store_memo": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "memo"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("text", matches[0]);
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
            "store_memo",
            {
              "name": ctx.scope.get("configured_name"),
              "memo_to_store": ctx.scope.get("text")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "memo", await ctx.applyFn(ctx.scope.get("+"), ctx, [
          await ctx.applyFn(ctx.scope.get("+"), ctx, [
            await ctx.applyFn(ctx.scope.get("+"), ctx, [
              await ctx.applyFn(ctx.scope.get("+"), ctx, [
                "[\"",
                ctx.scope.get("text")
              ]),
              "\" by "
            ]),
            ctx.scope.get("configured_name")
          ]),
          "]"
        ]));
      }
    }
  }
};