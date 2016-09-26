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
    ctx.scope.set("sectionInfo", ctx.KRLClosure(ctx, function (ctx) {
      ctx.scope.set("info", {
        "capacity": ctx.modules.get(ctx, "ent", "capacity"),
        "taken": ctx.modules.get(ctx, "ent", "taken"),
        "remaining": ctx.callKRLstdlib("-", ctx.modules.get(ctx, "ent", "capacity"), ctx.modules.get(ctx, "ent", "taken"))
      });
      return ctx.callKRLstdlib("klog", ctx.scope.get("info"), "Section Info: ");
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
        ctx.scope.set("capacity", ctx.modules.get(ctx, "event", "attr")(ctx, ["capacity"]));
        ctx.scope.set("taken", ctx.modules.get(ctx, "event", "attr")(ctx, ["taken"]));
      },
      "postlude": {
        "fired": undefined,
        "notfired": undefined,
        "always": function (ctx) {
          ctx.modules.set(ctx, "ent", "capacity", ctx.scope.get("capacity"));
          ctx.modules.set(ctx, "ent", "taken", ctx.callKRLstdlib("as", ctx.scope.get("taken"), "Number"));
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
          return ctx.callKRLstdlib("<", ctx.modules.get(ctx, "ent", "taken"), ctx.modules.get(ctx, "ent", "capacity"));
        },
        "actions": [{
            "action": function (ctx) {
              return void 0;
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "taken", ctx.callKRLstdlib("klog", ctx.callKRLstdlib("+", ctx.modules.get(ctx, "ent", "taken"), 1), "new ent:taken"));
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
          return ctx.callKRLstdlib(">", ctx.modules.get(ctx, "ent", "taken"), 0);
        },
        "actions": [{
            "action": function (ctx) {
              return void 0;
            }
          }]
      },
      "postlude": {
        "fired": function (ctx) {
          ctx.modules.set(ctx, "ent", "taken", ctx.callKRLstdlib("klog", ctx.callKRLstdlib("-", ctx.modules.get(ctx, "ent", "taken"), 1), "new ent:taken"));
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