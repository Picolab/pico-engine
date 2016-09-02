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
          ctx.engine.newPico();
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "newChannel": {
      "name": "newChannel",
      "select": {
        "graph": { "engine": { "newChannel": { "expr_0": true } } },
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
          ctx.engine.newChannel({
            "name": ctx.event.getAttr("name"),
            "type": ctx.event.getAttr("type"),
            "pico_id": ctx.event.getAttr("pico_id")
          });
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};