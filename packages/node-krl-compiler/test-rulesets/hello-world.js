module.exports = {
  "rid": "io.picolabs.hello_world",
  "meta": {
    "name": "Hello World",
    "description": "\nA first ruleset for the Quickstart\n        ",
    "author": "Phil Windley",
    "logging": true,
    "shares": ["hello"]
  },
  "global": function* (ctx) {
    ctx.scope.set("hello", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      ctx.scope.set("obj", getArg("obj", 0));
      ctx.scope.set("msg", yield ctx.callKRLstdlib("+", "Hello ", ctx.scope.get("obj")));
      return ctx.scope.get("msg");
    }));
  },
  "rules": {
    "say_hello": {
      "name": "say_hello",
      "select": {
        "graph": { "echo": { "hello": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              return yield runAction(ctx, void 0, "send_directive", [
                "say",
                { "something": "Hello World" }
              ]);
            }
          }]
      }
    }
  }
};