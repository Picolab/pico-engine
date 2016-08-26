module.exports = {
  "name": "io.picolabs.engine",
  "meta": {},
  "rules": {
    "newPico": {
      "name": "newPico",
      "select": {
        "graph": { "engine": { "newPico": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.db.newPicoFuture().wait();
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};
