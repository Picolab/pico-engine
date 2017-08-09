module.exports = {
  "rid": "io.picolabs.guard-conditions",
  "meta": { "shares": ["getB"] },
  "global": function* (ctx) {
    ctx.scope.set("getB", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "b");
    }));
  },
  "rules": {
    "foo": {
      "name": "foo",
      "select": {
        "graph": { "foo": { "a": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
                  "b",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("b", matches[0]);
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
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "foo",
            { "b": ctx.scope.get("b") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (yield ctx.callKRLstdlib("match", [
            ctx.scope.get("b"),
            new RegExp("foo", "")
          ]))
          yield ctx.modules.set(ctx, "ent", "b", ctx.scope.get("b"));
      }
    },
    "bar": {
      "name": "bar",
      "select": {
        "graph": { "bar": { "a": { "expr_0": true } } },
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
        var foreach0_pairs = toPairs([
          1,
          2,
          3
        ]);
        var foreach0_len = foreach0_pairs.length;
        var foreach0_i;
        for (foreach0_i = 0; foreach0_i < foreach0_len; foreach0_i++) {
          var foreach_is_final = foreach0_i === foreach0_len - 1;
          ctx.scope.set("x", foreach0_pairs[foreach0_i][1]);
          var fired = true;
          if (fired) {
            yield runAction(ctx, void 0, "send_directive", [
              "bar",
              {
                "x": ctx.scope.get("x"),
                "b": yield ctx.modules.get(ctx, "ent", "b")
              }
            ], []);
          }
          if (fired)
            ctx.emit("debug", "fired");
          else
            ctx.emit("debug", "not fired");
          if (typeof foreach_is_final === "undefined" || foreach_is_final)
            yield ctx.modules.set(ctx, "ent", "b", ctx.scope.get("x"));
        }
      }
    },
    "on_final_no_foreach": {
      "name": "on_final_no_foreach",
      "select": {
        "graph": { "on_final_no_foreach": { "a": { "expr_0": true } } },
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
        ctx.scope.set("x", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["x"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "on_final_no_foreach",
            { "x": ctx.scope.get("x") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (typeof foreach_is_final === "undefined" || foreach_is_final)
          yield ctx.modules.set(ctx, "ent", "b", ctx.scope.get("x"));
      }
    }
  }
};