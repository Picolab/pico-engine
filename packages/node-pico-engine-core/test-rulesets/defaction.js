module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": { "shares": ["getSettingVal"] },
  "global": function* (ctx) {
    ctx.defaction(ctx, "foo", function* (ctx, getArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", 2);
      return {
        "actions": [{
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
          }]
      };
    });
    ctx.defaction(ctx, "bar", function* (ctx, getArg) {
      ctx.scope.set("one", getArg("one", 0));
      ctx.scope.set("two", getArg("two", 1));
      ctx.scope.set("three", getArg("three", 2));
      return {
        "actions": [{
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
          }]
      };
    });
    ctx.scope.set("getSettingVal", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "ent", "setting_val");
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "defa": { "foo": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, "foo", ["bar"]);
            }
          }]
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "defa": { "bar": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, "bar", {
                "0": "baz",
                "two": "qux",
                "three": "quux"
              });
            }
          }]
      }
    },
    "bar_setting": {
      "name": "bar_setting",
      "select": {
        "graph": { "defa": { "bar_setting": { "expr_0": true } } },
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
            "action": function* (ctx, runAction) {
              return ctx.scope.set("val", yield runAction(ctx, "bar", {
                "0": "baz",
                "two": "qux",
                "three": "quux"
              }));
            }
          }]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "setting_val", ctx.scope.get("val"));
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};