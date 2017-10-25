module.exports = {
  "rid": "io.picolabs.persistent-index",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey"
    ],
    "index": null
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "foo", undefined);
    }));
    ctx.scope.set("getFooKey", ctx.mkFunction(["key"], function* (ctx, args) {
      ctx.scope.set("key", args["key"]);
      return yield ctx.modules.get(ctx, "ent", "foo", ctx.scope.get("key"));
    }));
  },
  "rules": {
    "setfoo": {
      "name": "setfoo",
      "select": {
        "graph": { "pindex": { "setfoo": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "foo", undefined, yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs", undefined), ctx, []));
      }
    },
    "putfoo": {
      "name": "putfoo",
      "select": {
        "graph": { "pindex": { "putfoo": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr", undefined), ctx, ["key"]));
        ctx.scope.set("value", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr", undefined), ctx, ["value"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "foo", ctx.scope.get("key"), ctx.scope.get("value"));
      }
    },
    "delfoo": {
      "name": "delfoo",
      "select": {
        "graph": { "pindex": { "delfoo": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr", undefined), ctx, ["key"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "ent", "foo", ctx.scope.get("key"));
      }
    },
    "nukefoo": {
      "name": "nukefoo",
      "select": {
        "graph": { "pindex": { "nukefoo": { "expr_0": true } } },
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
      "body": function* (ctx, runAction, toPairs) {
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "ent", "foo", undefined);
      }
    }
  }
};