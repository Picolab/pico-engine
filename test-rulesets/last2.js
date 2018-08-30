module.exports = {
  "rid": "io.picolabs.last2",
  "meta": { "name": "This second ruleset tests that `last` only stops the current ruleset" },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "last": { "all": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["last2 foo"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};