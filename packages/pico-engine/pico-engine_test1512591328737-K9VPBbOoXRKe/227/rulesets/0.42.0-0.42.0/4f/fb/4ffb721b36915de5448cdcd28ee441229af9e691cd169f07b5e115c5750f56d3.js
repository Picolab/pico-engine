module.exports = {
  "rid": "io.picolabs.visual_params",
  "meta": {
    "shares": [
      "dname",
      "visualInfo",
      "style",
      "__testing"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("dname", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.modules.get(ctx, "ent", "dname");
    }));
    ctx.scope.set("visualInfo", ctx.mkFunction([], function* (ctx, args) {
      ctx.scope.set("info", {
        "width": yield ctx.modules.get(ctx, "ent", "width"),
        "height": yield ctx.modules.get(ctx, "ent", "height")
      });
      return yield ctx.callKRLstdlib("klog", [
        ctx.scope.get("info"),
        "Visual Info:"
      ]);
    }));
    ctx.scope.set("hexdec1", ctx.mkFunction(["h"], function* (ctx, args) {
      ctx.scope.set("h", args["h"]);
      return (yield ctx.callKRLstdlib(">", [
        ctx.scope.get("h"),
        "9"
      ])) ? yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("-", [
          yield ctx.callKRLstdlib("ord", [ctx.scope.get("h")]),
          yield ctx.callKRLstdlib("ord", ["a"])
        ]),
        10
      ]) : yield ctx.callKRLstdlib("-", [
        yield ctx.callKRLstdlib("ord", [ctx.scope.get("h")]),
        yield ctx.callKRLstdlib("ord", ["0"])
      ]);
    }));
    ctx.scope.set("hexdec2", ctx.mkFunction(["twohexchars"], function* (ctx, args) {
      ctx.scope.set("twohexchars", args["twohexchars"]);
      ctx.scope.set("c1", yield ctx.callKRLstdlib("substr", [
        ctx.scope.get("twohexchars"),
        0,
        1
      ]));
      ctx.scope.set("c2", yield ctx.callKRLstdlib("substr", [
        ctx.scope.get("twohexchars"),
        1,
        1
      ]));
      return yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("*", [
          yield ctx.applyFn(ctx.scope.get("hexdec1"), ctx, [ctx.scope.get("c1")]),
          16
        ]),
        yield ctx.applyFn(ctx.scope.get("hexdec1"), ctx, [ctx.scope.get("c2")])
      ]);
    }));
    ctx.scope.set("colorP", new RegExp(".([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])([a-f0-9][a-f0-9])", ""));
    ctx.scope.set("color", ctx.mkFunction([], function* (ctx, args) {
      ctx.scope.set("rgb", yield ctx.callKRLstdlib("extract", [
        yield ctx.callKRLstdlib("lc", [yield ctx.modules.get(ctx, "ent", "color")]),
        ctx.scope.get("colorP")
      ]));
      ctx.scope.set("r", yield ctx.applyFn(ctx.scope.get("hexdec2"), ctx, [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("rgb"),
          [0]
        ])]));
      ctx.scope.set("g", yield ctx.applyFn(ctx.scope.get("hexdec2"), ctx, [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("rgb"),
          [1]
        ])]));
      ctx.scope.set("b", yield ctx.applyFn(ctx.scope.get("hexdec2"), ctx, [yield ctx.callKRLstdlib("get", [
          ctx.scope.get("rgb"),
          [2]
        ])]));
      ctx.scope.set("yiq", yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("*", [
            ctx.scope.get("r"),
            0.299
          ]),
          yield ctx.callKRLstdlib("*", [
            ctx.scope.get("g"),
            0.587
          ])
        ]),
        yield ctx.callKRLstdlib("*", [
          ctx.scope.get("b"),
          0.114
        ])
      ]));
      return (yield ctx.callKRLstdlib("<", [
        ctx.scope.get("yiq"),
        128
      ])) ? "#ffffff" : "#000000";
    }));
    ctx.scope.set("style", ctx.mkFunction([], function* (ctx, args) {
      return yield ctx.callKRLstdlib("+", [
        yield ctx.callKRLstdlib("+", [
          yield ctx.callKRLstdlib("+", [
            yield ctx.callKRLstdlib("+", [
              yield ctx.callKRLstdlib("+", [
                yield ctx.callKRLstdlib("+", [
                  yield ctx.callKRLstdlib("+", [
                    yield ctx.callKRLstdlib("+", [
                      (yield ctx.modules.get(ctx, "ent", "width")) ? yield ctx.callKRLstdlib("+", [
                        yield ctx.callKRLstdlib("+", [
                          "width:",
                          yield ctx.modules.get(ctx, "ent", "width")
                        ]),
                        "px;"
                      ]) : "",
                      (yield ctx.modules.get(ctx, "ent", "height")) ? yield ctx.callKRLstdlib("+", [
                        yield ctx.callKRLstdlib("+", [
                          "height:",
                          yield ctx.modules.get(ctx, "ent", "height")
                        ]),
                        "px;"
                      ]) : ""
                    ]),
                    (yield ctx.modules.get(ctx, "ent", "left")) ? yield ctx.callKRLstdlib("+", [
                      yield ctx.callKRLstdlib("+", [
                        "left:",
                        yield ctx.modules.get(ctx, "ent", "left")
                      ]),
                      "px;"
                    ]) : ""
                  ]),
                  (yield ctx.modules.get(ctx, "ent", "top")) ? yield ctx.callKRLstdlib("+", [
                    yield ctx.callKRLstdlib("+", [
                      "top:",
                      yield ctx.modules.get(ctx, "ent", "top")
                    ]),
                    "px;"
                  ]) : ""
                ]),
                "background-color:"
              ]),
              yield ctx.modules.get(ctx, "ent", "color")
            ]),
            ";"
          ]),
          "color:"
        ]),
        yield ctx.applyFn(ctx.scope.get("color"), ctx, [])
      ]);
    }));
    ctx.scope.set("__testing", {
      "queries": [
        { "name": "visualInfo" },
        { "name": "style" },
        { "name": "__testing" }
      ],
      "events": [{
          "domain": "visual",
          "type": "config",
          "attrs": [
            "width",
            "height"
          ]
        }]
    });
  },
  "rules": {
    "visual_update": {
      "name": "visual_update",
      "select": {
        "graph": {
          "visual": { "update": { "expr_0": true } },
          "pico": { "ruleset_added": { "expr_1": true } }
        },
        "eventexprs": {
          "expr_0": function* (ctx, aggregateEvent, getAttrString) {
            return true;
          },
          "expr_1": function* (ctx, aggregateEvent, getAttrString) {
            if (!(yield ctx.callKRLstdlib("==", [
                yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["rid"]),
                yield ctx.modules.get(ctx, "meta", "rid")
              ])))
              return false;
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
            ]
          ]
        }
      },
      "body": function* (ctx, runAction, toPairs) {
        ctx.scope.set("dname", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["dname"]));
        ctx.scope.set("color", yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["color"]));
        var fired = ctx.scope.get("dname") || ctx.scope.get("color") || (yield ctx.callKRLstdlib("==", [
          ctx.scope.get("rid"),
          yield ctx.modules.get(ctx, "meta", "rid")
        ]));
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.raiseEvent({
            "domain": "visual",
            "type": "updated",
            "attributes": yield ctx.callKRLstdlib("put", [
              yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
              {
                "was_dname": yield ctx.modules.get(ctx, "ent", "dname"),
                "was_color": yield ctx.modules.get(ctx, "ent", "color")
              }
            ]),
            "for_rid": undefined
          });
          yield ctx.modules.set(ctx, "ent", "dname", ctx.scope.get("dname"));
          yield ctx.modules.set(ctx, "ent", "color", yield ctx.callKRLstdlib("defaultsTo", [
            ctx.scope.get("color"),
            "#cccccc"
          ]));
        }
      }
    },
    "visual_moved": {
      "name": "visual_moved",
      "select": {
        "graph": { "visual": { "moved": { "expr_0": true } } },
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
        ctx.scope.set("left", yield ctx.callKRLstdlib("as", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["left"]),
          "String"
        ]));
        ctx.scope.set("top", yield ctx.callKRLstdlib("as", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["top"]),
          "String"
        ]));
        var fired = (yield ctx.callKRLstdlib("!=", [
          ctx.scope.get("left"),
          yield ctx.modules.get(ctx, "ent", "left")
        ])) || (yield ctx.callKRLstdlib("!=", [
          ctx.scope.get("top"),
          yield ctx.modules.get(ctx, "ent", "top")
        ]));
        if (fired) {
          yield runAction(ctx, void 0, "noop", [], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        if (fired) {
          yield ctx.modules.set(ctx, "ent", "left", yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("left"),
            "left"
          ]));
          yield ctx.modules.set(ctx, "ent", "top", yield ctx.callKRLstdlib("klog", [
            ctx.scope.get("top"),
            "top"
          ]));
        }
      }
    },
    "visual_config": {
      "name": "visual_config",
      "select": {
        "graph": { "visual": { "config": { "expr_0": true } } },
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
        ctx.scope.set("width", yield ctx.callKRLstdlib("as", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["width"]),
          "String"
        ]));
        ctx.scope.set("height", yield ctx.callKRLstdlib("as", [
          yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attr"), ctx, ["height"]),
          "String"
        ]));
        var fired = true;
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
        yield ctx.raiseEvent({
          "domain": "visual",
          "type": "configured",
          "attributes": yield ctx.callKRLstdlib("put", [
            yield ctx.applyFn(yield ctx.modules.get(ctx, "event", "attrs"), ctx, []),
            {
              "was_width": yield ctx.modules.get(ctx, "ent", "width"),
              "was_height": yield ctx.modules.get(ctx, "ent", "height")
            }
          ]),
          "for_rid": undefined
        });
        yield ctx.modules.set(ctx, "ent", "width", yield ctx.callKRLstdlib("klog", [
          ctx.scope.get("width"),
          "width"
        ]));
        yield ctx.modules.set(ctx, "ent", "height", yield ctx.callKRLstdlib("klog", [
          ctx.scope.get("height"),
          "height"
        ]));
      }
    },
    "info_directive": {
      "name": "info_directive",
      "select": {
        "graph": { "visual": { "config": { "expr_0": true } } },
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
            "visual_config",
            { "visual_info": yield ctx.applyFn(ctx.scope.get("visualInfo"), ctx, []) }
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
