module.exports = {
  "rid": "io.picolabs.scope",
  "meta": {
    "name": "testing scope",
    "shares": [
      "g0",
      "g1",
      "getVals",
      "add",
      "sum",
      "mapped"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("g0", "global 0");
    ctx.scope.set("g1", 1);
    ctx.scope.set("getVals", ctx.mkFunction([], async function (ctx, args) {
      return {
        "name": await ctx.modules.get(ctx, "ent", "ent_var_name"),
        "p0": await ctx.modules.get(ctx, "ent", "ent_var_p0"),
        "p1": await ctx.modules.get(ctx, "ent", "ent_var_p1")
      };
    }));
    ctx.scope.set("add", ctx.mkFunction([
      "a",
      "b"
    ], async function (ctx, args) {
      ctx.scope.set("a", args["a"]);
      ctx.scope.set("b", args["b"]);
      return await ctx.applyFn(ctx.scope.get("+"), ctx, [
        ctx.scope.get("a"),
        ctx.scope.get("b")
      ]);
    }));
    ctx.scope.set("sum", ctx.mkFunction(["arr"], async function (ctx, args) {
      ctx.scope.set("arr", args["arr"]);
      return await ctx.applyFn(ctx.scope.get("reduce"), ctx, [
        ctx.scope.get("arr"),
        ctx.scope.get("add"),
        0
      ]);
    }));
    ctx.scope.set("incByN", ctx.mkFunction(["n"], async function (ctx, args) {
      ctx.scope.set("n", args["n"]);
      return ctx.mkFunction(["a"], async function (ctx, args) {
        ctx.scope.set("a", args["a"]);
        return await ctx.applyFn(ctx.scope.get("+"), ctx, [
          ctx.scope.get("a"),
          ctx.scope.get("n")
        ]);
      });
    }));
    ctx.scope.set("mapped", await ctx.applyFn(ctx.scope.get("map"), ctx, [
      [
        1,
        2,
        3
      ],
      ctx.mkFunction(["n"], async function (ctx, args) {
        ctx.scope.set("n", args["n"]);
        return await ctx.applyFn(ctx.scope.get("+"), ctx, [
          ctx.scope.get("n"),
          ctx.scope.get("g1")
        ]);
      })
    ]));
  },
  "rules": {
    "eventOr": {
      "name": "eventOr",
      "select": {
        "graph": {
          "scope": {
            "eventOr0": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name0", matches[0]);
                return true;
              }
            },
            "eventOr1": {
              "expr_1": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name1", matches[0]);
                return true;
              }
            }
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
              "end"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "eventOr",
            {
              "name0": ctx.scope.get("name0"),
              "name1": ctx.scope.get("name1")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "eventAnd": {
      "name": "eventAnd",
      "select": {
        "graph": {
          "scope": {
            "eventAnd0": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name0", matches[0]);
                return true;
              }
            },
            "eventAnd1": {
              "expr_1": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name1", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "eventAnd",
            {
              "name0": ctx.scope.get("name0"),
              "name1": ctx.scope.get("name1")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "eventWithin": {
      "name": "eventWithin",
      "select": {
        "graph": {
          "scope": {
            "eventWithin0": { "expr_0": true },
            "eventWithin1": {
              "expr_1": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name1", matches[0]);
                return true;
              }
            },
            "eventWithin2": {
              "expr_2": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name2", matches[0]);
                return true;
              }
            },
            "eventWithin3": { "expr_3": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s0"
            ],
            [
              "expr_2",
              "s1"
            ],
            [
              "expr_3",
              "s1"
            ]
          ],
          "s0": [
            [
              "expr_2",
              "end"
            ],
            [
              "expr_3",
              "end"
            ]
          ],
          "s1": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ]
          ]
        },
        "within": async function (ctx) {
          return 1 * 1000;
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "eventWithin",
            {
              "name1": ctx.scope.get("name1"),
              "name2": ctx.scope.get("name2")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "prelude_scope": {
      "name": "prelude_scope",
      "select": {
        "graph": {
          "scope": {
            "prelude": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("p0", "prelude 0");
        ctx.scope.set("p1", "prelude 1");
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "say",
            {
              "name": ctx.scope.get("name"),
              "p0": ctx.scope.get("p0"),
              "p1": ctx.scope.get("p1"),
              "g0": ctx.scope.get("g0")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        await ctx.modules.set(ctx, "ent", "ent_var_name", ctx.scope.get("name"));
        await ctx.modules.set(ctx, "ent", "ent_var_p0", ctx.scope.get("p0"));
        await ctx.modules.set(ctx, "ent", "ent_var_p1", ctx.scope.get("p1"));
      }
    },
    "functions": {
      "name": "functions",
      "select": {
        "graph": { "scope": { "functions": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("g0", "overrided g0!");
        ctx.scope.set("inc5", await ctx.applyFn(ctx.scope.get("incByN"), ctx, [5]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "say",
            {
              "add_one_two": await ctx.applyFn(ctx.scope.get("add"), ctx, [
                1,
                2
              ]),
              "inc5_3": await ctx.applyFn(ctx.scope.get("inc5"), ctx, [3]),
              "g0": ctx.scope.get("g0")
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
};