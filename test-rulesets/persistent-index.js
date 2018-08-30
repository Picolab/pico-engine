module.exports = {
  "rid": "io.picolabs.persistent-index",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey",
      "getBar",
      "getBarKey",
      "getBaz",
      "getMaplist"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("getFoo", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "foo");
    }));
    ctx.scope.set("getFooKey", ctx.mkFunction(["key"], async function (ctx, args) {
      ctx.scope.set("key", args["key"]);
      return await ctx.modules.get(ctx, "ent", {
        "key": "foo",
        "path": ctx.scope.get("key")
      });
    }));
    ctx.scope.set("getBar", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "app", "bar");
    }));
    ctx.scope.set("getBarKey", ctx.mkFunction(["key"], async function (ctx, args) {
      ctx.scope.set("key", args["key"]);
      return await ctx.modules.get(ctx, "app", {
        "key": "bar",
        "path": ctx.scope.get("key")
      });
    }));
    ctx.scope.set("getBaz", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "baz");
    }));
    ctx.scope.set("getMaplist", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "maplist");
    }));
  },
  "rules": {
    "setfoo": {
      "name": "setfoo",
      "select": {
        "graph": { "pindex": { "setfoo": { "expr_0": true } } },
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
        await ctx.modules.set(ctx, "ent", "foo", await ctx.modules.get(ctx, "event", "attrs"));
      }
    },
    "putfoo": {
      "name": "putfoo",
      "select": {
        "graph": { "pindex": { "putfoo": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("key", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        ctx.scope.set("value", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["value"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", {
          "key": "foo",
          "path": ctx.scope.get("key")
        }, ctx.scope.get("value"));
      }
    },
    "delfoo": {
      "name": "delfoo",
      "select": {
        "graph": { "pindex": { "delfoo": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("key", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.del(ctx, "ent", {
          "key": "foo",
          "path": ctx.scope.get("key")
        });
      }
    },
    "nukefoo": {
      "name": "nukefoo",
      "select": {
        "graph": { "pindex": { "nukefoo": { "expr_0": true } } },
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
        await ctx.modules.del(ctx, "ent", "foo");
      }
    },
    "setbar": {
      "name": "setbar",
      "select": {
        "graph": { "pindex": { "setbar": { "expr_0": true } } },
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
        await ctx.modules.set(ctx, "app", "bar", await ctx.modules.get(ctx, "event", "attrs"));
      }
    },
    "putbar": {
      "name": "putbar",
      "select": {
        "graph": { "pindex": { "putbar": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("key", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        ctx.scope.set("value", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["value"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "app", {
          "key": "bar",
          "path": ctx.scope.get("key")
        }, ctx.scope.get("value"));
      }
    },
    "delbar": {
      "name": "delbar",
      "select": {
        "graph": { "pindex": { "delbar": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("key", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.del(ctx, "app", {
          "key": "bar",
          "path": ctx.scope.get("key")
        });
      }
    },
    "nukebar": {
      "name": "nukebar",
      "select": {
        "graph": { "pindex": { "nukebar": { "expr_0": true } } },
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
        await ctx.modules.del(ctx, "app", "bar");
      }
    },
    "putbaz": {
      "name": "putbaz",
      "select": {
        "graph": { "pindex": { "putbaz": { "expr_0": true } } },
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
        await ctx.modules.set(ctx, "ent", {
          "key": "baz",
          "path": [
            "one",
            "two"
          ]
        }, "three");
      }
    },
    "setmaplist": {
      "name": "setmaplist",
      "select": {
        "graph": { "pindex": { "setmaplist": { "expr_0": true } } },
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
        await ctx.modules.set(ctx, "ent", "maplist", [
          { "id": "one" },
          { "id": "two" },
          { "id": "three" }
        ]);
      }
    },
    "putmaplist": {
      "name": "putmaplist",
      "select": {
        "graph": { "pindex": { "putmaplist": { "expr_0": true } } },
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
        await ctx.modules.set(ctx, "ent", {
          "key": "maplist",
          "path": [
            1,
            "other"
          ]
        }, "thing");
      }
    }
  }
};