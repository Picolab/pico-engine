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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
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
        "within": function* (ctx) {
          return 5 * 60000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["foo"]);
            }
          }]
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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
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
        "within": function* (ctx) {
          return (yield ctx.callKRLstdlib("+", [
            1,
            3
          ])) * 1000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["bar"]);
            }
          }]
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
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent) {
            return true;
          },
          "expr_2": function* (ctx, aggregateEvent) {
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
        "within": function* (ctx) {
          return 1 * 31536000000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["baz"]);
            }
          }]
      }
    },
    "qux": {
      "name": "qux",
      "select": {
        "graph": { "qux": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield (yield ctx.modules.get(ctx, "event", "attrMatches"))(ctx, [[[
                  "b",
                  new RegExp("c", "")
                ]]]);
            if (!matches)
              return false;
            return true;
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
        "within": function* (ctx) {
          return 2 * 1000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              var returns = yield runAction(ctx, void 0, "send_directive", ["qux"]);
            }
          }]
      }
    }
  }
};