module.exports = {
  "rid": "io.picolabs.account_management",
  "meta": {
    "shares": ["__testing"],
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.wrangler",
        "alias": "wrangler"
      }]
  },
  "global": function* (ctx) {
    ctx.scope.set("__testing", {
      "queries": [{ "name": "__testing" }],
      "events": [
        {
          "domain": "owner",
          "type": "creation",
          "attrs": [
            "name",
            "password"
          ]
        },
        {
          "domain": "wrangler",
          "type": "ruleset_added",
          "attrs": ["rids"]
        },
        {
          "domain": "owner",
          "type": "eci_requested",
          "attrs": ["name"]
        }
      ]
    });
    ctx.scope.set("nameExists", ctx.mkFunction(["ownername"], function* (ctx, args) {
      ctx.scope.set("ownername", args["ownername"]);
      return yield ctx.callKRLstdlib("><", [
        yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.modules.get(ctx, "ent", "owners"),
          {}
        ]),
        ctx.scope.get("ownername")
      ]);
    }));
    ctx.scope.set("getEciFromOwnerName", ctx.mkFunction(["name"], function* (ctx, args) {
      ctx.scope.set("name", args["name"]);
      ctx.scope.set("exists", yield ctx.applyFn(ctx.scope.get("nameExists"), ctx, [ctx.scope.get("name")]));
      return ctx.scope.get("exists") ? yield ctx.callKRLstdlib("get", [
        yield ctx.modules.get(ctx, "ent", {
          "key": "owners",
          "path": ctx.scope.get("name")
        }),
        "eci"
      ]) : "No user found";
    }));
  },
  "rules": {
    "create_admin": {
      "name": "create_admin",
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
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            yield ctx.modules.get(ctx, "meta", "picoId"),
            yield ctx.callKRLstdlib("+", [
              "Router_",
              yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, [])
            ]),
            "route_to_owner"
          ], ["new_channel"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "owners", yield ctx.callKRLstdlib("put", [
            yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.modules.get(ctx, "ent", "owners"),
              {}
            ]),
            "root",
            {
              "eci": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("new_channel"),
                "id"
              ])
            }
          ]));
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "install_rulesets_requested",
            "attributes": yield ctx.callKRLstdlib("put", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
              { "rids": "io.picolabs.owner_authentication" }
            ]),
            "for_rid": undefined
          });
        }
      }
    },
    "eci_from_owner_name": {
      "name": "eci_from_owner_name",
      "select": {
        "graph": { "owner": { "eci_requested": { "expr_0": true } } },
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
        ctx.scope.set("eciResult", yield ctx.applyFn(ctx.scope.get("getEciFromOwnerName"), ctx, [yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["owner_id"])]));
        var fired = yield ctx.callKRLstdlib("!=", [
          ctx.scope.get("eciResult"),
          "No user found"
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "Returning eci from owner name",
            { "eci": ctx.scope.get("eciResult") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "owner",
            "type": "login_attempt",
            "attributes": yield ctx.callKRLstdlib("put", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
              { "timestamp": yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, []) }
            ]),
            "for_rid": undefined
          });
        }
        if (!fired) {
          yield ctx.raiseEvent({
            "domain": "owner",
            "type": "login_attempt_failed",
            "attributes": yield ctx.callKRLstdlib("put", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
              { "timestamp": yield ctx.applyFn(yield ctx.modules.get(ctx, "time", "now"), ctx, []) }
            ]),
            "for_rid": undefined
          });
        }
      }
    },
    "create_owner": {
      "name": "create_owner",
      "select": {
        "graph": { "owner": { "creation": { "expr_0": true } } },
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
        ctx.scope.set("name", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]),
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["owner_id"])
        ]));
        ctx.scope.set("password", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["password"]));
        ctx.scope.set("exists", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(ctx.scope.get("nameExists"), ctx, [ctx.scope.get("name")]),
          "nameExists"
        ]));
        var fired = !ctx.scope.get("exists");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "Creating owner",
            {
              "ownername": ctx.scope.get("name"),
              "method": "password"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "new_child_request",
            "attributes": yield ctx.callKRLstdlib("put", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
              {
                "event_type": "account",
                "rids": "io.picolabs.owner_authentication",
                "password": ctx.scope.get("password"),
                "name": ctx.scope.get("name")
              }
            ]),
            "for_rid": undefined
          });
        }
        if (!fired) {
          yield ctx.raiseEvent({
            "domain": "owner",
            "type": "creation_failure",
            "attributes": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
            "for_rid": undefined
          });
        }
      }
    },
    "owner_name_taken": {
      "name": "owner_name_taken",
      "select": {
        "graph": { "owner": { "creation_failure": { "expr_0": true } } },
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
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "ownername taken",
            { "ownername": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]) }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "owner_token": {
      "name": "owner_token",
      "select": {
        "graph": { "owner": { "token_created": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("account", "").exec(getAttrString(ctx, "event_type"));
            if (!m)
              return false;
            for (j = 1; j < m.length; j++)
              matches.push(m[j]);
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
        ctx.scope.set("a", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
          "all attrs: "
        ]));
        ctx.scope.set("rs_attrs", yield ctx.callKRLstdlib("get", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rs_attrs"]),
          "rs_attrs"
        ]));
        ctx.scope.set("new_owner", { "eci": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["eci"]) });
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "owners", yield ctx.callKRLstdlib("put", [
            yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.modules.get(ctx, "ent", "owners"),
              {}
            ]),
            yield ctx.callKRLstdlib("get", [
              ctx.scope.get("rs_attrs"),
              "name"
            ]),
            ctx.scope.get("new_owner")
          ]));
        }
      }
    },
    "owner_pico_not_found": {
      "name": "owner_pico_not_found",
      "select": {
        "graph": { "owner": { "eci_requested": { "expr_0": true } } },
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
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "here it is",
            {
              "owner_id": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["owner_id"]),
              "method": "password"
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
