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
  "global": function* (ctx) {
    ctx.scope.set("g0", "global 0");
    ctx.scope.set("g1", 1);
    ctx.scope.set("getVals", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return {
        "name": yield ctx.modules.get(ctx, "ent", "ent_var_name"),
        "p0": yield ctx.modules.get(ctx, "ent", "ent_var_p0"),
        "p1": yield ctx.modules.get(ctx, "ent", "ent_var_p1")
      };
    }));
    ctx.scope.set("add", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("a", getArg("a", 0));
      ctx.scope.set("b", getArg("b", 1));
      return yield ctx.callKRLstdlib("+", [
        ctx.scope.get("a"),
        ctx.scope.get("b")
      ]);
    }));
    ctx.scope.set("sum", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("arr", getArg("arr", 0));
      return yield ctx.callKRLstdlib("reduce", [
        ctx.scope.get("arr"),
        ctx.scope.get("add"),
        0
      ]);
    }));
    ctx.scope.set("incByN", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("n", getArg("n", 0));
      return ctx.KRLClosure(function* (ctx, getArg, hasArg) {
        ctx.scope.set("a", getArg("a", 0));
        return yield ctx.callKRLstdlib("+", [
          ctx.scope.get("a"),
          ctx.scope.get("n")
        ]);
      });
    }));
    ctx.scope.set("mapped", yield ctx.callKRLstdlib("map", [
      [
        1,
        2,
        3
      ],
      ctx.KRLClosure(function* (ctx, getArg, hasArg) {
        ctx.scope.set("n", getArg("n", 0));
        return yield ctx.callKRLstdlib("+", [
          ctx.scope.get("n"),
          ctx.scope.get("g1")
        ]);
      })
    ]));
  },
  "rules": {
    "eventex": {
      "name": "eventex",
      "select": {
        "graph": {
          "scope": {
            "event0": { "expr_0": true },
            "event1": { "expr_1": true }
          }
        },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "say",
                { "name": ctx.scope.get("my_name") }
              ], []);
            }
          }]
      }
    },
    "prelude_scope": {
      "name": "prelude_scope",
      "select": {
        "graph": { "scope": { "prelude": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("name", matches[0]);
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
        ctx.scope.set("p0", "prelude 0");
        ctx.scope.set("p1", "prelude 1");
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "say",
                {
                  "name": ctx.scope.get("name"),
                  "p0": ctx.scope.get("p0"),
                  "p1": ctx.scope.get("p1"),
                  "g0": ctx.scope.get("g0")
                }
              ], []);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        yield ctx.modules.set(ctx, "ent", "ent_var_name", ctx.scope.get("name"));
        yield ctx.modules.set(ctx, "ent", "ent_var_p0", ctx.scope.get("p0"));
        yield ctx.modules.set(ctx, "ent", "ent_var_p1", ctx.scope.get("p1"));
      }
    },
    "functions": {
      "name": "functions",
      "select": {
        "graph": { "scope": { "functions": { "expr_0": true } } },
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
        ctx.scope.set("g0", "overrided g0!");
        ctx.scope.set("inc5", yield ctx.applyFn(ctx.scope.get("incByN"), ctx, [5]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "say",
                {
                  "add_one_two": yield ctx.applyFn(ctx.scope.get("add"), ctx, [
                    1,
                    2
                  ]),
                  "inc5_3": yield ctx.applyFn(ctx.scope.get("inc5"), ctx, [3]),
                  "g0": ctx.scope.get("g0")
                }
              ], []);
            }
          }]
      }
    }
  }
};