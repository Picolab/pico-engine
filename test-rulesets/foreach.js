module.exports = {
  "rid": "io.picolabs.foreach",
  "meta": { "name": "testing foreach" },
  "global": async function (ctx) {
    ctx.scope.set("doubleThis", ctx.mkFunction(["arr"], async function (ctx, args) {
      ctx.scope.set("arr", args["arr"]);
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
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs([
          1,
          2,
          3
        ]);
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          var foreach_is_final = foreach0_i === foreach0_len - 1;
          ctx.scope.set("x", foreach0_pairs[foreach0_i][1]);
          var fired = true;
          if (fired) {
            await runAction(ctx, void 0, "send_directive", [
              "basic",
              { "x": ctx.scope.get("x") }
            ], []);
          }
          if (fired)
            ctx.emit("debug", "fired");
          else
            ctx.emit("debug", "not fired");
        }
      }
    },
    "map": {
      "name": "map",
      "select": {
        "graph": { "foreach": { "map": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs({
          "a": 1,
          "b": 2,
          "c": 3
        });
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          var foreach_is_final = foreach0_i === foreach0_len - 1;
          ctx.scope.set("v", foreach0_pairs[foreach0_i][1]);
          ctx.scope.set("k", foreach0_pairs[foreach0_i][0]);
          var fired = true;
          if (fired) {
            await runAction(ctx, void 0, "send_directive", [
              "map",
              {
                "k": ctx.scope.get("k"),
                "v": ctx.scope.get("v")
              }
            ], []);
          }
          if (fired)
            ctx.emit("debug", "fired");
          else
            ctx.emit("debug", "not fired");
        }
      }
    },
    "nested": {
      "name": "nested",
      "select": {
        "graph": { "foreach": { "nested": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs([
          1,
          2,
          3
        ]);
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          ctx.scope.set("x", foreach0_pairs[foreach0_i][1]);
          var foreach1_pairs = toPairs([
            "a",
            "b",
            "c"
          ]);
          var foreach1_len = foreach1_pairs.length;
          var foreach1_i;
          for (foreach1_i = 0; foreach1_i < foreach1_len; foreach1_i++) {
            var foreach_is_final = foreach0_i === foreach0_len - 1 && foreach1_i === foreach1_len - 1;
            ctx.scope.set("y", foreach1_pairs[foreach1_i][1]);
            var fired = true;
            if (fired) {
              await runAction(ctx, void 0, "send_directive", [
                "nested",
                {
                  "x": ctx.scope.get("x"),
                  "y": ctx.scope.get("y")
                }
              ], []);
            }
            if (fired)
              ctx.emit("debug", "fired");
            else
              ctx.emit("debug", "not fired");
          }
        }
      }
    },
    "scope": {
      "name": "scope",
      "select": {
        "graph": { "foreach": { "scope": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs(await ctx.applyFn(ctx.scope.get("doubleThis"), ctx, [[
            1,
            2,
            3
          ]]));
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          ctx.scope.set("arr", foreach0_pairs[foreach0_i][1]);
          var foreach1_pairs = toPairs(ctx.scope.get("arr"));
          var foreach1_len = foreach1_pairs.length;
          var foreach1_i;
          for (foreach1_i = 0; foreach1_i < foreach1_len; foreach1_i++) {
            ctx.scope.set("foo", foreach1_pairs[foreach1_i][1]);
            var foreach2_pairs = toPairs(await ctx.applyFn(ctx.scope.get("range"), ctx, [
              0,
              ctx.scope.get("foo")
            ]));
            var foreach2_len = foreach2_pairs.length;
            var foreach2_i;
            for (foreach2_i = 0; foreach2_i < foreach2_len; foreach2_i++) {
              var foreach_is_final = foreach0_i === foreach0_len - 1 && foreach1_i === foreach1_len - 1 && foreach2_i === foreach2_len - 1;
              ctx.scope.set("bar", foreach2_pairs[foreach2_i][1]);
              ctx.scope.set("baz", await ctx.applyFn(ctx.scope.get("*"), ctx, [
                ctx.scope.get("foo"),
                ctx.scope.get("bar")
              ]));
              var fired = true;
              if (fired) {
                await runAction(ctx, void 0, "send_directive", [
                  "scope",
                  {
                    "foo": ctx.scope.get("foo"),
                    "bar": ctx.scope.get("bar"),
                    "baz": ctx.scope.get("baz")
                  }
                ], []);
              }
              if (fired)
                ctx.emit("debug", "fired");
              else
                ctx.emit("debug", "not fired");
            }
          }
        }
      }
    },
    "final": {
      "name": "final",
      "select": {
        "graph": { "foreach": { "final": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs(await ctx.applyFn(ctx.scope.get("split"), ctx, [
          await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["x"]),
          ","
        ]));
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          ctx.scope.set("x", foreach0_pairs[foreach0_i][1]);
          var foreach1_pairs = toPairs(await ctx.applyFn(ctx.scope.get("split"), ctx, [
            await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["y"]),
            ","
          ]));
          var foreach1_len = foreach1_pairs.length;
          var foreach1_i;
          for (foreach1_i = 0; foreach1_i < foreach1_len; foreach1_i++) {
            var foreach_is_final = foreach0_i === foreach0_len - 1 && foreach1_i === foreach1_len - 1;
            ctx.scope.set("y", foreach1_pairs[foreach1_i][1]);
            var fired = true;
            if (fired) {
              await runAction(ctx, void 0, "send_directive", [
                "final",
                {
                  "x": ctx.scope.get("x"),
                  "y": ctx.scope.get("y")
                }
              ], []);
            }
            if (fired)
              ctx.emit("debug", "fired");
            else
              ctx.emit("debug", "not fired");
            if (typeof foreach_is_final === "undefined" || foreach_is_final)
              await ctx.raiseEvent({
                "domain": "foreach",
                "type": "final_raised",
                "attributes": {
                  "x": ctx.scope.get("x"),
                  "y": ctx.scope.get("y")
                },
                "for_rid": undefined
              });
          }
        }
      }
    },
    "final_raised": {
      "name": "final_raised",
      "select": {
        "graph": { "foreach": { "final_raised": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", [
            "final_raised",
            {
              "x": await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["x"]),
              "y": await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["y"])
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "key_vs_index": {
      "name": "key_vs_index",
      "select": {
        "graph": { "foreach": { "key_vs_index": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var foreach0_pairs = toPairs({
          "foo": "bar",
          "baz": "qux"
        });
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          ctx.scope.set("a", foreach0_pairs[foreach0_i][1]);
          ctx.scope.set("k", foreach0_pairs[foreach0_i][0]);
          var foreach1_pairs = toPairs([
            "one",
            "two",
            "three"
          ]);
          var foreach1_len = foreach1_pairs.length;
          var foreach1_i;
          for (foreach1_i = 0; foreach1_i < foreach1_len; foreach1_i++) {
            var foreach_is_final = foreach0_i === foreach0_len - 1 && foreach1_i === foreach1_len - 1;
            ctx.scope.set("b", foreach1_pairs[foreach1_i][1]);
            ctx.scope.set("i", foreach1_pairs[foreach1_i][0]);
            var fired = true;
            if (fired) {
              await runAction(ctx, void 0, "send_directive", [
                "key_vs_index",
                {
                  "a": ctx.scope.get("a"),
                  "k": ctx.scope.get("k"),
                  "b": ctx.scope.get("b"),
                  "i": ctx.scope.get("i")
                }
              ], []);
            }
            if (fired)
              ctx.emit("debug", "fired");
            else
              ctx.emit("debug", "not fired");
          }
        }
      }
    }
  }
};