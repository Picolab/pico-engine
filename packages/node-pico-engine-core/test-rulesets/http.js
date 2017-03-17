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
      "postlude": {
        "fired": function* (ctx) {
          ctx.scope.set("resp", yield (yield ctx.modules.get(ctx, "http", "get"))(ctx, [
            "https://httpbin.org/get",
            { "foo": "bar" },
            { "baz": "quix" }
          ]));
          ctx.scope.set("resp2", yield ctx.callKRLstdlib("set", ctx.scope.get("resp"), "content", yield ctx.callKRLstdlib("set", yield ctx.callKRLstdlib("decode", yield ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content"])), "origin", "-")));
          ctx.scope.set("resp3", yield ctx.callKRLstdlib("set", ctx.scope.get("resp2"), "content_length", (yield ctx.callKRLstdlib(">", yield ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content_length"]), 160)) && (yield ctx.callKRLstdlib("<", yield ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content_length"]), 400)) ? 175 : yield ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content_length"])));
          ctx.scope.set("resp4", yield ctx.callKRLstdlib("delete", ctx.scope.get("resp3"), [
            "content",
            "headers"
          ]));
          yield ctx.modules.set(ctx, "ent", "get_resp", ctx.scope.get("resp4"));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};