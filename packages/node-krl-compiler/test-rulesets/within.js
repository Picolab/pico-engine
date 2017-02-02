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
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
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
        "within": function (ctx) {
          return 5 * 60000;
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "foo",
                "options": {}
              };
            }
          }]
      }
    }
  }
};
