module.exports = {
  "rid": "io.picolabs.did_simulation",
  "meta": {
    "shares": [
      "__testing",
      "servers",
      "serverForDID"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("__testing", {
      "queries": [
        { "name": "__testing" },
        { "name": "servers" },
        {
          "name": "serverForDID",
          "args": ["did"]
        }
      ],
      "events": [
        {
          "domain": "did",
          "type": "npe_added",
          "attrs": ["server"]
        },
        {
          "domain": "did",
          "type": "npe_removed",
          "attrs": ["server"]
        }
      ]
    });
    ctx.scope.set("servers", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "servers");
    }));
    ctx.scope.set("this_npe", ctx.mkFunction([], function* (ctx, args) {
      ctx.scope.set("host", yield ctx.modules.get(ctx, "meta", "host"));
      ctx.scope.set("has_protocol", yield ctx.callKRLstdlib("==", [
        yield ctx.callKRLstdlib("substr", [
          ctx.scope.get("host"),
          0,
          7
        ]),
        "http://"
      ]));
      return ctx.scope.get("has_protocol") ? yield ctx.callKRLstdlib("substr", [
        ctx.scope.get("host"),
        7
      ]) : ctx.scope.get("host");
    }));
    ctx.scope.set("tryServer", ctx.mkFunction([
      "s",
      "path"
    ], function* (ctx, args) {
      ctx.scope.set("s", args["s"]);
      ctx.scope.set("path", args["path"]);
      ctx.scope.set("response", yield ctx.applyFn(yield ctx.modules.get(ctx, "http", "get"), ctx, [yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            "http://",
            ctx.scope.get("s")
          ]),
          ctx.scope.get("path")
        ])]));
      return (yield ctx.callKRLstdlib("==", [
        yield ctx.callKRLstdlib("get", [
          ctx.scope.get("response"),
          "status_code"
        ]),
        200
      ])) ? ctx.scope.get("s") : void 0;
    }));
    ctx.scope.set("serverForDID", ctx.mkFunction(["did"], function* (ctx, args) {
      ctx.scope.set("did", args["did"]);
      ctx.scope.set("path", yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          "/sky/cloud/",
          ctx.scope.get("did")
        ]),
        "/io.picolabs.wrangler/myself"
      ]));
      return (yield ctx.callKRLstdlib(">", [
        yield ctx.callKRLstdlib("length", [yield ctx.callKRLstdlib("filter", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "engine", "listChannels"), ctx, []),
            ctx.mkFunction(["c"], function* (ctx, args) {
              ctx.scope.set("c", args["c"]);
              return yield ctx.callKRLstdlib("==", [
                yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("c"),
                  "id"
                ]),
                ctx.scope.get("did")
              ]);
            })
          ])]),
        0
      ])) ? yield ctx.callKRLstdlib("get", [
        yield ctx.modules.get(ctx, "ent", "servers"),
        [0]
      ]) : yield ctx.callKRLstdlib("get", [
        yield ctx.callKRLstdlib("filter", [
          yield ctx.callKRLstdlib("map", [
            yield ctx.modules.get(ctx, "ent", "servers"),
            ctx.mkFunction(["s"], function* (ctx, args) {
              ctx.scope.set("s", args["s"]);
              return yield ctx.applyFn(ctx.scope.get("tryServer"), ctx, [
                ctx.scope.get("s"),
                ctx.scope.get("path")
              ]);
            })
          ]),
          ctx.mkFunction(["r"], function* (ctx, args) {
            ctx.scope.set("r", args["r"]);
            return ctx.scope.get("r");
          })
        ]),
        [0]
      ]);
    }));
  },
  "rules": {
    "initialize": {
      "name": "initialize",
      "select": {
        "graph": { "wrangler": { "ruleset_added": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            if (!(yield ctx.callKRLstdlib("><", [
                yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rids"]),
                yield ctx.modules.get(ctx, "meta", "rid")
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
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "servers", [yield ctx.applyFn(ctx.scope.get("this_npe"), ctx, [])]);
        yield ctx.modules.set(ctx, "ent", "cache", {});
      }
    },
    "server_additional": {
      "name": "server_additional",
      "select": {
        "graph": { "did": { "npe_added": { "expr_0": true } } },
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
        ctx.scope.set("server", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["server"]));
        ctx.scope.set("not_on_list", !(yield ctx.callKRLstdlib("><", [
          yield ctx.modules.get(ctx, "ent", "servers"),
          ctx.scope.get("server")
        ])));
        var fired = ctx.scope.get("not_on_list");
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "servers", yield ctx.callKRLstdlib("append", [
            yield ctx.modules.get(ctx, "ent", "servers"),
            ctx.scope.get("server")
          ]));
        }
      }
    },
    "server_removed": {
      "name": "server_removed",
      "select": {
        "graph": { "did": { "npe_removed": { "expr_0": true } } },
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
        ctx.scope.set("server", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["server"]));
        ctx.scope.set("on_list", yield ctx.callKRLstdlib("><", [
          yield ctx.modules.get(ctx, "ent", "servers"),
          ctx.scope.get("server")
        ]));
        var fired = ctx.scope.get("on_list");
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "servers", yield ctx.callKRLstdlib("filter", [
            yield ctx.modules.get(ctx, "ent", "servers"),
            ctx.mkFunction(["s"], function* (ctx, args) {
              ctx.scope.set("s", args["s"]);
              return yield ctx.callKRLstdlib("!=", [
                ctx.scope.get("s"),
                ctx.scope.get("server")
              ]);
            })
          ]));
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
