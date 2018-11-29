module.exports = {
  "rid": "io.picolabs.hello_world",
  "meta": {
    "name": "Hello World",
    "description": "\nA first ruleset for the Quickstart\n        ",
    "author": "Phil Windley",
    "logging": true,
    "shares": ["hello"]
  },
  "global": async function (ctx) {
    ctx.scope.set("hello", ctx.mkFunction(["obj"], async function (ctx, args) {
      ctx.scope.set("obj", args["obj"]);
      ctx.scope.set("msg", await ctx.applyFn(ctx.scope.get("+"), ctx, [
        "Hello ",
        ctx.scope.get("obj")
      ]));
      return ctx.scope.get("msg");
    }));
  },
  "rules": {
    "say_hello": {
      "name": "say_hello",
      "select": {
        "graph": { "echo": { "hello": { "expr_0": true } } },
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
          await runAction(ctx, void 0, "send_directive", [
            "say",
            { "something": "Hello World" }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};