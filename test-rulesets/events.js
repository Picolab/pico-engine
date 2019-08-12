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
  "global": async function (ctx) {
    ctx.scope.set("getOnChooseFired", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "on_choose_fired");
    }));
    ctx.scope.set("getNoActionFired", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "no_action_fired");
    }));
    ctx.scope.set("getSentAttrs", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "sent_attrs");
    }));
    ctx.scope.set("getSentName", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.modules.get(ctx, "ent", "sent_name");
    }));
    ctx.scope.set("global0", "g zero");
    ctx.scope.set("global1", "g one");
  },
  "rules": {
    "set_attr": {
      "name": "set_attr",
      "select": {
        "graph": {
          "events": {
            "bind": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "bound",
            { "name": ctx.scope.get("my_name") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "set_attr2": {
      "name": "set_attr2",
      "select": {
        "graph": {
          "events": {
            "set_attr2": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("[Nn]0*(\\d*)", "").exec(getAttrString(ctx, "number"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                m = new RegExp("(.*)", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("number", matches[0]);
                setting("name", matches[1]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "set_attr2",
            {
              "number": ctx.scope.get("number"),
              "name": ctx.scope.get("name")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "get_attr": {
      "name": "get_attr",
      "select": {
        "graph": { "events": { "get": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("thing", await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["thing"]));
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "get",
            { "thing": ctx.scope.get("thing") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "noop": {
      "name": "noop",
      "select": {
        "graph": { "events": { "noop": { "expr_0": true } } },
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
    "noop2": {
      "name": "noop2",
      "select": {
        "graph": { "events": { "noop2": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "ifthen": {
      "name": "ifthen",
      "select": {
        "graph": {
          "events": {
            "ifthen": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = ctx.scope.get("my_name");
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["ifthen"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "on_fired": {
      "name": "on_fired",
      "select": {
        "graph": {
          "events": {
            "on_fired": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "on_fired",
            { "previous_name": await ctx.modules.get(ctx, "ent", "on_fired_prev_name") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "on_fired_prev_name", ctx.scope.get("my_name"));
        }
      }
    },
    "on_choose": {
      "name": "on_choose",
      "select": {
        "graph": {
          "events": {
            "on_choose": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "thing"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("thing", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          switch (ctx.scope.get("thing")) {
          case "one":
            await runAction(ctx, void 0, "send_directive", ["on_choose - one"], []);
            break;
          case "two":
            await runAction(ctx, void 0, "send_directive", ["on_choose - two"], []);
            break;
          }
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "on_choose_fired", true);
        }
        if (!fired) {
          await ctx.modules.set(ctx, "ent", "on_choose_fired", false);
        }
      }
    },
    "on_choose_if": {
      "name": "on_choose_if",
      "select": {
        "graph": {
          "events": {
            "on_choose_if": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "thing"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("thing", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = await ctx.applyFn(ctx.scope.get("=="), ctx, [
          await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["fire"]),
          "yes"
        ]);
        if (fired) {
          switch (ctx.scope.get("thing")) {
          case "one":
            await runAction(ctx, void 0, "send_directive", ["on_choose_if - one"], []);
            break;
          case "two":
            await runAction(ctx, void 0, "send_directive", ["on_choose_if - two"], []);
            break;
          }
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.modules.set(ctx, "ent", "on_choose_fired", true);
        }
        if (!fired) {
          await ctx.modules.set(ctx, "ent", "on_choose_fired", false);
        }
      }
    },
    "on_every": {
      "name": "on_every",
      "select": {
        "graph": { "events": { "on_every": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["on_every - one"], []);
          await runAction(ctx, void 0, "send_directive", ["on_every - two"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "on_sample": {
      "name": "on_sample",
      "select": {
        "graph": { "events": { "on_sample": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          switch (Math.floor(Math.random() * 3)) {
          case 0:
            await runAction(ctx, void 0, "send_directive", ["on_sample - one"], []);
            break;
          case 1:
            await runAction(ctx, void 0, "send_directive", ["on_sample - two"], []);
            break;
          case 2:
            await runAction(ctx, void 0, "send_directive", ["on_sample - three"], []);
            break;
          }
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "on_sample_if": {
      "name": "on_sample_if",
      "select": {
        "graph": { "events": { "on_sample_if": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = await ctx.applyFn(ctx.scope.get("=="), ctx, [
          await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["fire"]),
          "yes"
        ]);
        if (fired) {
          switch (Math.floor(Math.random() * 3)) {
          case 0:
            await runAction(ctx, void 0, "send_directive", ["on_sample - one"], []);
            break;
          case 1:
            await runAction(ctx, void 0, "send_directive", ["on_sample - two"], []);
            break;
          case 2:
            await runAction(ctx, void 0, "send_directive", ["on_sample - three"], []);
            break;
          }
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "select_where": {
      "name": "select_where",
      "select": {
        "graph": {
          "events": {
            "select_where": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                if (!await ctx.applyFn(ctx.scope.get("match"), ctx, [
                    ctx.scope.get("something"),
                    new RegExp("^wat", "")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["select_where"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_match_0": {
      "name": "where_match_0",
      "select": {
        "graph": {
          "events": {
            "where_match_0": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                if (!await ctx.applyFn(ctx.scope.get("match"), ctx, [
                    ctx.scope.get("something"),
                    new RegExp("0", "")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_match_0"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_match_null": {
      "name": "where_match_null",
      "select": {
        "graph": {
          "events": {
            "where_match_null": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                if (!await ctx.applyFn(ctx.scope.get("match"), ctx, [
                    ctx.scope.get("something"),
                    new RegExp("null", "")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_match_null"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_match_false": {
      "name": "where_match_false",
      "select": {
        "graph": {
          "events": {
            "where_match_false": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                if (!await ctx.applyFn(ctx.scope.get("match"), ctx, [
                    ctx.scope.get("something"),
                    new RegExp("false", "")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_match_false"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_match_empty_str": {
      "name": "where_match_empty_str",
      "select": {
        "graph": {
          "events": {
            "where_match_empty_str": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                if (!await ctx.applyFn(ctx.scope.get("match"), ctx, [
                    await ctx.applyFn(await ctx.modules.get(ctx, "event", "attr"), ctx, ["something"]),
                    new RegExp("(?:)", "")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_match_empty_str"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_after_setting": {
      "name": "where_after_setting",
      "select": {
        "graph": {
          "events": {
            "where_after_setting": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                var matches = [];
                var m;
                var j;
                m = new RegExp("(.*)", "").exec(getAttrString(ctx, "a"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("a", matches[0]);
                if (!await ctx.applyFn(ctx.scope.get("=="), ctx, [
                    ctx.scope.get("a"),
                    "one"
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_after_setting"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "where_using_global": {
      "name": "where_using_global",
      "select": {
        "graph": {
          "events": {
            "where_using_global": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var event_attrs = await ctx.modules.get(ctx, "event", "attrs");
                Object.keys(event_attrs).forEach(function (attr) {
                  if (!ctx.scope.has(attr))
                    ctx.scope.set(attr, event_attrs[attr]);
                });
                var matches = [];
                var m;
                var j;
                m = new RegExp("(.*)", "").exec(getAttrString(ctx, "a"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("global0", matches[0]);
                if (!await ctx.applyFn(ctx.scope.get("=="), ctx, [
                    ctx.scope.get("global0"),
                    ctx.scope.get("global1")
                  ]))
                  return false;
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["where_using_global"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "implicit_match_0": {
      "name": "implicit_match_0",
      "select": {
        "graph": {
          "events": {
            "implicit_match_0": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("0", "").exec(getAttrString(ctx, "something"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["implicit_match_0"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "implicit_match_null": {
      "name": "implicit_match_null",
      "select": {
        "graph": {
          "events": {
            "implicit_match_null": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("null", "").exec(getAttrString(ctx, "something"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["implicit_match_null"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "implicit_match_false": {
      "name": "implicit_match_false",
      "select": {
        "graph": {
          "events": {
            "implicit_match_false": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("false", "").exec(getAttrString(ctx, "something"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["implicit_match_false"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "implicit_match_empty_str": {
      "name": "implicit_match_empty_str",
      "select": {
        "graph": {
          "events": {
            "implicit_match_empty_str": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(?:)", "").exec(getAttrString(ctx, "something"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["implicit_match_empty_str"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "no_action": {
      "name": "no_action",
      "select": {
        "graph": {
          "events": {
            "no_action": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^yes$", "i").exec(getAttrString(ctx, "fired"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                return true;
              }
            }
          }
        },
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
        if (fired) {
          await ctx.modules.set(ctx, "ent", "no_action_fired", true);
        }
        if (!fired) {
          await ctx.modules.set(ctx, "ent", "no_action_fired", false);
        }
      }
    },
    "action_send": {
      "name": "action_send",
      "select": {
        "graph": {
          "events": {
            "action_send": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, "event", "send", [{
              "eci": await ctx.modules.get(ctx, "meta", "eci"),
              "eid": "0",
              "domain": "events",
              "type": "store_sent_name",
              "attrs": {
                "name": ctx.scope.get("my_name"),
                "empty": [],
                "r": new RegExp("hi", "i")
              }
            }], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "store_sent_name": {
      "name": "store_sent_name",
      "select": {
        "graph": {
          "events": {
            "store_sent_name": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
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
        if (fired) {
          await ctx.modules.set(ctx, "ent", "sent_attrs", await ctx.modules.get(ctx, "event", "attrs"));
          await ctx.modules.set(ctx, "ent", "sent_name", ctx.scope.get("my_name"));
        }
      }
    },
    "raise_basic": {
      "name": "raise_basic",
      "select": {
        "graph": { "events": { "raise_basic": { "expr_0": true } } },
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
        if (fired) {
          await ctx.raiseEvent({
            "domain": "events",
            "type": "event_attrs",
            "attributes": undefined,
            "for_rid": undefined
          });
        }
      }
    },
    "raise_set_name": {
      "name": "raise_set_name",
      "select": {
        "graph": {
          "events": {
            "raise_set_name": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
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
        if (fired) {
          await ctx.raiseEvent({
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
        "graph": {
          "events": {
            "raise_set_name_attr": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
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
        if (fired) {
          await ctx.raiseEvent({
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
        "graph": {
          "events": {
            "raise_set_name_rid": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "name"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("my_name", matches[0]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        ctx.scope.set("rid", "io.picolabs.events");
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          await ctx.raiseEvent({
            "domain": "events",
            "type": "store_sent_name",
            "attributes": { "name": ctx.scope.get("my_name") },
            "for_rid": ctx.scope.get("rid")
          });
        }
      }
    },
    "raise_dynamic": {
      "name": "raise_dynamic",
      "select": {
        "graph": {
          "events": {
            "raise_dynamic": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("^(.*)$", "").exec(getAttrString(ctx, "domainType"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                setting("domainType", matches[0]);
                return true;
              }
            }
          }
        },
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
        if (fired) {
          await ctx.raiseEvent({
            "domainAndType": ctx.scope.get("domainType"),
            "attributes": await ctx.modules.get(ctx, "event", "attrs"),
            "for_rid": undefined
          });
        }
      }
    },
    "event_eid": {
      "name": "event_eid",
      "select": {
        "graph": { "events": { "event_eid": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "event_eid",
            { "eid": await ctx.modules.get(ctx, "event", "eid") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "event_attrs": {
      "name": "event_attrs",
      "select": {
        "graph": { "events": { "event_attrs": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "event_attrs",
            { "attrs": await ctx.modules.get(ctx, "event", "attrs") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "ignored": {
      "name": "ignored",
      "rule_state": "inactive"
    }
  }
};