module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": {
    "shares": [
      "getSettingVal",
      "add",
      "echoAction"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("foo", ctx.mkAction(["a"], async function (ctx, args, runAction) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", 2);
      var fired = true;
      if (fired) {
        await runAction(ctx, void 0, "send_directive", [
          "foo",
          {
            "a": ctx.scope.get("a"),
            "b": await ctx.applyFn(ctx.scope.get("+"), ctx, [
              ctx.scope.get("b"),
              3
            ])
          }
        ], []);
      }
      return [];
    }));
    ctx.scope.set("bar", ctx.mkAction([
      "one",
      "two",
      "three"
    ], async function (ctx, args, runAction) {
      ctx.scope.set("one", args["one"]);
      ctx.scope.set("two", args.hasOwnProperty("two") ? args["two"] : await ctx.applyFn(ctx.scope.get("get"), ctx, [
        await ctx.applyFn(ctx.scope.get("add"), ctx, [
          1,
          1
        ]),
        [
          "options",
          "resp"
        ]
      ]));
      ctx.scope.set("three", args.hasOwnProperty("three") ? args["three"] : "3 by default");
      var fired = true;
      if (fired) {
        await runAction(ctx, void 0, "send_directive", [
          "bar",
          {
            "a": ctx.scope.get("one"),
            "b": ctx.scope.get("two"),
            "c": ctx.scope.get("three")
          }
        ], ["dir"]);
      }
      return [ctx.scope.get("dir")];
    }));
    ctx.scope.set("getSettingVal", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "setting_val");
    }));
    ctx.scope.set("chooser", ctx.mkAction(["val"], async function (ctx, args, runAction) {
      ctx.scope.set("val", args["val"]);
      var fired = true;
      if (fired) {
        switch (ctx.scope.get("val")) {
        case "asdf":
          await runAction(ctx, void 0, "foo", [ctx.scope.get("val")], []);
          break;
        case "fdsa":
          await runAction(ctx, void 0, "bar", [
            ctx.scope.get("val"),
            "ok",
            "done"
          ], []);
          break;
        }
      }
      return [];
    }));
    ctx.scope.set("ifAnotB", ctx.mkAction([
      "a",
      "b"
    ], async function (ctx, args, runAction) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      var fired = ctx.scope.get("a") && !ctx.scope.get("b");
      if (fired) {
        await runAction(ctx, void 0, "send_directive", ["yes a"], []);
        await runAction(ctx, void 0, "send_directive", ["not b"], []);
      }
      return [];
    }));
    ctx.scope.set("echoAction", ctx.mkAction([
      "a",
      "b",
      "c"
    ], async function (ctx, args, runAction) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      ctx.scope.set("c", args["c"]);
      var fired = true;
      if (fired) {
        await runAction(ctx, void 0, "noop", [], []);
      }
      return [
        ctx.scope.get("a"),
        ctx.scope.get("b"),
        ctx.scope.get("c")
      ];
    }));
    ctx.scope.set("complexAction", ctx.mkAction([
      "a",
      "b"
    ], async function (ctx, args, runAction) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      ctx.scope.set("c", 100);
      ctx.scope.set("d", await ctx.applyFn(ctx.scope.get("+"), ctx, [
        ctx.scope.get("c"),
        ctx.scope.get("b")
      ]));
      var fired = await ctx.applyFn(ctx.scope.get(">"), ctx, [
        ctx.scope.get("c"),
        0
      ]);
      if (fired) {
        await runAction(ctx, void 0, "send_directive", [
          await ctx.applyFn(ctx.scope.get("+"), ctx, [
            "wat:",
            ctx.scope.get("a")
          ]),
          { "b": ctx.scope.get("b") }
        ], ["dir"]);
      }
      return [await ctx.applyFn(ctx.scope.get("+"), ctx, [
          await ctx.applyFn(ctx.scope.get("+"), ctx, [
            await ctx.applyFn(ctx.scope.get("get"), ctx, [
              ctx.scope.get("dir"),
              ["name"]
            ]),
            " "
          ]),
          ctx.scope.get("d")
        ])];
    }));
    ctx.scope.set("add", ctx.mkFunction([
      "a",
      "b"
    ], async function (ctx, args) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      return {
        "type": "directive",
        "name": "add",
        "options": {
          "resp": await ctx.applyFn(ctx.scope.get("+"), ctx, [
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "foo", ["bar"], []);
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "bar", {
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "bar", {
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
          await ctx.modules.set(ctx, "ent", "setting_val", ctx.scope.get("val"));
        }
      }
    },
    "chooser": {
      "name": "chooser",
      "select": {
        "graph": { "defa": { "chooser": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "chooser", [await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["val"])], []);
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "ifAnotB", [
            await ctx.applyFn(ctx.scope.get("=="), ctx, [
              await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["a"]),
              "true"
            ]),
            await ctx.applyFn(ctx.scope.get("=="), ctx, [
              await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["b"]),
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "add", [
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "echoAction", [
            "where",
            "in",
            "the"
          ], [
            "a",
            "b",
            "c"
          ]);
          await runAction(ctx, void 0, "complexAction", [
            await ctx.applyFn(ctx.scope.get("+"), ctx, [
              await ctx.applyFn(ctx.scope.get("+"), ctx, [
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
          await ctx.modules.set(ctx, "ent", "setting_val", [
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("noop", ctx.mkAction([], async function (ctx, args, runAction) {
          var fired = true;
          if (fired) {
            await runAction(ctx, void 0, "noop", [], []);
          }
          return ["did something!"];
        }));
        ctx.scope.set("send_directive", ctx.mkAction([], async function (ctx, args, runAction) {
          var fired = true;
          if (fired) {
            await runAction(ctx, void 0, "noop", [], ["foo"]);
          }
          return [await ctx.applyFn(ctx.scope.get("+"), ctx, [
              "send wat? noop returned: ",
              ctx.scope.get("foo")
            ])];
        }));
        ctx.scope.set("echoAction", ctx.mkAction([], async function (ctx, args, runAction) {
          var fired = true;
          if (fired) {
            await runAction(ctx, void 0, "noop", [], []);
          }
          return [
            "aint",
            "no",
            "echo"
          ];
        }));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "echoAction", [
            "where",
            "in",
            "the"
          ], [
            "a",
            "b",
            "c"
          ]);
          await runAction(ctx, void 0, "noop", [], ["d"]);
          await runAction(ctx, void 0, "send_directive", [], ["e"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "setting_val", [
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("val", await ctx.applyFn(ctx.scope.get("foo"), ctx, [100]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
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