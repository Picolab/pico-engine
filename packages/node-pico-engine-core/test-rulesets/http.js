module.exports = {
  "rid": "io.picolabs.http",
  "meta": { "shares": ["getResp"] },
  "global": function* (ctx) {
    ctx.scope.set("getResp", ctx.KRLClosure(ctx, function* (ctx) {
      return yield ctx.modules.get(ctx, "ent", "get_resp");
    }));
    ctx.scope.set("fmtResp", ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("r", ctx.getArg(ctx.args, "r", 0));
      return yield ctx.callKRLstdlib("delete", yield ctx.callKRLstdlib("set", ctx.scope.get("r"), "content", yield ctx.callKRLstdlib("decode", yield ctx.callKRLstdlib("get", ctx.scope.get("r"), ["content"]))), ["content_length"]);
    }));
    ctx.scope.set("doPost", ctx.KRLClosure(ctx, function* (ctx) {
      ctx.scope.set("base_url", ctx.getArg(ctx.args, "base_url", 0));
      ctx.scope.set("to", ctx.getArg(ctx.args, "to", 1));
      ctx.scope.set("msg", ctx.getArg(ctx.args, "msg", 2));
      var actions = [{
          "action": function* (ctx) {
            return yield (yield ctx.modules.get(ctx, "http", "post"))(ctx, {
              "0": yield ctx.callKRLstdlib("+", ctx.scope.get("url"), "/msg.json"),
              "body": {
                "To": ctx.scope.get("to"),
                "Msg": ctx.scope.get("msg")
              }
            });
          }
        }];
      var r = [];
      var i;
      for (i = 0; i < actions.length; i++)
        r.push(yield actions[i].action(ctx));
      return r;
    }));
  },
  "rules": {
    "http_get": {
      "name": "http_get",
      "select": {
        "graph": { "http": { "get": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
      "prelude": function* (ctx) {
        ctx.scope.set("url", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["url"]));
      },
      "postlude": {
        "fired": function* (ctx) {
          ctx.scope.set("resp", yield (yield ctx.modules.get(ctx, "http", "get"))(ctx, {
            "0": ctx.scope.get("url"),
            "qs": { "foo": "bar" },
            "headers": { "baz": "quix" }
          }));
          yield ctx.modules.set(ctx, "ent", "get_resp", yield ctx.scope.get("fmtResp")(ctx, [ctx.scope.get("resp")]));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "http_post": {
      "name": "http_post",
      "select": {
        "graph": { "http": { "post": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
      "prelude": function* (ctx) {
        ctx.scope.set("url", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["url"]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return yield (yield ctx.modules.get(ctx, "http", "post"))(ctx, {
                "0": ctx.scope.get("url"),
                "body": { "foo": "bar" }
              });
            }
          }]
      }
    },
    "http_post_action": {
      "name": "http_post_action",
      "select": {
        "graph": { "http": { "post_action": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
      "prelude": function* (ctx) {
        ctx.scope.set("url", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["url"]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return yield ctx.scope.get("doPost")(ctx, {
                "0": ctx.scope.get("url"),
                "to": "bob",
                "msg": "foobar"
              });
            }
          }]
      }
    }
  }
};