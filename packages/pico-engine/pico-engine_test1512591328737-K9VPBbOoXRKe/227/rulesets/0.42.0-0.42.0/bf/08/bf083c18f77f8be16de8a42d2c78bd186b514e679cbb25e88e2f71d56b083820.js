module.exports = {
  "rid": "io.picolabs.subscription",
  "meta": {
    "name": "subscriptions",
    "description": "\n      subscription ruleset for CS462 lab.\n    ",
    "author": "CS462 TA",
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.wrangler",
        "alias": "wrangler"
      }],
    "provides": [
      "getSubscriptions",
      "klogtesting",
      "skyQuery"
    ],
    "shares": [
      "getSubscriptions",
      "klogtesting",
      "skyQuery"
    ],
    "logging": true
  },
  "global": function* (ctx) {
    ctx.scope.set("skyQuery", ctx.mkFunction([
      "eci",
      "mod",
      "func",
      "params",
      "_host",
      "_path",
      "_root_url"
    ], function* (ctx, args) {
      ctx.scope.set("eci", args["eci"]);
      ctx.scope.set("mod", args["mod"]);
      ctx.scope.set("func", args["func"]);
      ctx.scope.set("params", args["params"]);
      ctx.scope.set("_host", args["_host"]);
      ctx.scope.set("_path", args["_path"]);
      ctx.scope.set("_root_url", args["_root_url"]);
      ctx.scope.set("createRootUrl", ctx.mkFunction([
        "_host",
        "_path"
      ], function* (ctx, args) {
        ctx.scope.set("_host", args["_host"]);
        ctx.scope.set("_path", args["_path"]);
        ctx.scope.set("host", ctx.scope.get("_host") || (yield ctx.modules.get(ctx, "meta", "host")));
        ctx.scope.set("path", ctx.scope.get("_path") || "/sky/cloud/");
        ctx.scope.set("root_url", yield ctx.callKRLstdlib("+", [
          ctx.scope.get("host"),
          ctx.scope.get("path")
        ]));
        return ctx.scope.get("root_url");
      }));
      ctx.scope.set("root_url", ctx.scope.get("_root_url") || (yield ctx.applyFn(ctx.scope.get("createRootUrl"), ctx, [
        ctx.scope.get("_host"),
        ctx.scope.get("_path")
      ])));
      ctx.scope.set("web_hook", yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            yield ctx.callKRLstdlib("+", [
              yield ctx.callKRLstdlib("+", [
                ctx.scope.get("root_url"),
                ctx.scope.get("eci")
              ]),
              "/"
            ]),
            ctx.scope.get("mod")
          ]),
          "/"
        ]),
        ctx.scope.get("func")
      ]));
      ctx.scope.set("response", yield ctx.callKRLstdlib("klog", [
        yield ctx.applyFn(yield ctx.modules.get(ctx, "http", "get"), ctx, [
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("web_hook"),
            "URL"
          ]),
          yield ctx.callKRLstdlib("put", [
            {},
            ctx.scope.get("params")
          ])
        ]),
        "response "
      ]));
      ctx.scope.set("status", yield ctx.callKRLstdlib("get", [
        ctx.scope.get("response"),
        "status_code"
      ]));
      ctx.scope.set("error_info", {
        "error": "sky query request was unsuccesful.",
        "httpStatus": {
          "code": ctx.scope.get("status"),
          "message": yield ctx.callKRLstdlib("get", [
            ctx.scope.get("response"),
            "status_line"
          ])
        }
      });
      ctx.scope.set("response_content", yield ctx.callKRLstdlib("decode", [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("response"),
          "content"
        ])]));
      ctx.scope.set("response_error", (yield ctx.callKRLstdlib("==", [
        yield ctx.callKRLstdlib("typeof", [ctx.scope.get("response_content")]),
        "Map"
      ])) && !(yield ctx.callKRLstdlib("isnull", [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("response_content"),
          "error"
        ])])) ? yield ctx.callKRLstdlib("get", [
        ctx.scope.get("response_content"),
        "error"
      ]) : 0);
      ctx.scope.set("response_error_str", (yield ctx.callKRLstdlib("==", [
        yield ctx.callKRLstdlib("typeof", [ctx.scope.get("response_content")]),
        "Map"
      ])) && !(yield ctx.callKRLstdlib("isnull", [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("response_content"),
          "error_str"
        ])])) ? yield ctx.callKRLstdlib("get", [
        ctx.scope.get("response_content"),
        "error_str"
      ]) : 0);
      ctx.scope.set("error", yield ctx.callKRLstdlib("put", [
        ctx.scope.get("error_info"),
        {
          "skyQueryError": ctx.scope.get("response_error"),
          "skyQueryErrorMsg": ctx.scope.get("response_error_str"),
          "skyQueryReturnValue": ctx.scope.get("response_content")
        }
      ]));
      ctx.scope.set("is_bad_response", (yield ctx.callKRLstdlib("isnull", [ctx.scope.get("response_content")])) || (yield ctx.callKRLstdlib("==", [
        ctx.scope.get("response_content"),
        "null"
      ])) || ctx.scope.get("response_error") || ctx.scope.get("response_error_str"));
      return (yield ctx.callKRLstdlib("==", [
        ctx.scope.get("status"),
        200
      ])) && !ctx.scope.get("is_bad_response") ? ctx.scope.get("response_content") : ctx.scope.get("error");
    }));
    ctx.scope.set("getSelf", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.applyFn(yield ctx.modules.get(ctx, "wrangler", "myself"), ctx, []);
    }));
    ctx.scope.set("getSubscriptions", ctx.mkFunction([
      "collectBy",
      "filterValue"
    ], function* (ctx, args) {
      ctx.scope.set("collectBy", args["collectBy"]);
      ctx.scope.set("filterValue", args["filterValue"]);
      ctx.scope.set("subs", yield ctx.callKRLstdlib("defaultsTo", [
        yield ctx.modules.get(ctx, "ent", "subscriptions"),
        {},
        "no subscriptions"
      ]));
      return (yield ctx.callKRLstdlib("isnull", [ctx.scope.get("collectBy")])) ? ctx.scope.get("subs") : yield ctx.applyFn(ctx.mkFunction([], function* (ctx, args) {
        ctx.scope.set("subArray", yield ctx.callKRLstdlib("map", [
          yield ctx.callKRLstdlib("keys", [ctx.scope.get("subs")]),
          ctx.mkFunction(["name"], function* (ctx, args) {
            ctx.scope.set("name", args["name"]);
            return yield ctx.callKRLstdlib("put", [
              {},
              ctx.scope.get("name"),
              yield ctx.callKRLstdlib("get", [
                ctx.scope.get("subs"),
                ctx.scope.get("name")
              ])
            ]);
          })
        ]));
        return (yield ctx.callKRLstdlib("isnull", [ctx.scope.get("filterValue")])) ? yield ctx.callKRLstdlib("collect", [
          ctx.scope.get("subArray"),
          ctx.mkFunction(["sub"], function* (ctx, args) {
            ctx.scope.set("sub", args["sub"]);
            return yield ctx.callKRLstdlib("get", [
              yield ctx.callKRLstdlib("get", [
                yield ctx.callKRLstdlib("values", [ctx.scope.get("sub")]),
                [0]
              ]),
              ctx.scope.get("collectBy")
            ]);
          })
        ]) : yield ctx.callKRLstdlib("filter", [
          ctx.scope.get("subArray"),
          ctx.mkFunction(["sub"], function* (ctx, args) {
            ctx.scope.set("sub", args["sub"]);
            return yield ctx.callKRLstdlib("==", [
              yield ctx.callKRLstdlib("get", [
                yield ctx.callKRLstdlib("get", [
                  yield ctx.callKRLstdlib("values", [ctx.scope.get("sub")]),
                  [0]
                ]),
                ctx.scope.get("collectBy")
              ]),
              ctx.scope.get("filterValue")
            ]);
          })
        ]);
      }), ctx, []);
    }));
    ctx.scope.set("standardOut", ctx.mkFunction(["message"], function* (ctx, args) {
      ctx.scope.set("message", args["message"]);
      ctx.scope.set("msg", yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          ">> ",
          ctx.scope.get("message")
        ]),
        " results: >>"
      ]));
      return ctx.scope.get("msg");
    }));
    ctx.scope.set("standardError", ctx.mkFunction(["message"], function* (ctx, args) {
      ctx.scope.set("message", args["message"]);
      ctx.scope.set("error", yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          ">> error: ",
          ctx.scope.get("message")
        ]),
        " >>"
      ]));
      return ctx.scope.get("error");
    }));
    ctx.scope.set("randomSubscriptionName", ctx.mkFunction([
      "name_space",
      "name_base"
    ], function* (ctx, args) {
      ctx.scope.set("name_space", args["name_space"]);
      ctx.scope.set("name_base", args["name_base"]);
      ctx.scope.set("base", yield ctx.callKRLstdlib("defaultsTo", [
        ctx.scope.get("name_base"),
        ""
      ]));
      ctx.scope.set("subscriptions", yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []));
      ctx.scope.set("array", yield ctx.callKRLstdlib("klog", [
        yield ctx.callKRLstdlib("map", [
          yield ctx.callKRLstdlib("range", [
            1,
            5
          ]),
          ctx.mkFunction(["n"], function* (ctx, args) {
            ctx.scope.set("n", args["n"]);
            return yield ctx.applyFn(yield ctx.modules.get(ctx, "random", "word"), ctx, []);
          })
        ]),
        "randomWords"
      ]));
      ctx.scope.set("names", yield ctx.callKRLstdlib("filter", [
        ctx.scope.get("array"),
        ctx.mkFunction(["name"], function* (ctx, args) {
          ctx.scope.set("name", args["name"]);
          return yield ctx.callKRLstdlib("isnull", [yield ctx.callKRLstdlib("get", [
              ctx.scope.get("subscriptions"),
              yield ctx.callKRLstdlib("+", [
                yield ctx.callKRLstdlib("+", [
                  yield ctx.callKRLstdlib("+", [
                    ctx.scope.get("name_space"),
                    ":"
                  ]),
                  ctx.scope.get("base")
                ]),
                ctx.scope.get("name")
              ])
            ])]);
        })
      ]));
      return (yield ctx.callKRLstdlib(">", [
        yield ctx.callKRLstdlib("length", [ctx.scope.get("names")]),
        0
      ])) ? yield ctx.callKRLstdlib("klog", [
        yield ctx.callKRLstdlib("get", [
          ctx.scope.get("names"),
          [0]
        ]),
        "uniqueName"
      ]) : yield ctx.applyFn(ctx.scope.get("randomSubscriptionName"), ctx, [
        ctx.scope.get("name_space"),
        yield ctx.callKRLstdlib("+", [
          ctx.scope.get("base"),
          "_"
        ])
      ]);
    }));
    ctx.scope.set("checkSubscriptionName", ctx.mkFunction([
      "name",
      "name_space",
      "subscriptions"
    ], function* (ctx, args) {
      ctx.scope.set("name", args["name"]);
      ctx.scope.set("name_space", args["name_space"]);
      ctx.scope.set("subscriptions", args["subscriptions"]);
      return yield ctx.callKRLstdlib("isnull", [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("subscriptions"),
          yield ctx.callKRLstdlib("+", [
            yield ctx.callKRLstdlib("+", [
              ctx.scope.get("name_space"),
              ":"
            ]),
            ctx.scope.get("name")
          ])
        ])]);
    }));
    ctx.scope.set("mapWithHost", ctx.mkFunction([
      "map",
      "host"
    ], function* (ctx, args) {
      ctx.scope.set("map", args["map"]);
      ctx.scope.set("host", args["host"]);
      return (yield ctx.callKRLstdlib("isnull", [ctx.scope.get("host")])) ? ctx.scope.get("map") : yield ctx.callKRLstdlib("put", [
        ctx.scope.get("map"),
        "subscriber_host",
        ctx.scope.get("host")
      ]);
    }));
  },
  "rules": {
    "subscribeNameCheck": {
      "name": "subscribeNameCheck",
      "select": {
        "graph": { "wrangler": { "subscription": { "expr_0": true } } },
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
        ctx.scope.set("name_space", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name_space"]),
          "shared",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["name_space"])
        ]));
        ctx.scope.set("name", (yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"])) || (yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(ctx.scope.get("randomSubscriptionName"), ctx, [ctx.scope.get("name_space")]),
          "random name"
        ])));
        ctx.scope.set("attrs", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
            {
              "name_space": ctx.scope.get("name_space"),
              "name": ctx.scope.get("name")
            }
          ]),
          "subscribeNameCheck attrs"
        ]));
        var fired = yield ctx.applyFn(ctx.scope.get("checkSubscriptionName"), ctx, [
          ctx.scope.get("name"),
          ctx.scope.get("name_space"),
          yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, [])
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "checked_name_subscription",
            "attributes": ctx.scope.get("attrs"),
            "for_rid": undefined
          });
        }
        if (!fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            ">> could not send request #{name} >>"
          ]);
        }
      }
    },
    "createMySubscription": {
      "name": "createMySubscription",
      "select": {
        "graph": { "wrangler": { "checked_name_subscription": { "expr_0": true } } },
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
        ctx.scope.set("logs", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
          "createMySubscription attrs"
        ]));
        ctx.scope.set("name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]));
        ctx.scope.set("name_space", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name_space"]));
        ctx.scope.set("my_role", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["my_role"]),
          "peer",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["my_role"])
        ]));
        ctx.scope.set("subscriber_host", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_host"]));
        ctx.scope.set("subscriber_role", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_role"]),
          "peer",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["subscriber_role"])
        ]));
        ctx.scope.set("subscriber_eci", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_eci"]),
          "no_subscriber_eci",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["subscriber_eci"])
        ]));
        ctx.scope.set("channel_type", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_type"]),
          "subs",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["type"])
        ]));
        ctx.scope.set("attributes", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["attrs"]),
          "status",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["attributes "])
        ]));
        ctx.scope.set("unique_name", yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            ctx.scope.get("name_space"),
            ":"
          ]),
          ctx.scope.get("name")
        ]));
        ctx.scope.set("logs", yield ctx.callKRLstdlib("klog", [
          ctx.scope.get("unique_name"),
          "name"
        ]));
        ctx.scope.set("pending_entry", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(ctx.scope.get("mapWithHost"), ctx, [
            {
              "subscription_name": ctx.scope.get("name"),
              "name_space": ctx.scope.get("name_space"),
              "relationship": yield ctx.callKRLstdlib("+", [
                yield ctx.callKRLstdlib("+", [
                  ctx.scope.get("my_role"),
                  "<->"
                ]),
                ctx.scope.get("subscriber_role")
              ]),
              "my_role": ctx.scope.get("my_role"),
              "subscriber_role": ctx.scope.get("subscriber_role"),
              "subscriber_eci": ctx.scope.get("subscriber_eci"),
              "status": "outbound",
              "attributes": ctx.scope.get("attributes")
            },
            ctx.scope.get("subscriber_host")
          ]),
          "pending entry"
        ]));
        ctx.scope.set("options", yield ctx.callKRLstdlib("klog", [
          {
            "name": ctx.scope.get("unique_name"),
            "eci_type": ctx.scope.get("channel_type"),
            "attributes": ctx.scope.get("pending_entry")
          },
          "options"
        ]));
        var fired = yield ctx.callKRLstdlib("!=", [
          ctx.scope.get("subscriber_eci"),
          "no_subscriber_eci"
        ]);
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            yield ctx.callKRLstdlib("get", [
              yield ctx.applyFn(ctx.scope.get("getSelf"), ctx, []),
              ["id"]
            ]),
            ctx.scope.get("options")["name"],
            ctx.scope.get("options")["eci_type"]
          ], ["channel"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("newSubscription", {
            "eci": ctx.scope.get("channel")["id"],
            "name": ctx.scope.get("channel")["name"],
            "type": ctx.scope.get("channel")["type"],
            "attributes": ctx.scope.get("options")["attributes"]
          });
          ctx.scope.set("updatedSubs", yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
            [ctx.scope.get("newSubscription")["name"]],
            ctx.scope.get("newSubscription")
          ]));
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("newSubscription"),
            ">> successful created subscription request >>"
          ]);
          yield ctx.modules.set(ctx, "ent", "subscriptions", ctx.scope.get("updatedSubs"));
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "pending_subscription",
            "attributes": yield ctx.applyFn(ctx.scope.get("mapWithHost"), ctx, [
              {
                "status": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "status"
                ]),
                "channel_name": ctx.scope.get("unique_name"),
                "channel_type": ctx.scope.get("channel_type"),
                "name": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "subscription_name"
                ]),
                "name_space": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "name_space"
                ]),
                "relationship": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "relationship"
                ]),
                "my_role": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "my_role"
                ]),
                "subscriber_role": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "subscriber_role"
                ]),
                "subscriber_eci": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "subscriber_eci"
                ]),
                "inbound_eci": ctx.scope.get("newSubscription")["eci"],
                "attributes": yield ctx.callKRLstdlib("get", [
                  ctx.scope.get("pending_entry"),
                  "attributes"
                ])
              },
              ctx.scope.get("subscriber_host")
            ]),
            "for_rid": undefined
          });
        }
        if (!fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            ">> failed to create subscription request, no subscriber_eci provieded >>"
          ]);
        }
      }
    },
    "sendSubscribersSubscribe": {
      "name": "sendSubscribersSubscribe",
      "select": {
        "graph": { "wrangler": { "pending_subscription": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("outbound", "").exec(getAttrString(ctx, "status"));
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
        ctx.scope.set("logs", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
          "sendSubscribersSubscribe attrs"
        ]));
        ctx.scope.set("name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]));
        ctx.scope.set("name_space", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name_space"]));
        ctx.scope.set("subscriber_host", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_host"]));
        ctx.scope.set("my_role", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["my_role"]));
        ctx.scope.set("subscriber_role", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_role"]));
        ctx.scope.set("subscriber_eci", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_eci"]),
          "no_subscriber_eci",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["subscriber_eci"])
        ]));
        ctx.scope.set("channel_type", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_type"]));
        ctx.scope.set("attributes", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["attributes"]));
        ctx.scope.set("inbound_eci", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["inbound_eci"]));
        ctx.scope.set("channel_name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]));
        var fired = yield ctx.callKRLstdlib("!=", [
          ctx.scope.get("subscriber_eci"),
          "no_subscriber_eci"
        ]);
        if (fired) {
          yield runAction(ctx, "event", "send", [
            {
              "eci": ctx.scope.get("subscriber_eci"),
              "eid": "subscriptionsRequest",
              "domain": "wrangler",
              "type": "pending_subscription",
              "attrs": yield ctx.applyFn(ctx.scope.get("mapWithHost"), ctx, [
                {
                  "name": ctx.scope.get("name"),
                  "name_space": ctx.scope.get("name_space"),
                  "relationship": yield ctx.callKRLstdlib("+", [
                    yield ctx.callKRLstdlib("+", [
                      ctx.scope.get("subscriber_role"),
                      "<->"
                    ]),
                    ctx.scope.get("my_role")
                  ]),
                  "my_role": ctx.scope.get("subscriber_role"),
                  "subscriber_role": ctx.scope.get("my_role"),
                  "outbound_eci": ctx.scope.get("inbound_eci"),
                  "status": "inbound",
                  "channel_type": ctx.scope.get("channel_type"),
                  "channel_name": ctx.scope.get("channel_name"),
                  "attributes": ctx.scope.get("attributes")
                },
                (yield ctx.callKRLstdlib("isnull", [ctx.scope.get("subscriber_host")])) ? void 0 : yield ctx.modules.get(ctx, "meta", "host")
              ])
            },
            ctx.scope.get("subscriber_host")
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("subscriber_eci"),
            ">> sent subscription request to >>"
          ]);
        }
        if (!fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            ">> failed to send subscription request >>"
          ]);
        }
      }
    },
    "addOutboundPendingSubscription": {
      "name": "addOutboundPendingSubscription",
      "select": {
        "graph": { "wrangler": { "pending_subscription": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("outbound", "").exec(getAttrString(ctx, "status"));
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
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.raiseEvent({
          "domain": "wrangler",
          "type": "outbound_pending_subscription_added",
          "attributes": yield ctx.callKRLstdlib("klog", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
            yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, ["successful outgoing pending subscription >>"])
          ]),
          "for_rid": undefined
        });
      }
    },
    "InboundNameCheck": {
      "name": "InboundNameCheck",
      "select": {
        "graph": { "wrangler": { "pending_subscription": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("inbound", "").exec(getAttrString(ctx, "status"));
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
        ctx.scope.set("name_space", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name_space"]));
        ctx.scope.set("name", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]),
          "InboundNameCheck name"
        ]));
        ctx.scope.set("subscriber_host", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_host"]));
        ctx.scope.set("outbound_eci", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["outbound_eci"]));
        ctx.scope.set("attrs", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []));
        var fired = yield ctx.callKRLstdlib("!=", [
          yield ctx.applyFn(ctx.scope.get("checkSubscriptionName"), ctx, [
            ctx.scope.get("name"),
            ctx.scope.get("name_space"),
            yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, [])
          ]),
          true
        ]);
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("attrs"),
            ">> could not accept request #{name} >>"
          ]);
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "send"), ctx, [
            {
              "eci": ctx.scope.get("outbound_eci"),
              "eid": "pending_subscription",
              "domain": "wrangler",
              "type": "outbound_subscription_cancellation",
              "attrs": yield ctx.callKRLstdlib("put", [
                ctx.scope.get("attrs"),
                { "failed_request": "not a unique subscription" }
              ])
            },
            ctx.scope.get("subscriber_host")
          ]);
        }
        if (!fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("attrs"),
            "InboundNameCheck attrs"
          ]);
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "checked_name_inbound",
            "attributes": ctx.scope.get("attrs"),
            "for_rid": undefined
          });
        }
      }
    },
    "addInboundPendingSubscription": {
      "name": "addInboundPendingSubscription",
      "select": {
        "graph": { "wrangler": { "checked_name_inbound": { "expr_0": true } } },
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
        ctx.scope.set("channel_name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]));
        ctx.scope.set("channel_type", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_type"]));
        ctx.scope.set("status", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["status"]),
          "",
          yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["status"])
        ]));
        ctx.scope.set("subscriber_host", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_host"]));
        ctx.scope.set("pending_subscriptions", yield ctx.applyFn(ctx.scope.get("mapWithHost"), ctx, [
          {
            "subscription_name": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name"]),
            "name_space": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["name_space"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["name_space"])
            ]),
            "relationship": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["relationship"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["relationship"])
            ]),
            "my_role": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["my_role"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["my_role"])
            ]),
            "subscriber_role": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscriber_role"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["subscriber_role"])
            ]),
            "outbound_eci": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["outbound_eci"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["outbound_eci"])
            ]),
            "status": ctx.scope.get("status"),
            "attributes": yield ctx.callKRLstdlib("defaultsTo", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["attributes"]),
              "",
              yield ctx.applyFn(ctx.scope.get("standardError"), ctx, ["attributes"])
            ])
          },
          ctx.scope.get("subscriber_host")
        ]));
        ctx.scope.set("unique_name", ctx.scope.get("channel_name"));
        ctx.scope.set("options", {
          "name": ctx.scope.get("unique_name"),
          "eci_type": ctx.scope.get("channel_type"),
          "attributes": ctx.scope.get("pending_subscriptions")
        });
        var fired = yield ctx.applyFn(ctx.scope.get("checkSubscriptionName"), ctx, [ctx.scope.get("unique_name")]);
        if (fired) {
          yield runAction(ctx, "engine", "newChannel", [
            yield ctx.callKRLstdlib("get", [
              yield ctx.applyFn(ctx.scope.get("getSelf"), ctx, []),
              ["id"]
            ]),
            ctx.scope.get("options")["name"],
            ctx.scope.get("options")["eci_type"]
          ], ["channel"]);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          ctx.scope.set("newSubscription", {
            "eci": ctx.scope.get("channel")["id"],
            "name": ctx.scope.get("channel")["name"],
            "type": ctx.scope.get("channel")["type"],
            "attributes": ctx.scope.get("options")["attributes"]
          });
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, ["successful pending incoming"])
          ]);
          yield ctx.modules.set(ctx, "ent", "subscriptions", yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
            [ctx.scope.get("newSubscription")["name"]],
            ctx.scope.get("newSubscription")
          ]));
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "inbound_pending_subscription_added",
            "attributes": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
            "for_rid": undefined
          });
        }
      }
    },
    "approveInboundPendingSubscription": {
      "name": "approveInboundPendingSubscription",
      "select": {
        "graph": { "wrangler": { "pending_subscription_approval": { "expr_0": true } } },
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
        ctx.scope.set("logs", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
          "approveInboundPendingSubscription attrs"
        ]));
        ctx.scope.set("channel_name", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscription_name"]),
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]),
          "channel_name used "
        ]));
        ctx.scope.set("subs", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
          "subscriptions"
        ]));
        ctx.scope.set("subscriber_host", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            [
              ctx.scope.get("channel_name"),
              "attributes",
              "subscriber_host"
            ]
          ]),
          "host of other pico if different"
        ]));
        ctx.scope.set("inbound_eci", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            [
              ctx.scope.get("channel_name"),
              "eci"
            ]
          ]),
          "subscription inbound"
        ]));
        ctx.scope.set("outbound_eci", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            [
              ctx.scope.get("channel_name"),
              "attributes",
              "outbound_eci"
            ]
          ]),
          "subscriptions outbound"
        ]));
        var fired = ctx.scope.get("outbound_eci");
        if (fired) {
          yield runAction(ctx, "event", "send", [
            {
              "eci": ctx.scope.get("outbound_eci"),
              "eid": "approvePendingSubscription",
              "domain": "wrangler",
              "type": "pending_subscription_approved",
              "attrs": {
                "outbound_eci": ctx.scope.get("inbound_eci"),
                "status": "outbound",
                "channel_name": ctx.scope.get("channel_name")
              }
            },
            ctx.scope.get("subscriber_host")
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, [">> Sent accepted subscription events >>"])
          ]);
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "pending_subscription_approved",
            "attributes": {
              "channel_name": ctx.scope.get("channel_name"),
              "status": "inbound"
            },
            "for_rid": undefined
          });
        }
        if (!fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("logs"),
            yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, [">> Failed to send accepted subscription events >>"])
          ]);
        }
      }
    },
    "addOutboundSubscription": {
      "name": "addOutboundSubscription",
      "select": {
        "graph": { "wrangler": { "pending_subscription_approved": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("outbound", "").exec(getAttrString(ctx, "status"));
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
        ctx.scope.set("status", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["status"]));
        ctx.scope.set("channel_name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]));
        ctx.scope.set("subs", yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []));
        ctx.scope.set("subscription", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            ctx.scope.get("channel_name")
          ]),
          "subscription addSubscription"
        ]));
        ctx.scope.set("attributes", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subscription"),
            ["attributes"]
          ]),
          "attributes subscriptions"
        ]));
        ctx.scope.set("attr", yield ctx.callKRLstdlib("put", [
          ctx.scope.get("attributes"),
          { "status": "subscribed" }
        ]));
        ctx.scope.set("attrs", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("put", [
            ctx.scope.get("attr"),
            { "outbound_eci": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["outbound_eci"]) }
          ]),
          "put outgoing outbound_eci: "
        ]));
        ctx.scope.set("updatedSubscription", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("put", [
            ctx.scope.get("subscription"),
            { "attributes": ctx.scope.get("attrs") }
          ]),
          "updated subscriptions"
        ]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("subscription"),
            yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, [">> success >>"])
          ]);
          yield ctx.modules.set(ctx, "ent", "subscriptions", yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
            [ctx.scope.get("updatedSubscription")["name"]],
            ctx.scope.get("updatedSubscription")
          ]));
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "subscription_added",
            "attributes": { "channel_name": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]) },
            "for_rid": undefined
          });
        }
      }
    },
    "addInboundSubscription": {
      "name": "addInboundSubscription",
      "select": {
        "graph": { "wrangler": { "pending_subscription_approved": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            var matches = [];
            var m;
            var j;
            m = new RegExp("inbound", "").exec(getAttrString(ctx, "status"));
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
        ctx.scope.set("status", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["status"]));
        ctx.scope.set("channel_name", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]));
        ctx.scope.set("subs", yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []));
        ctx.scope.set("subscription", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            ctx.scope.get("channel_name")
          ]),
          "subscription addSubscription"
        ]));
        ctx.scope.set("attributes", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subscription"),
            ["attributes"]
          ]),
          "attributes subscriptions"
        ]));
        ctx.scope.set("attr", yield ctx.callKRLstdlib("put", [
          ctx.scope.get("attributes"),
          { "status": "subscribed" }
        ]));
        ctx.scope.set("atttrs", ctx.scope.get("attr"));
        ctx.scope.set("updatedSubscription", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("put", [
            ctx.scope.get("subscription"),
            { "attributes": ctx.scope.get("atttrs") }
          ]),
          "updated subscriptions"
        ]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "subscriptions", yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
            [ctx.scope.get("updatedSubscription")["name"]],
            ctx.scope.get("updatedSubscription")
          ]));
          yield ctx.raiseEvent({
            "domain": "wrangler",
            "type": "subscription_added",
            "attributes": { "channel_name": yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]) },
            "for_rid": undefined
          });
        }
      }
    },
    "cancelSubscription": {
      "name": "cancelSubscription",
      "select": {
        "graph": {
          "wrangler": {
            "subscription_cancellation": { "expr_0": true },
            "inbound_subscription_rejection": { "expr_1": true },
            "outbound_subscription_cancellation": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent, getAttrString) {
            return true;
          },
          "expr_2": function* (ctx, aggregateEvent, getAttrString) {
            return true;
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ],
            [
              "expr_2",
              "end"
            ]
          ]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("channel_name", yield ctx.callKRLstdlib("defaultsTo", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["subscription_name"]),
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]),
          "channel_name used "
        ]));
        ctx.scope.set("subs", yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []));
        ctx.scope.set("subscriber_host", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            [
              ctx.scope.get("channel_name"),
              "attributes",
              "subscriber_host"
            ]
          ]),
          "outbound host if different"
        ]));
        ctx.scope.set("outbound_eci", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("defaultsTo", [
            yield ctx.callKRLstdlib("get", [
              ctx.scope.get("subs"),
              [
                ctx.scope.get("channel_name"),
                "attributes",
                "subscriber_eci"
              ]
            ]),
            yield ctx.callKRLstdlib("get", [
              ctx.scope.get("subs"),
              [
                ctx.scope.get("channel_name"),
                "attributes",
                "outbound_eci"
              ]
            ])
          ]),
          "other pico's eci"
        ]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "event", "send", [
            {
              "eci": ctx.scope.get("outbound_eci"),
              "eid": "cancelSubscription1",
              "domain": "wrangler",
              "type": "subscription_removal",
              "attrs": { "channel_name": ctx.scope.get("channel_name") }
            },
            ctx.scope.get("subscriber_host")
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.callKRLstdlib("klog", [
          ctx.scope.get("channel_name"),
          yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, [">> success >>"])
        ]);
        yield ctx.raiseEvent({
          "domain": "wrangler",
          "type": "subscription_removal",
          "attributes": { "channel_name": ctx.scope.get("channel_name") },
          "for_rid": undefined
        });
      }
    },
    "removeSubscription": {
      "name": "removeSubscription",
      "select": {
        "graph": { "wrangler": { "subscription_removal": { "expr_0": true } } },
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
        ctx.scope.set("channel_name", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["channel_name"]),
          "channel_name"
        ]));
        ctx.scope.set("subs", yield ctx.callKRLstdlib("klog", [
          yield ctx.applyFn(ctx.scope.get("getSubscriptions"), ctx, []),
          "subscriptions"
        ]));
        ctx.scope.set("subscription", yield ctx.callKRLstdlib("get", [
          ctx.scope.get("subs"),
          ctx.scope.get("channel_name")
        ]));
        ctx.scope.set("eci", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("get", [
            ctx.scope.get("subs"),
            [
              ctx.scope.get("channel_name"),
              "eci"
            ]
          ]),
          "subscription inbound"
        ]));
        ctx.scope.set("updatedSubscription", yield ctx.callKRLstdlib("klog", [
          yield ctx.callKRLstdlib("delete", [
            ctx.scope.get("subs"),
            ctx.scope.get("channel_name")
          ]),
          "delete"
        ]));
        var fired = true;
        if (fired) {
          yield runAction(ctx, "engine", "removeChannel", [yield ctx.callKRLstdlib("klog", [
              yield ctx.callKRLstdlib("get", [
                ctx.scope.get("subscription"),
                "eci"
              ]),
              "eci to be removed"
            ])], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.modules.set(ctx, "ent", "subscriptions", ctx.scope.get("updatedSubscription"));
        ctx.scope.set("self", yield ctx.applyFn(ctx.scope.get("getSelf"), ctx, []));
        yield ctx.callKRLstdlib("klog", [
          ctx.scope.get("subscription"),
          yield ctx.applyFn(ctx.scope.get("standardOut"), ctx, ["success, attemped to remove subscription"])
        ]);
        yield ctx.raiseEvent({
          "domain": "wrangler",
          "type": "subscription_removed",
          "attributes": { "removed_subscription": ctx.scope.get("subscription") },
          "for_rid": undefined
        });
      }
    }
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
