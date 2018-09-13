module.exports = {
  "rid": "io.picolabs.log",
  "rules": {
    "levels": {
      "name": "levels",
      "select": {
        "graph": { "log": { "levels": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
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