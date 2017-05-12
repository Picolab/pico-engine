module.exports = {
  "rid": "io.picolabs.error",
  "rules": {
    "basic": {
      "name": "basic",
      "select": {
        "graph": { "error": { "basic": { "expr_0": true } } },
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
      "postlude": {
        "fired": function* (ctx) {
          yield ctx.raiseError("info", "some info error");
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};