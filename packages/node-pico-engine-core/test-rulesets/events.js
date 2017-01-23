module.exports = {
  "rid": "io.picolabs.events",
  "meta": {
    "shares": [
      "getOnChooseFired",
      "getNoActionFired",
      "getSentAttrs",
      "getSentName"
    ]
  },
  "global": function (ctx) {
    ctx.scope.set("getOnChooseFired", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "on_choose_fired");
    }));
    ctx.scope.set("getNoActionFired", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "no_action_fired");
    }));
    ctx.scope.set("getSentAttrs", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "sent_attrs");
    }));
    ctx.scope.set("getSentName", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.modules.get(ctx, "ent", "sent_name");
    }));
  },
  "rules": {
    "set_attr": {
      "name": "set_attr",
      "select": {
        "graph": { "events": { "bind": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "bound",
                "options": { "name": ctx.scope.get("my_name") }
              };
            }
          }]
      }
    },
    "get_attr": {
      "name": "get_attr",
      "select": {
        "graph": { "events": { "get": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
      "prelude": function (ctx) {
        ctx.scope.set("thing", ctx.modules.get(ctx, "event", "attr")(ctx, ["thing"]));
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "get",
                "options": { "thing": ctx.scope.get("thing") }
              };
            }
          }]
      }
    },
    "noop": {
      "name": "noop",
      "select": {
        "graph": { "events": { "noop": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      }
    },
    "noop2": {
      "name": "noop2",
      "select": {
        "graph": { "events": { "noop2": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
            "action": function (ctx) {
              return void 0;
            }
          }]
      }
    },
    "ifthen": {
      "name": "ifthen",
      "select": {
        "graph": { "events": { "ifthen": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
        "condition": function (ctx) {
          return ctx.scope.get("my_name");
        },
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "ifthen",
                "options": {}
              };
            }
          }]
      }
    },
    "on_fired": {
      "name": "on_fired",
      "select": {
        "graph": { "events": { "on_fired": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "on_fired",
                "options": { "previous_name": ctx.modules.get(ctx, "ent", "on_fired_prev_name") }
              };
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "on_fired_prev_name", ctx.scope.get("my_name"));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "on_choose": {
      "name": "on_choose",
      "select": {
        "graph": { "events": { "on_choose": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "thing",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("thing", matches[0]);
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
        "block_type": "choose",
        "condition": function (ctx) {
          return ctx.scope.get("thing");
        },
        "actions": [
          {
            "label": "one",
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "on_choose - one",
                "options": {}
              };
            }
          },
          {
            "label": "two",
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "on_choose - two",
                "options": {}
              };
            }
          }
        ]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "on_choose_fired", true);
        },
        "notfired": function (ctx) {
          ctx.modules.set(ctx, "ent", "on_choose_fired", false);
        },
        "always": undefined
      }
    },
    "select_where": {
      "name": "select_where",
      "select": {
        "graph": { "events": { "select_where": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            if (!ctx.callKRLstdlib("match", ctx.modules.get(ctx, "event", "attr")(ctx, ["something"]), new RegExp("^wat", "")))
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
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "select_where",
                "options": {}
              };
            }
          }]
      }
    },
    "no_action": {
      "name": "no_action",
      "select": {
        "graph": { "events": { "no_action": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "fired",
                  new RegExp("^yes$", "i")
                ]]]);
            if (!matches)
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "no_action_fired", true);
        },
        "notfired": function (ctx) {
          ctx.modules.set(ctx, "ent", "no_action_fired", false);
        },
        "always": undefined
      }
    },
    "action_send": {
      "name": "action_send",
      "select": {
        "graph": { "events": { "action_send": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
            "action": function (ctx) {
              return ctx.modules.get(ctx, "event", "send")(ctx, [{
                  "eci": ctx.modules.get(ctx, "meta", "eci"),
                  "eid": "0",
                  "domain": "events",
                  "type": "store_sent_name",
                  "attrs": { "name": ctx.scope.get("my_name") }
                }]);
            }
          }]
      }
    },
    "store_sent_name": {
      "name": "store_sent_name",
      "select": {
        "graph": { "events": { "store_sent_name": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "sent_attrs", ctx.modules.get(ctx, "event", "attrs")(ctx, []));
          ctx.modules.set(ctx, "ent", "sent_name", ctx.scope.get("my_name"));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "raise_set_name": {
      "name": "raise_set_name",
      "select": {
        "graph": { "events": { "raise_set_name": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.get(ctx, "event", "raise")(ctx, [{
              "domain": "events",
              "type": "store_sent_name",
              "for_rid": undefined,
              "attributes": { "name": ctx.scope.get("my_name") }
            }]);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "raise_set_name_attr": {
      "name": "raise_set_name_attr",
      "select": {
        "graph": { "events": { "raise_set_name_attr": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.get(ctx, "event", "raise")(ctx, [{
              "domain": "events",
              "type": "store_sent_name",
              "for_rid": undefined,
              "attributes": { "name": ctx.scope.get("my_name") }
            }]);
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "raise_set_name_rid": {
      "name": "raise_set_name_rid",
      "select": {
        "graph": { "events": { "raise_set_name_rid": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
            var matches = ctx.modules.get(ctx, "event", "attrMatches")(ctx, [[[
                  "name",
                  new RegExp("^(.*)$", "")
                ]]]);
            if (!matches)
              return false;
            ctx.scope.set("my_name", matches[0]);
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
      "prelude": function (ctx) {
        ctx.scope.set("rid", "io.picolabs.events");
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.get(ctx, "event", "raise")(ctx, [{
              "domain": "events",
              "type": "store_sent_name",
              "for_rid": ctx.scope.get("rid"),
              "attributes": { "name": ctx.scope.get("my_name") }
            }]);
        },
        "notfired": undefined,
        "always": undefined
      }
    }
  }
};