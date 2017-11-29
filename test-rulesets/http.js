module.exports = {
  "rid": "io.picolabs.http",
  "meta": {
    "shares": [
      "getResp",
      "getLastPostEvent"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getResp", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "resp");
    }));
    ctx.scope.set("getLastPostEvent", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "last_post_event");
    }));
    ctx.scope.set("fmtResp", ctx.mkFunction(["r"], function* (ctx, args) {
      ctx.scope.set("r", args["r"]);
      return yield ctx.callKRLstdlib("delete", [
        yield ctx.callKRLstdlib("delete", [
          yield ctx.callKRLstdlib("delete", [
            yield ctx.callKRLstdlib("delete", [
              yield ctx.callKRLstdlib("set", [
                ctx.scope.get("r"),
                "content",
                yield ctx.callKRLstdlib("decode", [yield ctx.callKRLstdlib("get", [
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
    ], function* (ctx, args, runAction) {
      ctx.scope.set("base_url", args["base_url"]);
      ctx.scope.set("to", args["to"]);
      ctx.scope.set("msg", args["msg"]);
      var fired = true;
      if (fired) {
        yield runAction(ctx, "http", "post", {
          "0": yield ctx.callKRLstdlib("+", [
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
  },
  "rules": {
    "http_get": {
      "name": "http_get",
      "select": {
        "graph": { "http_test": { "get": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("resp", yield ctx.applyFn(yield ctx.modules.get(ctx, "http", "get"), ctx, {
            "0": ctx.scope.get("url"),
            "qs": { "foo": "bar" },
            "headers": { "baz": "quix" }
          }));
          yield ctx.modules.set(ctx, "ent", "resp", yield ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [ctx.scope.get("resp")]));
        }
      }
    },
    "http_post": {
      "name": "http_post",
      "select": {
        "graph": { "http_test": { "post": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "http", "post", {
            "0": ctx.scope.get("url"),
            "json": {
              "foo": "bar",
              "baz": ctx.scope.get("doPost")
            }
          }, ["resp"]);
          yield runAction(ctx, void 0, "send_directive", [
            "resp.content.body",
            yield ctx.callKRLstdlib("decode", [yield ctx.callKRLstdlib("get", [
                yield ctx.callKRLstdlib("decode", [yield ctx.callKRLstdlib("get", [
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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "doPost", [
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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "http", "post", {
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
          yield ctx.modules.set(ctx, "ent", "resp", yield ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [ctx.scope.get("resp")]));
        }
      }
    },
    "http_autorase": {
      "name": "http_autorase",
      "select": {
        "graph": { "http_test": { "autoraise": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("url", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["url"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "http", "post", {
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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("resp", yield ctx.applyFn(ctx.scope.get("fmtResp"), ctx, [yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, [])]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "http_post_event_handler",
            { "attrs": ctx.scope.get("resp") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "last_post_event", ctx.scope.get("resp"));
        }
      }
    }
  }
};