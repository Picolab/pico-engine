module.exports = {
  "rid": "io.picolabs.owner_authentication",
  "meta": {
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.wrangler",
        "alias": "wrangler"
      }],
    "shares": ["__testing"]
  },
  "global": function* (ctx) {
    ctx.scope.set("__testing", {
      "queries": [{
          "name": "__testing",
          "name": "getManifoldPico"
        }],
      "events": [
        {
          "domain": "owner",
          "type": "authenticate",
          "attrs": ["password"]
        },
        {
          "domain": "wrangler",
          "type": "ruleset_added",
          "attrs": []
        }
      ]
    });
    ctx.scope.set("loginAttempt", ctx.mkFunction(["password"], function* (ctx, args) {
      ctx.scope.set("password", args["password"]);
      ctx.scope.set("_password", yield ctx.callKRLstdlib("defaultsTo", [
        yield ctx.modules.get(ctx, "ent", "password"),
        ""
      ]));
      return yield ctx.callKRLstdlib("==", [
        ctx.scope.get("_password"),
        ctx.scope.get("password")
      ]);
    }));
  },
  "rules": {
    "channel_needed": {
      "name": "channel_needed",
      "select": {
        "graph": { "wrangler": { "ruleset_added": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            if (!(yield ctx.callKRLstdlib("><", [
                yield ctx.callKRLstdlib("klog", [
                  yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rids"]),
                  "rids"
                ]),
                yield ctx.callKRLstdlib("klog", [
                  yield ctx.modules.get(ctx, "meta", "rid"),
                  "meta rid"
                ])
              ])))
              return false;
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
        ctx.scope.set("parent_eci", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "wrangler", "parent_eci"), ctx, []),
            "parent"
          ]),
          "parent eci"
        ]));
        var fired = ctx.scope.get("parent_eci");
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            yield ctx.modules.get(ctx, "meta", "picoId"),
            yield ctx.callKRLstdlib("+", [
              "Router_",
              yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, [])
            ]),
            "route_from_root"
          ], ["new_channel"]);
          yield runAction(ctx, "event", "send", [{
              "eci": ctx.scope.get("parent_eci"),
              "domain": "owner",
              "type": "token_created",
              "attrs": {
                "eci": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("new_channel"),
                  "id"
                ]),
                "event_type": "account",
                "rs_attrs": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, [])
              }
            }], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "password", yield ctx.callKRLstdlib("klog", [
            yield ctx.callKRLstdlib("get", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rs_attrs"]),
              "password"
            ]),
            "Password being saved: "
          ]));
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "password", "toor");
        }
      }
    },
    "authenticate": {
      "name": "authenticate",
      "select": {
        "graph": { "owner": { "authenticate": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        ctx.scope.set("password", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["password"]),
          ""
        ]));
        ctx.scope.set("validPass", yield ctx.applyFn(ctx.scope.get("loginAttempt"), ctx, [ctx.scope.get("password")]));
        var fired = ctx.scope.get("validPass");
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            yield ctx.modules.get(ctx, "meta", "picoId"),
            yield ctx.callKRLstdlib("+", [
              "Authentication_",
              yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, [])
            ]),
            "authenticated"
          ], ["new_channel"]);
          yield runAction(ctx, void 0, "send_directive", [
            "Obtained Token",
            {
              "eci": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("new_channel"),
                "id"
              ]),
              "pico_id": yield ctx.modules.get(ctx, "meta", "picoId")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "owner_new_password": {
      "name": "owner_new_password",
      "select": {
        "graph": { "owner": { "new_password": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
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
        var fired = yield ctx.applyFn(ctx.scope.get("loginAttempt"), ctx, [yield ctx.callKRLstdlib("defaultsTo", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["password"]),
            ""
          ])]);
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "password", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["new_password"]));
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
