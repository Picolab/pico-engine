module.exports = {
  "rid": "io.picolabs.persistent-index",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey",
      "getBar",
      "getBarKey"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("getFoo", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "foo");
    }));
    ctx.scope.set("getFooKey", ctx.mkFunction(["key"], function* (ctx, args) {
      ctx.scope.set("key", args["key"]);
      return yield ctx.modules.get(ctx, "ent", {
        "key": "foo",
        "path": ctx.scope.get("key")
      });
    }));
    ctx.scope.set("getBar", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "app", "bar");
    }));
    ctx.scope.set("getBarKey", ctx.mkFunction(["key"], function* (ctx, args) {
      ctx.scope.set("key", args["key"]);
      return yield ctx.modules.get(ctx, "app", {
        "key": "bar",
        "path": ctx.scope.get("key")
      });
    }));
  },
  "rules": {
    "setfoo": {
      "name": "setfoo",
      "select": {
        "graph": { "pindex": { "setfoo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        yield ctx.modules.set(ctx, "ent", "foo", yield ctx.modules.get(ctx, "event", "attrs"));
      }
    },
    "putfoo": {
      "name": "putfoo",
      "select": {
        "graph": { "pindex": { "putfoo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        ctx.scope.set("value", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["value"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", {
          "key": "foo",
          "path": ctx.scope.get("key")
        }, ctx.scope.get("value"));
      }
    },
    "delfoo": {
      "name": "delfoo",
      "select": {
        "graph": { "pindex": { "delfoo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "ent", {
          "key": "foo",
          "path": ctx.scope.get("key")
        });
      }
    },
    "nukefoo": {
      "name": "nukefoo",
      "select": {
        "graph": { "pindex": { "nukefoo": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        yield ctx.modules.del(ctx, "ent", "foo");
      }
    },
    "setbar": {
      "name": "setbar",
      "select": {
        "graph": { "pindex": { "setbar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        yield ctx.modules.set(ctx, "app", "bar", yield ctx.modules.get(ctx, "event", "attrs"));
      }
    },
    "putbar": {
      "name": "putbar",
      "select": {
        "graph": { "pindex": { "putbar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        ctx.scope.set("value", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["value"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "app", {
          "key": "bar",
          "path": ctx.scope.get("key")
        }, ctx.scope.get("value"));
      }
    },
    "delbar": {
      "name": "delbar",
      "select": {
        "graph": { "pindex": { "delbar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        ctx.scope.set("key", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["key"]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.del(ctx, "app", {
          "key": "bar",
          "path": ctx.scope.get("key")
        });
      }
    },
    "nukebar": {
      "name": "nukebar",
      "select": {
        "graph": { "pindex": { "nukebar": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString, setting) {
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
        yield ctx.modules.del(ctx, "app", "bar");
      }
    }
  }
};