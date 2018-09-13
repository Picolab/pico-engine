module.exports = {
  "rid": "io.picolabs.policies",
  "meta": {
    "shares": [
      "one",
      "two",
      "three"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("one", 1);
    ctx.scope.set("two", 2);
    ctx.scope.set("three", 3);
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "policies": { "foo": { "expr_0": true } } },
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
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "policies": { "bar": { "expr_0": true } } },
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
      }
    },
    "baz": {
      "name": "baz",
      "select": {
        "graph": { "policies": { "baz": { "expr_0": true } } },
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
      }
    },
    "foo2": {
      "name": "foo2",
      "select": {
        "graph": { "other": { "foo": { "expr_0": true } } },
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
      }
    },
    "bar2": {
      "name": "bar2",
      "select": {
        "graph": { "other": { "bar": { "expr_0": true } } },
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
      }
    },
    "baz2": {
      "name": "baz2",
      "select": {
        "graph": { "other": { "baz": { "expr_0": true } } },
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
      }
    }
  }
};