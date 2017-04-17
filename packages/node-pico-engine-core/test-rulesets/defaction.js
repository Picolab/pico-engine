module.exports = {
  "rid": "io.picolabs.defaction",
  "global": function* (ctx) {
    ctx.scope.set("foo", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", 2);
      var actions = [{
          "action": function* (ctx) {
            return {
              "type": "directive",
              "name": "foo",
              "options": {
                "a": ctx.scope.get("a"),
                "b": yield ctx.callKRLstdlib("+", ctx.scope.get("b"), 3)
              }
            };
          }
        }];
      var r = [];
      var i;
      for (i = 0; i < actions.length; i++)
        r.push(yield actions[i].action(ctx));
      return r;
    }));
    ctx.scope.set("bar", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("one", getArg("one", 0));
      ctx.scope.set("two", getArg("two", 1));
      ctx.scope.set("three", getArg("three", 2));
      var actions = [{
          "action": function* (ctx) {
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
        }];
      var r = [];
      var i;
      for (i = 0; i < actions.length; i++)
        r.push(yield actions[i].action(ctx));
      return r;
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "foo": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
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
            "action": function* (ctx) {
              return yield ctx.scope.get("foo")(ctx, ["bar"]);
            }
          }]
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "bar": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
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
            "action": function* (ctx) {
              return yield ctx.scope.get("bar")(ctx, {
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