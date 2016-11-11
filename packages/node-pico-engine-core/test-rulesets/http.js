module.exports = {
  "rid": "io.picolabs.http",
  "meta": { "shares": ["getResp"] },
  "global": function (ctx) {
    ctx.scope.set("getResp", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "get_resp");
    }));
  },
  "rules": {
    "http_get": {
      "name": "http_get",
      "select": {
        "graph": { "http": { "get": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.scope.set("resp", ctx.modules.get(ctx, "http", "get")(ctx, [
            "https://httpbin.org/get",
            { "foo": "bar" },
            { "baz": "quix" }
          ]));
          ctx.scope.set("resp2", ctx.callKRLstdlib("set", ctx.scope.get("resp"), "content", ctx.callKRLstdlib("set", ctx.callKRLstdlib("decode", ctx.callKRLstdlib("get", ctx.scope.get("resp"), ["content"])), "origin", "-")));
          ctx.modules.set(ctx, "ent", "get_resp", ctx.scope.get("resp2"));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};