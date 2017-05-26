module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": {
    "shares": [
      "getSettingVal",
      "add"
    ]
  },
  "global": function* (ctx) {
    ctx.defaction(ctx, "foo", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", 2);
      yield processActionBlock(ctx, {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", [
                "foo",
                {
                  "a": ctx.scope.get("a"),
                  "b": yield ctx.callKRLstdlib("+", [
                    ctx.scope.get("b"),
                    3
                  ])
                }
              ]);
            }
          }]
      });
      return [];
    });
    ctx.defaction(ctx, "bar", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("one", getArg("one", 0));
      ctx.scope.set("two", hasArg("two", 1) ? getArg("two", 1) : yield ctx.callKRLstdlib("get", [
        yield ctx.scope.get("add")(ctx, [
          1,
          1
        ]),
        [
          "options",
          "resp"
        ]
      ]));
      ctx.scope.set("three", hasArg("three", 2) ? getArg("three", 2) : "3 by default");
      yield processActionBlock(ctx, {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", [
                "bar",
                {
                  "a": ctx.scope.get("one"),
                  "b": ctx.scope.get("two"),
                  "c": ctx.scope.get("three")
                }
              ]);
              ctx.scope.set("dir", returns[0]);
            }
          }]
      });
      return [ctx.scope.get("dir")];
    });
    ctx.scope.set("getSettingVal", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "setting_val");
    }));
    ctx.defaction(ctx, "chooser", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("val", getArg("val", 0));
      yield processActionBlock(ctx, {
        "block_type": "choose",
        "discriminant": function* (ctx) {
          return ctx.scope.get("val");
        },
        "actions": [
          {
            "label": "asdf",
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "foo", [ctx.scope.get("val")]);
            }
          },
          {
            "label": "fdsa",
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "bar", [
                ctx.scope.get("val"),
                "ok",
                "done"
              ]);
            }
          }
        ]
      });
      return [];
    });
    ctx.defaction(ctx, "ifAnotB", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      yield processActionBlock(ctx, {
        "condition": function* (ctx) {
          return ctx.scope.get("a") && !ctx.scope.get("b");
        },
        "actions": [
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["yes a"]);
            }
          },
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["not b"]);
            }
          }
        ]
      });
      return [];
    });
    ctx.defaction(ctx, "echoAction", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      ctx.scope.set("c", getArg("c", 2));
      yield processActionBlock(ctx, {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "noop", []);
            }
          }]
      });
      return [
        ctx.scope.get("a"),
        ctx.scope.get("b"),
        ctx.scope.get("c")
      ];
    });
    ctx.defaction(ctx, "complexAction", function* (ctx, getArg, hasArg, processActionBlock) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      ctx.scope.set("c", 100);
      ctx.scope.set("d", yield ctx.callKRLstdlib("+", [
        ctx.scope.get("c"),
        ctx.scope.get("b")
      ]));
      yield processActionBlock(ctx, {
        "condition": function* (ctx) {
          return yield ctx.callKRLstdlib(">", [
            ctx.scope.get("c"),
            0
          ]);
        },
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", [
                yield ctx.callKRLstdlib("+", [
                  "wat:",
                  ctx.scope.get("a")
                ]),
                { "b": ctx.scope.get("b") }
              ]);
              ctx.scope.set("dir", returns[0]);
            }
          }]
      });
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "foo", ["bar"]);
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
              var returns = yield runAction(ctx, void 0, "bar", {
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
              var returns = yield runAction(ctx, void 0, "bar", {
                "0": "baz",
                "two": "qux",
                "three": "quux"
              });
              ctx.scope.set("val", returns[0]);
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
              var returns = yield runAction(ctx, void 0, "chooser", [yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["val"])]);
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
              var returns = yield runAction(ctx, void 0, "ifAnotB", [
                yield ctx.callKRLstdlib("==", [
                  yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["a"]),
                  "true"
                ]),
                yield ctx.callKRLstdlib("==", [
                  yield (yield ctx.modules.get(ctx, "event", "attr"))(ctx, ["b"]),
                  "true"
                ])
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
              var returns = yield runAction(ctx, void 0, "add", [
                1,
                2
              ]);
            }
          }]
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
      "action_block": {
        "actions": [
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "echoAction", [
                "where",
                "in",
                "the"
              ]);
              ctx.scope.set("a", returns[0]);
              ctx.scope.set("b", returns[1]);
              ctx.scope.set("c", returns[2]);
            }
          },
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "complexAction", [
                yield ctx.callKRLstdlib("+", [
                  yield ctx.callKRLstdlib("+", [
                    ctx.scope.get("a"),
                    ctx.scope.get("b")
                  ]),
                  ctx.scope.get("c")
                ]),
                333
              ]);
              ctx.scope.set("d", returns[0]);
            }
          }
        ]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "setting_val", [
            ctx.scope.get("a"),
            ctx.scope.get("b"),
            ctx.scope.get("c"),
            ctx.scope.get("d")
          ]);
        },
        "notfired": undefined,
        "always": undefined
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
      "prelude": function* (ctx) {
        ctx.defaction(ctx, "noop", function* (ctx, getArg, hasArg, processActionBlock) {
          yield processActionBlock(ctx, {
            "actions": [{
                "action": function* (ctx, runAction) {
                  var returns = yield runAction(ctx, void 0, "noop", []);
                }
              }]
          });
          return ["did something!"];
        });
        ctx.defaction(ctx, "send_directive", function* (ctx, getArg, hasArg, processActionBlock) {
          yield processActionBlock(ctx, {
            "actions": [{
                "action": function* (ctx, runAction) {
                  var returns = yield runAction(ctx, void 0, "noop", []);
                  ctx.scope.set("foo", returns[0]);
                }
              }]
          });
          return [yield ctx.callKRLstdlib("+", [
              "send wat? noop returned: ",
              ctx.scope.get("foo")
            ])];
        });
        ctx.defaction(ctx, "echoAction", function* (ctx, getArg, hasArg, processActionBlock) {
          yield processActionBlock(ctx, {
            "actions": [{
                "action": function* (ctx, runAction) {
                  var returns = yield runAction(ctx, void 0, "noop", []);
                }
              }]
          });
          return [
            "aint",
            "no",
            "echo"
          ];
        });
      },
      "action_block": {
        "actions": [
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "echoAction", [
                "where",
                "in",
                "the"
              ]);
              ctx.scope.set("a", returns[0]);
              ctx.scope.set("b", returns[1]);
              ctx.scope.set("c", returns[2]);
            }
          },
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "noop", []);
              ctx.scope.set("d", returns[0]);
            }
          },
          {
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", []);
              ctx.scope.set("e", returns[0]);
            }
          }
        ]
      },
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.modules.set(ctx, "ent", "setting_val", [
            ctx.scope.get("a"),
            ctx.scope.get("b"),
            ctx.scope.get("c"),
            ctx.scope.get("d"),
            ctx.scope.get("e")
          ]);
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};