module.exports = {
  "rid": "io.picolabs.foreach",
  "meta": { "name": "testing foreach" },
  "global": function (ctx) {
    ctx.scope.set("doubleThis", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("arr", ctx.getArg(ctx.args, "arr", 0));
      return [
        ctx.scope.get("arr"),
        ctx.scope.get("arr")
      ];
    }));
  },
  "rules": {
    "basic": {
      "name": "basic",
      "select": {
        "graph": { "foreach": { "basic": { "expr_0": true } } },
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
                "name": "basic",
                "options": { "x": ctx.scope.get("x") }
              };
            }
          }]
      }
    },
    "map": {
      "name": "map",
      "select": {
        "graph": { "foreach": { "map": { "expr_0": true } } },
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
        foreach({
          "a": 1,
          "b": 2,
          "c": 3
        }, ctx.KRLClosure(ctx, function (ctx) {
          ctx.scope.set("v", ctx.getArg(ctx.args, "value", 0));
          ctx.scope.set("k", ctx.getArg(ctx.args, "key", 1));
          iter(ctx);
        }));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "map",
                "options": {
                  "k": ctx.scope.get("k"),
                  "v": ctx.scope.get("v")
                }
              };
            }
          }]
      }
    },
    "nested": {
      "name": "nested",
      "select": {
        "graph": { "foreach": { "nested": { "expr_0": true } } },
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
          foreach([
            "a",
            "b",
            "c"
          ], ctx.KRLClosure(ctx, function (ctx) {
            ctx.scope.set("y", ctx.getArg(ctx.args, "value", 0));
            iter(ctx);
          }));
        }));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "nested",
                "options": {
                  "x": ctx.scope.get("x"),
                  "y": ctx.scope.get("y")
                }
              };
            }
          }]
      }
    },
    "scope": {
      "name": "scope",
      "select": {
        "graph": { "foreach": { "scope": { "expr_0": true } } },
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
        foreach(ctx.scope.get("doubleThis")(ctx, [[
            1,
            2,
            3
          ]]), ctx.KRLClosure(ctx, function (ctx) {
          ctx.scope.set("arr", ctx.getArg(ctx.args, "value", 0));
          foreach(ctx.scope.get("arr"), ctx.KRLClosure(ctx, function (ctx) {
            ctx.scope.set("foo", ctx.getArg(ctx.args, "value", 0));
            foreach(ctx.callKRLstdlib("range", 0, ctx.scope.get("foo")), ctx.KRLClosure(ctx, function (ctx) {
              ctx.scope.set("bar", ctx.getArg(ctx.args, "value", 0));
              iter(ctx);
            }));
          }));
        }));
      },
      "prelude": function (ctx) {
        ctx.scope.set("baz", ctx.callKRLstdlib("*", ctx.scope.get("foo"), ctx.scope.get("bar")));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "scope",
                "options": {
                  "foo": ctx.scope.get("foo"),
                  "bar": ctx.scope.get("bar"),
                  "baz": ctx.scope.get("baz")
                }
              };
            }
          }]
      }
    }
  }
};