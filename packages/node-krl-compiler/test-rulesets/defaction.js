module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": {
    "shares": [
      "getSettingVal",
      "add"
    ]
  },
  "global": function* (ctx) {
    ctx.defaction(ctx, "foo", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", 2);
      var fired = true;
      if (fired) {
        yield runAction(ctx, void 0, "send_directive", [
          "foo",
          {
            "a": ctx.scope.get("a"),
            "b": yield ctx.callKRLstdlib("+", [
              ctx.scope.get("b"),
              3
            ])
          }
        ], []);
      }
      return [];
    });
    ctx.defaction(ctx, "bar", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("one", getArg("one", 0));
      ctx.scope.set("two", hasArg("two", 1) ? getArg("two", 1) : yield ctx.callKRLstdlib("get", [
        yield ctx.applyFn(ctx.scope.get("add"), ctx, [
          1,
          1
        ]),
        [
          "options",
          "resp"
        ]
      ]));
      ctx.scope.set("three", hasArg("three", 2) ? getArg("three", 2) : "3 by default");
      var fired = true;
      if (fired) {
        yield runAction(ctx, void 0, "send_directive", [
          "bar",
          {
            "a": ctx.scope.get("one"),
            "b": ctx.scope.get("two"),
            "c": ctx.scope.get("three")
          }
        ], ["dir"]);
      }
      return [ctx.scope.get("dir")];
    });
    ctx.scope.set("getSettingVal", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "setting_val");
    }));
    ctx.defaction(ctx, "chooser", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("val", getArg("val", 0));
      var fired = true;
      if (fired) {
        switch (ctx.scope.get("val")) {
        case "asdf":
          yield runAction(ctx, void 0, "foo", [ctx.scope.get("val")], []);
          break;
        case "fdsa":
          yield runAction(ctx, void 0, "bar", [
            ctx.scope.get("val"),
            "ok",
            "done"
          ], []);
          break;
        }
      }
      return [];
    });
    ctx.defaction(ctx, "ifAnotB", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      var fired = ctx.scope.get("a") && !ctx.scope.get("b");
      if (fired) {
        yield runAction(ctx, void 0, "send_directive", ["yes a"], []);
        yield runAction(ctx, void 0, "send_directive", ["not b"], []);
      }
      return [];
    });
    ctx.defaction(ctx, "echoAction", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      ctx.scope.set("c", getArg("c", 2));
      var fired = true;
      if (fired) {
        yield runAction(ctx, void 0, "noop", [], []);
      }
      return [
        ctx.scope.get("a"),
        ctx.scope.get("b"),
        ctx.scope.get("c")
      ];
    });
    ctx.defaction(ctx, "complexAction", function* (ctx, getArg, hasArg, runAction) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      ctx.scope.set("c", 100);
      ctx.scope.set("d", yield ctx.callKRLstdlib("+", [
        ctx.scope.get("c"),
        ctx.scope.get("b")
      ]));
      var fired = yield ctx.callKRLstdlib(">", [
        ctx.scope.get("c"),
        0
      ]);
      if (fired) {
        yield runAction(ctx, void 0, "send_directive", [
          yield ctx.callKRLstdlib("+", [
            "wat:",
            ctx.scope.get("a")
          ]),
          { "b": ctx.scope.get("b") }
        ], ["dir"]);
      }
      return [yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            yield ctx.callKRLstdlib("get", [
              ctx.scope.get("dir"),
              ["name"]
            ]),
            " "
          ]),
          ctx.scope.get("d")
        ])];
    });
    ctx.scope.set("add", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      return {
        "type": "directive",
        "name": "add",
        "options": {
          "resp": yield ctx.callKRLstdlib("+", [
            ctx.scope.get("a"),
            ctx.scope.get("b")
          ])
        }
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "foo", ["bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "bar", {
            "0": "baz",
            "two": "qux",
            "three": "quux"
          }, []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "bar", {
            "0": "baz",
            "two": "qux",
            "three": "quux"
          }, ["val"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "setting_val", ctx.scope.get("val"));
        }
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "chooser", [yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["val"])], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "ifAnotB", [
            yield ctx.callKRLstdlib("==", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["a"]),
              "true"
            ]),
            yield ctx.callKRLstdlib("==", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["b"]),
              "true"
            ])
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "add", [
            1,
            2
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "returns": {
      "name": "returns",
      "select": {
        "graph": { "defa": { "returns": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "echoAction", [
            "where",
            "in",
            "the"
          ], [
            "a",
            "b",
            "c"
          ]);
          yield runAction(ctx, void 0, "complexAction", [
            yield ctx.callKRLstdlib("+", [
              yield ctx.callKRLstdlib("+", [
                ctx.scope.get("a"),
                ctx.scope.get("b")
              ]),
              ctx.scope.get("c")
            ]),
            333
          ], ["d"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "setting_val", [
            ctx.scope.get("a"),
            ctx.scope.get("b"),
            ctx.scope.get("c"),
            ctx.scope.get("d")
          ]);
        }
      }
    },
    "scope": {
      "name": "scope",
      "select": {
        "graph": { "defa": { "scope": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.defaction(ctx, "noop", function* (ctx, getArg, hasArg, runAction) {
          var fired = true;
          if (fired) {
            yield runAction(ctx, void 0, "noop", [], []);
          }
          return ["did something!"];
        });
        ctx.defaction(ctx, "send_directive", function* (ctx, getArg, hasArg, runAction) {
          var fired = true;
          if (fired) {
            yield runAction(ctx, void 0, "noop", [], ["foo"]);
          }
          return [yield ctx.callKRLstdlib("+", [
              "send wat? noop returned: ",
              ctx.scope.get("foo")
            ])];
        });
        ctx.defaction(ctx, "echoAction", function* (ctx, getArg, hasArg, runAction) {
          var fired = true;
          if (fired) {
            yield runAction(ctx, void 0, "noop", [], []);
          }
          return [
            "aint",
            "no",
            "echo"
          ];
        });
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "echoAction", [
            "where",
            "in",
            "the"
          ], [
            "a",
            "b",
            "c"
          ]);
          yield runAction(ctx, void 0, "noop", [], ["d"]);
          yield runAction(ctx, void 0, "send_directive", [], ["e"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "setting_val", [
            ctx.scope.get("a"),
            ctx.scope.get("b"),
            ctx.scope.get("c"),
            ctx.scope.get("d"),
            ctx.scope.get("e")
          ]);
        }
      }
    },
    "trying_to_use_action_as_fn": {
      "name": "trying_to_use_action_as_fn",
      "select": {
        "graph": { "defa": { "trying_to_use_action_as_fn": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("val", yield ctx.applyFn(ctx.scope.get("foo"), ctx, [100]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "trying_to_use_action_as_fn",
            { "val": ctx.scope.get("val") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};