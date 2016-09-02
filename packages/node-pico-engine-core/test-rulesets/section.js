module.exports = {
  "rid": "io.picolabs.registration",
  "meta": {
    "name": "Section",
    "description": "\nA test ruleset for Registration\n",
    "author": "Aaron Rasmussen",
    "logging": true,
    "shares": ["sectionInfo"]
  },
  "global": function (ctx) {
    ctx.scope.set("sectionInfo", ctx.krl.Closure(ctx, function (ctx) {
      ctx.scope.set("info", {
        "capacity": ctx.persistent.getEnt("capacity"),
        "taken": ctx.persistent.getEnt("taken"),
        "remaining": ctx.krl.stdlib["-"](ctx.persistent.getEnt("capacity"), ctx.persistent.getEnt("taken"))
      });
      return ctx.krl.stdlib["klog"](ctx.scope.get("info"), "Section Info: ");
    }));
  },
  "rules": {
    "config": {
      "name": "config",
      "select": {
        "graph": { "section": { "config": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "prelude": function (ctx) {
        ctx.scope.set("capacity", ctx.event.getAttr("capacity"));
        ctx.scope.set("taken", ctx.event.getAttr("taken"));
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function (ctx) {
          ctx.persistent.putEnt("capacity", ctx.scope.get("capacity"));
          ctx.persistent.putEnt("taken", ctx.krl.stdlib["as"](ctx.scope.get("taken"), "Number"));
        }
      }
    },
    "join_section": {
      "name": "join_section",
      "select": {
        "graph": { "section": { "add_request": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "condition": function (ctx) {
          return ctx.krl.stdlib["<"](ctx.persistent.getEnt("taken"), ctx.persistent.getEnt("capacity"));
        },
        "actions": [{
            "action": function (ctx) {
              return void 0;
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.persistent.putEnt("taken", ctx.krl.stdlib["klog"](ctx.krl.stdlib["+"](ctx.persistent.getEnt("taken"), 1), "new ent:taken"));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "drop_section": {
      "name": "drop_section",
      "select": {
        "graph": { "section": { "drop_request": { "expr_0": true } } },
        "eventexprs": {
          "expr_0": function (ctx) {
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
              [
                "not",
                "expr_0"
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "condition": function (ctx) {
          return ctx.krl.stdlib[">"](ctx.persistent.getEnt("taken"), 0);
        },
        "actions": [{
            "action": function (ctx) {
              return void 0;
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.persistent.putEnt("taken", ctx.krl.stdlib["klog"](ctx.krl.stdlib["-"](ctx.persistent.getEnt("taken"), 1), "new ent:taken"));
        },
        "notfired": undefined,
        "always": undefined
      }
    },
    "info_directive": {
      "name": "info_directive",
      "select": {
        "graph": {
          "section": {
            "add_request": { "expr_0": true },
            "drop_request": { "expr_1": true },
            "config": { "expr_2": true }
          }
        },
        "eventexprs": {
          "expr_0": function (ctx) {
            return true;
          },
          "expr_1": function (ctx) {
            return true;
          },
          "expr_2": function (ctx) {
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
            ],
            [
              [
                "not",
                [
                  "or",
                  "expr_0",
                  [
                    "or",
                    "expr_1",
                    "expr_2"
                  ]
                ]
              ],
              "start"
            ]
          ]
        }
      },
      "action_block": {
        "actions": [{
            "action": function (ctx) {
              return {
                "type": "directive",
                "name": "section",
                "options": { "section_info": ctx.scope.get("sectionInfo")(ctx, []) }
              };
            }
          }]
      }
    }
  }
};