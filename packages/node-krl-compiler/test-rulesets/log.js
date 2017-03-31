module.exports = {
  "rid": "io.picolabs.log",
  "rules": {
    "levels": {
      "name": "levels",
      "select": {
        "graph": { "log": { "levels": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx) {
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
          ctx.log(null, "hello default");
          ctx.log("error", "hello error");
          ctx.log("warn", "hello warn");
          ctx.log("info", "hello info");
          ctx.log("debug", "hello debug");
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};
