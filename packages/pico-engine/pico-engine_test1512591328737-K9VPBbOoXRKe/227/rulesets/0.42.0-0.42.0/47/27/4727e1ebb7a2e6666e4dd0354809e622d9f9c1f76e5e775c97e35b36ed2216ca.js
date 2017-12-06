module.exports = {
  "rid": "io.picolabs.logging",
  "meta": {
    "shares": [
      "__testing",
      "getLogs"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("__testing", {
      "queries": [
        { "name": "__testing" },
        { "name": "getLogs" }
      ],
      "events": [
        {
          "domain": "picolog",
          "type": "reset"
        },
        {
          "domain": "picolog",
          "type": "begin"
        },
        {
          "domain": "picolog",
          "type": "prune",
          "attrs": ["leaving"]
        }
      ]
    });
    ctx.scope.set("getLogs", ctx.mkFunction([], function* (ctx, args) {
      return {
        "status": yield ctx.modules.get(ctx, "ent", "status"),
        "logs": yield ctx.modules.get(ctx, "ent", "logs")
      };
    }));
  },
  "rules": {
    "picolog_reset": {
      "name": "picolog_reset",
      "select": {
        "graph": { "picolog": { "reset": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "status", false);
          yield ctx.raiseEvent({
            "domain": "picolog",
            "type": "empty",
            "attributes": {},
            "for_rid": undefined
          });
        }
      }
    },
    "picolog_empty": {
      "name": "picolog_empty",
      "select": {
        "graph": { "picolog": { "empty": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "logs", {});
          yield ctx.raiseEvent({
            "domain": "picolog",
            "type": "emptied",
            "attributes": {},
            "for_rid": undefined
          });
        }
      }
    },
    "picolog_begin": {
      "name": "picolog_begin",
      "select": {
        "graph": { "picolog": { "begin": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "status", true);
        }
      }
    },
    "picolog_prune": {
      "name": "picolog_prune",
      "select": {
        "graph": { "picolog": { "prune": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("episodes", yield ctx.callKRLstdlib("keys", [yield ctx.modules.get(ctx, "ent", "logs")]));
        ctx.scope.set("old_size", yield ctx.callKRLstdlib("length", [ctx.scope.get("episodes")]));
        ctx.scope.set("remove", yield ctx.callKRLstdlib("-", [
          ctx.scope.get("old_size"),
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["leaving"])
        ]));
        ctx.scope.set("keys_to_remove", (yield ctx.callKRLstdlib("<=", [
          ctx.scope.get("remove"),
          0
        ])) || (yield ctx.callKRLstdlib(">", [
          ctx.scope.get("remove"),
          ctx.scope.get("old_size")
        ])) ? [] : yield ctx.callKRLstdlib("slice", [
          ctx.scope.get("episodes"),
          yield ctx.callKRLstdlib("-", [
            ctx.scope.get("remove"),
            1
          ])
        ]));
        var fired = yield ctx.callKRLstdlib(">", [
          yield ctx.callKRLstdlib("length", [ctx.scope.get("keys_to_remove")]),
          0
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "logs", yield ctx.callKRLstdlib("filter", [
            yield ctx.modules.get(ctx, "ent", "logs"),
            ctx.mkFunction([
              "v",
              "k"
            ], function* (ctx, args) {
              ctx.scope.set("v", args["v"]);
              ctx.scope.set("k", args["k"]);
              return !(yield ctx.callKRLstdlib("><", [
                ctx.scope.get("keys_to_remove"),
                ctx.scope.get("k")
              ]));
            })
          ]));
        }
      }
    },
    "pico_ruleset_added": {
      "name": "pico_ruleset_added",
      "select": {
        "graph": { "pico": { "ruleset_added": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            if (!(yield ctx.callKRLstdlib("==", [
                yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rid"]),
                yield ctx.modules.get(ctx, "meta", "rid")
              ])))
              return false;
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
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "logs", {});
          yield ctx.modules.set(ctx, "ent", "status", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["status"]));
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
