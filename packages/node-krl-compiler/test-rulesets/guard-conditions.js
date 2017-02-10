module.exports = {
  "rid": "io.picolabs.guard-conditions",
  "meta": { "shares": ["getB"] },
  "global": function (ctx) {
    ctx.scope.set("getB", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "b");
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "foo": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "b",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("b", matches[0]);
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
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "foo",
                "options": { "b": ctx.scope.get("b") }
              };
            }
          }]
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function (ctx) {
          if (ctx.callKRLstdlib("match", ctx.scope.get("b"), new RegExp("foo", "")))
            ctx.modules.set(ctx, "ent", "b", ctx.scope.get("b"));
        }
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "bar": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
      "foreach": function (ctx, foreach, iter) {
        foreach([
          1,
          2,
          3
        ], ctx.KRLClosure(ctx, function (ctx) {
          ctx.scope.set("x", ctx.getArg(ctx.args, "value", 0));
          iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "bar",
                "options": {
                  "x": ctx.scope.get("x"),
                  "b": ctx.modules.get(ctx, "ent", "b")
                }
              };
            }
          }]
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function (ctx) {
          if (ctx.foreach_is_final)
            ctx.modules.set(ctx, "ent", "b", ctx.scope.get("x"));
        }
      }
    }
  }
};