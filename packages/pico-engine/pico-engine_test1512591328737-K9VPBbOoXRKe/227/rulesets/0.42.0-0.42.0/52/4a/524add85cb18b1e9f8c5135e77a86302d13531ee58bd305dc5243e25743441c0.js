module.exports = {
  "rid": "io.picolabs.oauth_server",
  "meta": {
    "shares": [
      "__testing",
      "clients"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("__testing", {
      "queries": [
        { "name": "__testing" },
        { "name": "clients" }
      ],
      "events": [
        {
          "domain": "oauth",
          "type": "register",
          "attrs": [
            "client_id",
            "client_name",
            "redirect_uri",
            "client_uri",
            "client_img",
            "client_rids"
          ]
        },
        {
          "domain": "oauth",
          "type": "authorize",
          "attrs": [
            "client_id",
            "redirect_uri"
          ]
        }
      ]
    });
    ctx.scope.set("getClient", ctx.mkFunction(["client_id"], function* (ctx, args) {
      ctx.scope.set("client_id", args["client_id"]);
      return yield ctx.modules.get(ctx, "ent", {
        "key": "clients",
        "path": ctx.scope.get("client_id")
      });
    }));
    ctx.scope.set("clients", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "clients");
    }));
  },
  "rules": {
    "oauth_register_initialize": {
      "name": "oauth_register_initialize",
      "select": {
        "graph": { "oauth": { "register": { "expr_0": true } } },
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
        var fired = !(yield ctx.modules.get(ctx, "ent", "clients"));
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "clients", {});
        }
      }
    },
    "oauth_register_reminder": {
      "name": "oauth_register_reminder",
      "select": {
        "graph": { "oauth": { "register": { "expr_0": true } } },
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
        ctx.scope.set("client_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_id"]));
        ctx.scope.set("client", yield ctx.applyFn(ctx.scope.get("getClient"), ctx, [ctx.scope.get("client_id")]));
        var fired = yield ctx.callKRLstdlib("><", [
          yield ctx.modules.get(ctx, "ent", "clients"),
          ctx.scope.get("client_id")
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "ok",
            {
              "client_id": ctx.scope.get("client_id"),
              "client_secret": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("client"),
                "client_secret"
              ]),
              "client_img": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("client"),
                "client_img"
              ])
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
        }
      }
    },
    "oauth_register": {
      "name": "oauth_register",
      "select": {
        "graph": { "oauth": { "register": { "expr_0": true } } },
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
        ctx.scope.set("client_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_id"]));
        ctx.scope.set("client_secret", (yield ctx.callKRLstdlib("==", [
          ctx.scope.get("client_id"),
          "oauth-client-1"
        ])) ? "oauth-client-secret-1" : yield ctx.applyFn(yield ctx.modules.get(ctx, "random", "uuid"), ctx, []));
        ctx.scope.set("client_name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_name"]));
        ctx.scope.set("redirect_uri", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["redirect_uri"]));
        ctx.scope.set("client_uri", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_uri"]));
        ctx.scope.set("client_img", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_img"]));
        ctx.scope.set("client_rids", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_rids"]));
        ctx.scope.set("grant_type", "authorization_code");
        ctx.scope.set("scope", "");
        ctx.scope.set("new_client", {
          "client_name": ctx.scope.get("client_name"),
          "client_id": ctx.scope.get("client_id"),
          "client_secret": ctx.scope.get("client_secret"),
          "client_uri": ctx.scope.get("client_uri"),
          "redirect_uris": [ctx.scope.get("redirect_uri")],
          "client_img": ctx.scope.get("client_img"),
          "client_rids": ctx.scope.get("client_rids")
        });
        ctx.scope.set("already_registered", yield ctx.callKRLstdlib("><", [
          yield ctx.modules.get(ctx, "ent", "clients"),
          ctx.scope.get("client_id")
        ]));
        var fired = !ctx.scope.get("already_registered");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "ok",
            {
              "client_id": ctx.scope.get("client_id"),
              "client_secret": ctx.scope.get("client_secret"),
              "client_img": ctx.scope.get("client_img")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", {
            "key": "clients",
            "path": ctx.scope.get("client_id")
          }, ctx.scope.get("new_client"));
        }
      }
    },
    "oauth_authorize_initialize_requests": {
      "name": "oauth_authorize_initialize_requests",
      "select": {
        "graph": { "oauth": { "authorize": { "expr_0": true } } },
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
        var fired = !(yield ctx.modules.get(ctx, "ent", "requests"));
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "requests", {});
        }
      }
    },
    "oauth_authorize_check_client_id": {
      "name": "oauth_authorize_check_client_id",
      "select": {
        "graph": { "oauth": { "authorize": { "expr_0": true } } },
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
        ctx.scope.set("client_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_id"]));
        ctx.scope.set("client", yield ctx.applyFn(ctx.scope.get("getClient"), ctx, [ctx.scope.get("client_id")]));
        var fired = !ctx.scope.get("client");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "error_message": yield ctx.callKRLstdlib("+", [
                "Unknown client ",
                ctx.scope.get("client_id")
              ])
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "client", ctx.scope.get("client"));
        }
      }
    },
    "oauth_authorize_check_redirect_uri": {
      "name": "oauth_authorize_check_redirect_uri",
      "select": {
        "graph": { "oauth": { "authorize": { "expr_0": true } } },
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
        ctx.scope.set("redirect_uri", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["redirect_uri"]));
        var fired = !(yield ctx.callKRLstdlib("><", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "client",
            "path": "redirect_uris"
          }),
          ctx.scope.get("redirect_uri")
        ]));
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            { "error_message": "Invalid redirect URI" }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.del(ctx, "ent", "client");
          ctx.stopRulesetExecution();
        }
      }
    },
    "oauth_authorize_render_approve": {
      "name": "oauth_authorize_render_approve",
      "select": {
        "graph": { "oauth": { "authorize": { "expr_0": true } } },
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
        ctx.scope.set("reqid", yield ctx.applyFn(yield ctx.modules.get(ctx, "random", "uuid"), ctx, []));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "approve",
            {
              "client_id": yield ctx.modules.get(ctx, "ent", {
                "key": "client",
                "path": "client_id"
              }),
              "client_name": yield ctx.modules.get(ctx, "ent", {
                "key": "client",
                "path": "client_name"
              }),
              "client_img": yield ctx.modules.get(ctx, "ent", {
                "key": "client",
                "path": "client_img"
              }),
              "reqid": ctx.scope.get("reqid")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", {
            "key": "requests",
            "path": ctx.scope.get("reqid")
          }, yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []));
          yield ctx.modules.del(ctx, "ent", "client");
          ctx.stopRulesetExecution();
        }
      }
    },
    "oauth_approve_initialize": {
      "name": "oauth_approve_initialize",
      "select": {
        "graph": { "oauth": { "approve": { "expr_0": true } } },
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
        var fired = !(yield ctx.modules.get(ctx, "ent", "codes"));
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "codes", {});
        }
      }
    },
    "oauth_approve_check_query": {
      "name": "oauth_approve_check_query",
      "select": {
        "graph": { "oauth": { "approve": { "expr_0": true } } },
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
        ctx.scope.set("reqid", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["reqid"]));
        ctx.scope.set("query", yield ctx.modules.get(ctx, "ent", {
          "key": "requests",
          "path": ctx.scope.get("reqid")
        }));
        var fired = !ctx.scope.get("query");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            { "error": "No matching authorization request" }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "query", ctx.scope.get("query"));
        }
        yield ctx.modules.set(ctx, "ent", {
          "key": "requests",
          "path": ctx.scope.get("reqid")
        }, void 0);
      }
    },
    "oauth_approve_check_approval": {
      "name": "oauth_approve_check_approval",
      "select": {
        "graph": { "oauth": { "approve": { "expr_0": true } } },
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
        ctx.scope.set("approved", yield ctx.callKRLstdlib("==", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["approve"]),
          "Approve"
        ]));
        var fired = !ctx.scope.get("approved");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "respond",
            {
              "error": "access_denied",
              "redirect_uri": yield ctx.modules.get(ctx, "ent", {
                "key": "query",
                "path": "redirect_uri"
              })
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "query");
        }
      }
    },
    "oauth_approve_check_response_type": {
      "name": "oauth_approve_check_response_type",
      "select": {
        "graph": { "oauth": { "approve": { "expr_0": true } } },
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
        var fired = yield ctx.callKRLstdlib("!=", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "query",
            "path": "response_type"
          }),
          "code"
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "respond",
            {
              "error": "unsupported_response_type",
              "redirect_uri": yield ctx.modules.get(ctx, "ent", {
                "key": "query",
                "path": "redirect_uri"
              })
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "query");
        }
      }
    },
    "oauth_approve_supply_code": {
      "name": "oauth_approve_supply_code",
      "select": {
        "graph": { "oauth": { "approve": { "expr_0": true } } },
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
        ctx.scope.set("code", yield ctx.applyFn(yield ctx.modules.get(ctx, "random", "uuid"), ctx, []));
        ctx.scope.set("owner_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["owner_id"]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "respond",
            {
              "code": ctx.scope.get("code"),
              "state": yield ctx.modules.get(ctx, "ent", {
                "key": "query",
                "path": "state"
              }),
              "redirect_uri": yield ctx.modules.get(ctx, "ent", {
                "key": "query",
                "path": "redirect_uri"
              })
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", {
            "key": "codes",
            "path": ctx.scope.get("code")
          }, {
            "request": yield ctx.modules.get(ctx, "ent", "query"),
            "owner_id": ctx.scope.get("owner_id")
          });
          yield ctx.modules.del(ctx, "ent", "query");
          ctx.stopRulesetExecution();
        }
      }
    },
    "oauth_token_check_client_id": {
      "name": "oauth_token_check_client_id",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        ctx.scope.set("client_id", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_id"]));
        ctx.scope.set("client", yield ctx.applyFn(ctx.scope.get("getClient"), ctx, [ctx.scope.get("client_id")]));
        var fired = !ctx.scope.get("client");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "statusCode": 401,
              "message": "invalid_client"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "client", ctx.scope.get("client"));
        }
      }
    },
    "oauth_token_check_client_secret": {
      "name": "oauth_token_check_client_secret",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        var fired = yield ctx.callKRLstdlib("!=", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "client",
            "path": "client_secret"
          }),
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["client_secret"])
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "statusCode": 401,
              "message": "invalid_client"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "client");
        }
      }
    },
    "oauth_token_check_grant_type": {
      "name": "oauth_token_check_grant_type",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        var fired = yield ctx.callKRLstdlib("!=", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["grant_type"]),
          "authorization_code"
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "statusCode": 400,
              "message": "unsupported_grant_type"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "client");
        }
      }
    },
    "oauth_token_check_code": {
      "name": "oauth_token_check_code",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        ctx.scope.set("code", yield ctx.modules.get(ctx, "ent", {
          "key": "codes",
          "path": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["code"])
        }));
        var fired = !ctx.scope.get("code");
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "statusCode": 400,
              "message": "invalid_grant"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "client");
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "code", ctx.scope.get("code"));
        }
        yield ctx.modules.set(ctx, "ent", {
          "key": "codes",
          "path": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["code"])
        }, void 0);
      }
    },
    "oauth_token_check_code_client_id": {
      "name": "oauth_token_check_code_client_id",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        var fired = yield ctx.callKRLstdlib("!=", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "code",
            "path": [
              "request",
              "client_id"
            ]
          }),
          yield ctx.modules.get(ctx, "ent", {
            "key": "client",
            "path": "client_id"
          })
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "send_directive", [
            "error",
            {
              "statusCode": 400,
              "message": "invalid_grant"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "code");
          yield ctx.modules.del(ctx, "ent", "client");
        }
      }
    },
    "oauth_token_access_token": {
      "name": "oauth_token_access_token",
      "select": {
        "graph": { "oauth": { "token": { "expr_0": true } } },
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
        ctx.scope.set("client_id", yield ctx.modules.get(ctx, "ent", {
          "key": "client",
          "path": "client_id"
        }));
        ctx.scope.set("client_rids", yield ctx.callKRLstdlib("split", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "client",
            "path": "client_rids"
          }),
          new RegExp(";", "")
        ]));
        ctx.scope.set("owner_id", yield ctx.callKRLstdlib("klog", [
          yield ctx.modules.get(ctx, "ent", {
            "key": "code",
            "path": "owner_id"
          }),
          "owner_id in oauth_token_access_token"
        ]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            ctx.scope.get("owner_id"),
            ctx.scope.get("client_id"),
            "oauth"
          ], ["new_channel"]);
          yield runAction(ctx, "engine", "installRuleset", [
            ctx.scope.get("owner_id"),
            ctx.scope.get("client_rids")
          ], []);
          yield runAction(ctx, "event", "send", [{
              "eci": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("new_channel"),
                "id"
              ]),
              "domain": "wrangler",
              "type": "ruleset_added",
              "attrs": { "rids": ctx.scope.get("client_rids") }
            }], []);
          yield runAction(ctx, void 0, "send_directive", [
            "ok",
            {
              "access_token": yield ctx.callKRLstdlib("get", [
                ctx.scope.get("new_channel"),
                "id"
              ]),
              "token_type": "Bearer"
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.stopRulesetExecution();
          yield ctx.modules.del(ctx, "ent", "code");
          yield ctx.modules.del(ctx, "ent", "client");
        }
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
