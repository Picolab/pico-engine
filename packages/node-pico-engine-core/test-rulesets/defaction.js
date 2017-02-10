module.exports = {
  "rid": "io.picolabs.defaction",
  "global": function (ctx) {
    ctx.scope.set("foo", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("a", ctx.getArg(ctx.args, "a", 0));
      ctx.scope.set("b", 2);
      return [{
          "action": function (ctx) {
            return {
              "type": "directive",
              "name": "foo",
              "options": {
                "a": ctx.scope.get("a"),
                "b": ctx.callKRLstdlib("+", ctx.scope.get("b"), 3)
              }
            };
          }
        }].map(function (a) {
        return a.action(ctx);
      });
    }));
    ctx.scope.set("bar", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("one", ctx.getArg(ctx.args, "one", 0));
      ctx.scope.set("two", ctx.getArg(ctx.args, "two", 1));
      ctx.scope.set("three", ctx.getArg(ctx.args, "three", 2));
      return [{
          "action": function (ctx) {
            return {
              "type": "directive",
              "name": "bar",
              "options": {
                "a": ctx.scope.get("one"),
                "b": ctx.scope.get("two"),
                "c": ctx.scope.get("three")
              }
            };
          }
        }].map(function (a) {
        return a.action(ctx);
      });
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "foo": { "a": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return ctx.scope.get("foo")(ctx, ["bar"]);
            }
          }]
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
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return ctx.scope.get("bar")(ctx, {
                "0": "baz",
                "two": "qux",
                "three": "quux"
              });
            }
          }]
      }
    }
  }
};