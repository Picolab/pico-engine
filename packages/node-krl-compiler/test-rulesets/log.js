module.exports = {
  "rid": "io.picolabs.log",
  "rules": {
    "levels": {
      "name": "levels",
      "select": {
        "graph": { "log": { "levels": { "expr_0": true } } },
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
      "postlude": function* (ctx, fired) {
        if (fired) {
          ctx.log("info", "hello default");
          ctx.log("error", "hello error");
          ctx.log("warn", "hello warn");
          ctx.log("info", "hello info");
          ctx.log("debug", "hello debug");
        }
      }
    }
  }
};