module.exports = {
  "rid": "io.picolabs.within",
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": {
          "foo": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "end"
            ]]
        },
        "within": async function (ctx) {
          return 5 * 60000;
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["foo"], []);
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
        "graph": {
          "bar": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "end"
            ]]
        },
        "within": async function (ctx) {
          return await ctx.applyFn(ctx.scope.get("+"), ctx, [
            1,
            3
          ]) * 1000;
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["bar"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "baz": {
      "name": "baz",
      "select": {
        "graph": {
          "baz": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "s0"
            ],
            [
              "expr_2",
              "s1"
            ]
          ],
          "s0": [[
              "expr_2",
              "end"
            ]],
          "s1": [[
              "expr_1",
              "end"
            ]]
        },
        "within": async function (ctx) {
          return 1 * 31536000000;
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["baz"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "qux": {
      "name": "qux",
      "select": {
        "graph": {
          "qux": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("c", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        },
        "within": async function (ctx) {
          return 2 * 1000;
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["qux"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};