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
  "global": function* (ctx) {
    ctx.scope.set("getOnChooseFired", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "on_choose_fired");
    }));
    ctx.scope.set("getNoActionFired", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "no_action_fired");
    }));
    ctx.scope.set("getSentAttrs", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "sent_attrs");
    }));
    ctx.scope.set("getSentName", ctx.KRLClosure(function* (ctx, getArg, hasArg) {
      return yield ctx.modules.get(ctx, "ent", "sent_name");
    }));
  },
  "rules": {
    "set_attr": {
      "name": "set_attr",
      "select": {
        "graph": { "events": { "bind": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "bound",
                { "name": ctx.scope.get("my_name") }
              ], []);
            }
          }]
      }
    },
    "set_attr2": {
      "name": "set_attr2",
      "select": {
        "graph": { "events": { "set_attr2": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[
                [
                  "number",
                  new RegExp("[Nn]0*(\\d*)", "")
                ],
                [
                  "name",
                  new RegExp("(.*)", "")
                ]
              ]]);
            if (!matches)
              return false;
            ctx.scope.set("number", matches[0]);
            ctx.scope.set("name", matches[1]);
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
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "set_attr2",
                {
                  "number": ctx.scope.get("number"),
                  "name": ctx.scope.get("name")
                }
              ], []);
            }
          }]
      }
    },
    "get_attr": {
      "name": "get_attr",
      "select": {
        "graph": { "events": { "get": { "expr_0": true } } },
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
      "prelude": function* (ctx) {
        ctx.scope.set("thing", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["thing"]));
      },
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "get",
                { "thing": ctx.scope.get("thing") }
              ], []);
            }
          }]
      }
    },
    "noop": {
      "name": "noop",
      "select": {
        "graph": { "events": { "noop": { "expr_0": true } } },
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
      }
    },
    "noop2": {
      "name": "noop2",
      "select": {
        "graph": { "events": { "noop2": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "noop", [], []);
            }
          }]
      }
    },
    "ifthen": {
      "name": "ifthen",
      "select": {
        "graph": { "events": { "ifthen": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
        "condition": function* (ctx) {
          return ctx.scope.get("my_name");
        },
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["ifthen"], []);
            }
          }]
      }
    },
    "on_fired": {
      "name": "on_fired",
      "select": {
        "graph": { "events": { "on_fired": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "on_fired",
                { "previous_name": yield ctx.modules.get(ctx, "ent", "on_fired_prev_name") }
              ], []);
            }
          }]
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "on_fired_prev_name", ctx.scope.get("my_name"));
        }
      }
    },
    "on_choose": {
      "name": "on_choose",
      "select": {
        "graph": { "events": { "on_choose": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
        "discriminant": function* (ctx) {
          return ctx.scope.get("thing");
        },
        "actions": [
          {
            "label": "one",
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_choose - one"], []);
            }
          },
          {
            "label": "two",
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_choose - two"], []);
            }
          }
        ]
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "on_choose_fired", true);
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "on_choose_fired", false);
        }
      }
    },
    "on_choose_if": {
      "name": "on_choose_if",
      "select": {
        "graph": { "events": { "on_choose_if": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
        "condition": function* (ctx) {
          return yield ctx.callKRLstdlib("==", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["fire"]),
            "yes"
          ]);
        },
        "discriminant": function* (ctx) {
          return ctx.scope.get("thing");
        },
        "actions": [
          {
            "label": "one",
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_choose_if - one"], []);
            }
          },
          {
            "label": "two",
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_choose_if - two"], []);
            }
          }
        ]
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "on_choose_fired", true);
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "on_choose_fired", false);
        }
      }
    },
    "on_every": {
      "name": "on_every",
      "select": {
        "graph": { "events": { "on_every": { "expr_0": true } } },
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
      "action_block": {
        "actions": [
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_every - one"], []);
            }
          },
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_every - two"], []);
            }
          }
        ]
      }
    },
    "on_sample": {
      "name": "on_sample",
      "select": {
        "graph": { "events": { "on_sample": { "expr_0": true } } },
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
      "action_block": {
        "block_type": "sample",
        "actions": [
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - one"], []);
            }
          },
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - two"], []);
            }
          },
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - three"], []);
            }
          }
        ]
      }
    },
    "on_sample_if": {
      "name": "on_sample_if",
      "select": {
        "graph": { "events": { "on_sample_if": { "expr_0": true } } },
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
      "action_block": {
        "block_type": "sample",
        "condition": function* (ctx) {
          return yield ctx.callKRLstdlib("==", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["fire"]),
            "yes"
          ]);
        },
        "actions": [
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - one"], []);
            }
          },
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - two"], []);
            }
          },
          {
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["on_sample - three"], []);
            }
          }
        ]
      }
    },
    "select_where": {
      "name": "select_where",
      "select": {
        "graph": { "events": { "select_where": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            if (!(yield ctx.callKRLstdlib("match", [
                yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["something"]),
                new RegExp("^wat", "")
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", ["select_where"], []);
            }
          }]
      }
    },
    "no_action": {
      "name": "no_action",
      "select": {
        "graph": { "events": { "no_action": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "no_action_fired", true);
        }
        if (!fired) {
          yield ctx.modules.set(ctx, "ent", "no_action_fired", false);
        }
      }
    },
    "action_send": {
      "name": "action_send",
      "select": {
        "graph": { "events": { "action_send": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
            "action": function* (ctx, runAction) {
              yield runAction(ctx, "event", "send", [{
                  "eci": yield ctx.modules.get(ctx, "meta", "eci"),
                  "eid": "0",
                  "domain": "events",
                  "type": "store_sent_name",
                  "attrs": { "name": ctx.scope.get("my_name") }
                }], []);
            }
          }]
      }
    },
    "store_sent_name": {
      "name": "store_sent_name",
      "select": {
        "graph": { "events": { "store_sent_name": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "sent_attrs", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []));
          yield ctx.modules.set(ctx, "ent", "sent_name", ctx.scope.get("my_name"));
        }
      }
    },
    "raise_set_name": {
      "name": "raise_set_name",
      "select": {
        "graph": { "events": { "raise_set_name": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "events",
            "type": "store_sent_name",
            "attributes": { "name": ctx.scope.get("my_name") },
            "for_rid": undefined
          });
        }
      }
    },
    "raise_set_name_attr": {
      "name": "raise_set_name_attr",
      "select": {
        "graph": { "events": { "raise_set_name_attr": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "events",
            "type": "store_sent_name",
            "attributes": { "name": ctx.scope.get("my_name") },
            "for_rid": undefined
          });
        }
      }
    },
    "raise_set_name_rid": {
      "name": "raise_set_name_rid",
      "select": {
        "graph": { "events": { "raise_set_name_rid": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent) {
            var matches = yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrMatches"), ctx, [[[
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
      "prelude": function* (ctx) {
        ctx.scope.set("rid", "io.picolabs.events");
      },
      "postlude": function* (ctx, fired) {
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "events",
            "type": "store_sent_name",
            "attributes": { "name": ctx.scope.get("my_name") },
            "for_rid": ctx.scope.get("rid")
          });
        }
      }
    },
    "event_eid": {
      "name": "event_eid",
      "select": {
        "graph": { "events": { "event_eid": { "expr_0": true } } },
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
      "action_block": {
        "actions": [{
            "action": function* (ctx, runAction) {
              yield runAction(ctx, void 0, "send_directive", [
                "event_eid",
                { "eid": yield ctx.modules.get(ctx, "event", "eid") }
              ], []);
            }
          }]
      }
    }
  }
};