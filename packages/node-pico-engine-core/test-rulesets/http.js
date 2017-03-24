module.exports = {
  "rid": "io.picolabs.http",
  "meta": { "shares": ["getResp"] },
  "global": function* (ctx) {
    ctx.scope.set("getResp", ctx.KRLClosure(ctx, function* (ctx) {
      return yield ctx.modules.get(ctx, "ent", "get_resp");
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
          ctx.scope.set("resp", yield (yield ctx.modules.get(ctx, "http", "get"))(ctx, [
            ctx.scope.get("url"),
            { "foo": "bar" },
            { "baz": "quix" }
          ]));
          yield ctx.modules.set(ctx, "ent", "get_resp", yield ctx.callKRLstdlib("delete", yield ctx.callKRLstdlib("set", ctx.scope.get("resp"), "content", yield ctx.callKRLstdlib("decode", yield ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content"]))), ["content_length"]));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};