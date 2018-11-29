module.exports = {
  "rid": "io.picolabs.http",
  "meta": {
    "shares": [
      "getResp",
      "getLastPostEvent",
      "fnGet",
      "fnPost"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("getResp", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "resp");
    }));
    ctx.scope.set("getLastPostEvent", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "last_post_event");
    }));
    ctx.scope.set("fmtResp", ctx.mkFunction(["r"], async function (ctx, args) {
      ctx.scope.set("r", args["r"]);
      return await ctx.applyFn(ctx.scope.get("delete"), ctx, [
        await ctx.applyFn(ctx.scope.get("delete"), ctx, [
          await ctx.applyFn(ctx.scope.get("delete"), ctx, [
            await ctx.applyFn(ctx.scope.get("delete"), ctx, [
              await ctx.applyFn(ctx.scope.get("set"), ctx, [
                ctx.scope.get("r"),
                "content",
                await ctx.applyFn(ctx.scope.get("decode"), ctx, [await ctx.applyFn(ctx.scope.get("get"), ctx, [
                    ctx.scope.get("r"),
                    ["content"]
                  ])])
              ]),
              ["content_length"]
            ]),
            [
              "headers",
              "content-length"
            ]
          ]),
          [
            "headers",
            "date"
          ]
        ]),
        [
          "content",
          "headers",
          "content-length"
        ]
      ]);
    }));
    ctx.scope.set("doPost", ctx.mkAction([
      "base_url",
      "to",
      "msg"
    ], async function (ctx, args, runAction) {
      ctx.scope.set("base_url", args["base_url"]);
      ctx.scope.set("to", args["to"]);
      ctx.scope.set("msg", args["msg"]);
      var fired = true;
      if (fired) {
        await runAction(ctx, "http", "post", {
          "0": await ctx.applyFn(ctx.scope.get("+"), ctx, [
            ctx.scope.get("url"),
            "/msg.json"
          ]),
          "from": {
            "To": ctx.scope.get("to"),
            "Msg": ctx.scope.get("msg")
          }
        }, []);
      }
      return [];
    }));
    ctx.scope.set("fnGet", ctx.mkFunction([
      "url",
      "qs"
    ], async function (ctx, args) {
      ctx.scope.set("url", args["url"]);
      ctx.scope.set("qs", args["qs"]);
      return await ctx.applyFn(await ctx.modules.get(ctx, "http", "get"), ctx, {
        "0": ctx.scope.get("url"),
        "qs": ctx.scope.get("qs")
      });
    }));
    ctx.scope.set("fnPost", ctx.mkFunction([
      "url",
      "json"
    ], async function (ctx, args) {
      ctx.scope.set("url", args["url"]);
      ctx.scope.set("json", args["json"]);
      return await ctx.applyFn(await ctx.modules.get(ctx, "http", "post"), ctx, {
        "0": ctx.scope.get("url"),
        "json": ctx.scope.get("json")
      });
    }));
  },
  "rules": {
    "http_get": {
      "name": "http_get",
      "select": {
        "graph": { "http_test": { "get": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, "http", "get", {
            "0": ctx.scope.get("url"),
            "qs": { "foo": "bar" },
            "headers": { "baz": "quix" }
          }, ["resp"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "resp", await ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [ctx.scope.get("resp")]));
        }
      }
    },
    "http_post": {
      "name": "http_post",
      "select": {
        "graph": { "http_test": { "post": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, "http", "post", {
            "0": ctx.scope.get("url"),
            "json": {
              "foo": "bar",
              "baz": ctx.scope.get("doPost")
            }
          }, ["resp"]);
          await runAction(ctx, void 0, "send_directive", [
            "resp.content.body",
            await ctx.applyFn(ctx.scope.get("decode"), ctx, [await ctx.applyFn(ctx.scope.get("get"), ctx, [
                await ctx.applyFn(ctx.scope.get("decode"), ctx, [await ctx.applyFn(ctx.scope.get("get"), ctx, [
                    ctx.scope.get("resp"),
                    ["content"]
                  ])]),
                ["body"]
              ])])
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "http_post_action": {
      "name": "http_post_action",
      "select": {
        "graph": { "http_test": { "post_action": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "doPost", [
            ctx.scope.get("url"),
            "bob",
            "foobar"
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "http_post_setting": {
      "name": "http_post_setting",
      "select": {
        "graph": { "http_test": { "post_setting": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, "http", "post", {
            "0": ctx.scope.get("url"),
            "qs": { "foo": "bar" },
            "form": { "baz": "qux" }
          }, ["resp"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "resp", await ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [ctx.scope.get("resp")]));
        }
      }
    },
    "http_autorase": {
      "name": "http_autorase",
      "select": {
        "graph": { "http_test": { "autoraise": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("url", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, "http", "post", {
            "0": ctx.scope.get("url"),
            "qs": { "foo": "bar" },
            "form": { "baz": "qux" },
            "autoraise": "foobar"
          }, []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "http_post_event_handler": {
      "name": "http_post_event_handler",
      "select": {
        "graph": { "http": { "post": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("resp", await ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [await ctx.modules.get(ctx, "event", "attrs")]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "http_post_event_handler",
            { "attrs": ctx.scope.get("resp") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "last_post_event", ctx.scope.get("resp"));
        }
      }
    }
  }
};