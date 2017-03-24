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
            "params": { "foo": "bar" },
            "headers": { "baz": "quix" }
          }));
          yield ctx.modules.set(ctx, "ent", "get_resp", yield ctx.scope.get("fmtResp")(ctx, [ctx.scope.get("resp")]));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};