module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": {
    "shares": [
      "getSettingVal",
      "add"
    ]
  },
  "global": function* (ctx) {
    ctx.defaction(ctx, "foo", function* (ctx, getArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", 2);
      return {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "foo",
                "a": ctx.scope.get("a"),
                "b": yield ctx.callKRLstdlib("+", ctx.scope.get("b"), 3)
              });
            }
          }]
      };
    });
    ctx.defaction(ctx, "bar", function* (ctx, getArg, hasArg) {
      ctx.scope.set("one", getArg("one", 0));
      ctx.scope.set("two", hasArg("two", 1)
             ?  getArg("two", 1)
             : yield ctx.callKRLstdlib("get", yield ctx.scope.get("add")(ctx, [
          1,
          1
        ]), [
          "options",
          "resp"
        ])
      );
      ctx.scope.set("three", hasArg("three", 2)
        ? getArg("three", 2)
        : "3 by default"
      );
      return {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", {
                "0": "bar",
                "a": ctx.scope.get("one"),
                "b": ctx.scope.get("two"),
                "c": ctx.scope.get("three")
              });
            }
          }]
      };
    });
    ctx.scope.set("getSettingVal", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.modules.get(ctx, "ent", "setting_val");
    }));
    ctx.defaction(ctx, "chooser", function* (ctx, getArg) {
      ctx.scope.set("val", getArg("val", 0));
      return {
        "block_type": "choose",
        "condition": function* (ctx) {
          return ctx.scope.get("val");
        },
        "actions": [
          {
            "label": "asdf",
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "foo", [ctx.scope.get("val")]);
            }
          },
          {
            "label": "fdsa",
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "bar", [
                ctx.scope.get("val"),
                "ok",
                "done"
              ]);
            }
          }
        ]
      };
    });
    ctx.defaction(ctx, "ifAnotB", function* (ctx, getArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      return {
        "condition": function* (ctx) {
          return ctx.scope.get("a") && !ctx.scope.get("b");
        },
        "actions": [
          {
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", ["yes a"]);
            }
          },
          {
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", ["not b"]);
            }
          }
        ]
      };
    });
    ctx.scope.set("add", ctx.KRLClosure(function* (ctx, getArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      return {
        "type": "directive",
        "name": "add",
        "options": { "resp": yield ctx.callKRLstdlib("+", ctx.scope.get("a"), ctx.scope.get("b")) }
      };
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
              return yield runAction(ctx, void 0, "foo", ["bar"]);
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
              return yield runAction(ctx, void 0, "bar", {
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
              return ctx.scope.set("val", yield runAction(ctx, void 0, "bar", {
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
    },
    "chooser": {
      "name": "chooser",
      "select": {
        "graph": { "defa": { "chooser": { "expr_0": true } } },
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
              return yield runAction(ctx, void 0, "chooser", [yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["val"])]);
            }
          }]
      }
    },
    "ifAnotB": {
      "name": "ifAnotB",
      "select": {
        "graph": { "defa": { "ifAnotB": { "expr_0": true } } },
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
              return yield runAction(ctx, void 0, "ifAnotB", [
                yield ctx.callKRLstdlib("==", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["a"]), "true"),
                yield ctx.callKRLstdlib("==", yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["b"]), "true")
              ]);
            }
          }]
      }
    },
    "add": {
      "name": "add",
      "select": {
        "graph": { "defa": { "add": { "expr_0": true } } },
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
              return yield runAction(ctx, void 0, "add", [
                1,
                2
              ]);
            }
          }]
      }
    }
  }
};
