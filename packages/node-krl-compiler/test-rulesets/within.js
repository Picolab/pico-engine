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
          "expr_0": function* (ctx) {
            return true;
          },
          "expr_1": function* (ctx) {
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
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "foo",
                "options": {}
              };
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
          "expr_0": function* (ctx) {
            return true;
          },
          "expr_1": function* (ctx) {
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
          return (yield ctx.callKRLstdlib("+", 1, 3)) * 1000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "bar",
                "options": {}
              };
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
          "expr_0": function* (ctx) {
            return true;
          },
          "expr_1": function* (ctx) {
            return true;
          },
          "expr_2": function* (ctx) {
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
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "baz",
                "options": {}
              };
            }
          }]
      }
    },
    "qux": {
      "name": "qux",
      "select": {
        "graph": { "qux": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
            "action": function* (ctx) {
              return {
                "type": "directive",
                "name": "qux",
                "options": {}
              };
            }
          }]
      }
    }
  }
};