module.exports = {
  "rid": "io.picolabs.event-exp",
  "rules": {
    "before": {
      "name": "before",
      "select": {
        "graph": {
          "ee_before": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["before"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "after": {
      "name": "after",
      "select": {
        "graph": {
          "ee_after": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["after"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "then": {
      "name": "then",
      "select": {
        "graph": {
          "ee_then": {
            "a": { "expr_0": true },
            "b": {
              "expr_1": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("bob", "").exec(getAttrString(ctx, "name"));
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
              "s0"
            ]],
          "s0": [
            [
              "expr_1",
              "end"
            ],
            [
              [
                "not",
                "expr_1"
              ],
              "start"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["then"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "and": {
      "name": "and",
      "select": {
        "graph": {
          "ee_and": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["and"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "or": {
      "name": "or",
      "select": {
        "graph": {
          "ee_or": {
            "a": { "expr_0": true },
            "b": { "expr_1": true }
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
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["or"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "between": {
      "name": "between",
      "select": {
        "graph": {
          "ee_between": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_2",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["between"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "not_between": {
      "name": "not_between",
      "select": {
        "graph": {
          "ee_not_between": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [
            [
              "expr_0",
              "start"
            ],
            [
              "expr_2",
              "end"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["not between"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "and_or": {
      "name": "and_or",
      "select": {
        "graph": {
          "ee_andor": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["(a and b) or c"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "or_and": {
      "name": "or_and",
      "select": {
        "graph": {
          "ee_orand": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "s1"
            ]
          ],
          "s0": [
            [
              "expr_1",
              "end"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["a and (b or c)"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "before_n": {
      "name": "before_n",
      "select": {
        "graph": {
          "ee_before_n": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "s1"
            ]],
          "s1": [[
              "expr_2",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["before_n"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "after_n": {
      "name": "after_n",
      "select": {
        "graph": {
          "ee_after_n": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_2",
              "s0"
            ]],
          "s0": [[
              "expr_1",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["after_n"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "then_n": {
      "name": "then_n",
      "select": {
        "graph": {
          "ee_then_n": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [
            [
              "expr_1",
              "s1"
            ],
            [
              [
                "not",
                "expr_1"
              ],
              "start"
            ]
          ],
          "s1": [
            [
              "expr_2",
              "end"
            ],
            [
              [
                "not",
                "expr_2"
              ],
              "start"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["then_n"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "and_n": {
      "name": "and_n",
      "select": {
        "graph": {
          "ee_and_n": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "s4"
            ]
          ],
          "s0": [
            [
              "expr_1",
              "s7"
            ],
            [
              "expr_2",
              "s8"
            ]
          ],
          "s1": [
            [
              "expr_0",
              "s2"
            ],
            [
              "expr_2",
              "s3"
            ]
          ],
          "s2": [[
              "expr_2",
              "end"
            ]],
          "s3": [[
              "expr_0",
              "end"
            ]],
          "s4": [
            [
              "expr_0",
              "s5"
            ],
            [
              "expr_1",
              "s6"
            ]
          ],
          "s5": [[
              "expr_1",
              "end"
            ]],
          "s6": [[
              "expr_0",
              "end"
            ]],
          "s7": [[
              "expr_2",
              "end"
            ]],
          "s8": [[
              "expr_1",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["and_n"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "or_n": {
      "name": "or_n",
      "select": {
        "graph": {
          "ee_or_n": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true },
            "d": { "expr_3": true }
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
              "expr_3",
              "end"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["or_n"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "any": {
      "name": "any",
      "select": {
        "graph": {
          "ee_any": {
            "a": { "expr_0": true },
            "b": { "expr_1": true },
            "c": { "expr_2": true },
            "d": { "expr_3": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "s2"
            ],
            [
              "expr_3",
              "s3"
            ]
          ],
          "s0": [
            [
              "expr_1",
              "end"
            ],
            [
              "expr_2",
              "end"
            ],
            [
              "expr_3",
              "end"
            ]
          ],
          "s1": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_2",
              "end"
            ],
            [
              "expr_3",
              "end"
            ]
          ],
          "s2": [
            [
              "expr_0",
              "end"
            ],
            [
              "expr_1",
              "end"
            ],
            [
              "expr_3",
              "end"
            ]
          ],
          "s3": [
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
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["any"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "count": {
      "name": "count",
      "select": {
        "graph": { "ee_count": { "a": { "expr_0": true } } },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["count"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat": {
      "name": "repeat",
      "select": {
        "graph": {
          "ee_repeat": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("bob", "").exec(getAttrString(ctx, "name"));
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
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["repeat"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "count_max": {
      "name": "count_max",
      "select": {
        "graph": {
          "ee_count_max": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "max", [[
                    "m",
                    matches[0]
                  ]]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "count_max",
            { "m": ctx.scope.get("m") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_min": {
      "name": "repeat_min",
      "select": {
        "graph": {
          "ee_repeat_min": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "min", [[
                    "m",
                    matches[0]
                  ]]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_min",
            { "m": ctx.scope.get("m") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_sum": {
      "name": "repeat_sum",
      "select": {
        "graph": {
          "ee_repeat_sum": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "sum", [[
                    "m",
                    matches[0]
                  ]]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_sum",
            { "m": ctx.scope.get("m") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_avg": {
      "name": "repeat_avg",
      "select": {
        "graph": {
          "ee_repeat_avg": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "avg", [[
                    "m",
                    matches[0]
                  ]]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_avg",
            { "m": ctx.scope.get("m") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_push": {
      "name": "repeat_push",
      "select": {
        "graph": {
          "ee_repeat_push": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "push", [[
                    "m",
                    matches[0]
                  ]]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_push",
            { "m": ctx.scope.get("m") }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_push_multi": {
      "name": "repeat_push_multi",
      "select": {
        "graph": {
          "ee_repeat_push_multi": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "a"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                m = new RegExp("(\\d+) (.*)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "push", [
                  [
                    "a",
                    matches[0]
                  ],
                  [
                    "b",
                    matches[1]
                  ],
                  [
                    "c",
                    matches[2]
                  ],
                  [
                    "d",
                    matches[3]
                  ]
                ]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "s2"
            ]],
          "s2": [[
              "expr_0",
              "s3"
            ]],
          "s3": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_push_multi",
            {
              "a": ctx.scope.get("a"),
              "b": ctx.scope.get("b"),
              "c": ctx.scope.get("c"),
              "d": ctx.scope.get("d")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "repeat_sum_multi": {
      "name": "repeat_sum_multi",
      "select": {
        "graph": {
          "ee_repeat_sum_multi": {
            "a": {
              "expr_0": async function (ctx, aggregateEvent, getAttrString, setting) {
                var matches = [];
                var m;
                var j;
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "a"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                m = new RegExp("(\\d+)", "").exec(getAttrString(ctx, "b"));
                if (!m)
                  return false;
                for (j = 1; j < m.length; j++)
                  matches.push(m[j]);
                await aggregateEvent(ctx, "sum", [
                  [
                    "a",
                    matches[0]
                  ],
                  [
                    "b",
                    matches[1]
                  ]
                ]);
                return true;
              }
            }
          }
        },
        "state_machine": {
          "start": [[
              "expr_0",
              "s0"
            ]],
          "s0": [[
              "expr_0",
              "s1"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "end": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", [
            "repeat_sum_multi",
            {
              "a": ctx.scope.get("a"),
              "b": ctx.scope.get("b")
            }
          ], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "or_duppath": {
      "name": "or_duppath",
      "select": {
        "graph": {
          "ee_or_duppath": {
            "a": {
              "expr_0": true,
              "expr_1": true,
              "expr_2": true
            }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["(a before a) or a"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "notbet_duppath": {
      "name": "notbet_duppath",
      "select": {
        "graph": {
          "ee_notbet_duppath": {
            "a": {
              "expr_0": true,
              "expr_2": true
            },
            "b": { "expr_1": true }
          }
        },
        "state_machine": {
          "start": [[
              "expr_1",
              "s0"
            ]],
          "s0": [
            [
              "expr_0",
              "start"
            ],
            [
              "expr_2",
              "end"
            ]
          ]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["a not between (b, a)"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "ab_or_b": {
      "name": "ab_or_b",
      "select": {
        "graph": {
          "ee_ab_or_b": {
            "a": { "expr_0": true },
            "b": {
              "expr_1": true,
              "expr_2": true
            }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "end"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["(a and b) or b"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    },
    "ab_or_ca": {
      "name": "ab_or_ca",
      "select": {
        "graph": {
          "ee_ab_or_ca": {
            "a": {
              "expr_0": true,
              "expr_3": true
            },
            "b": { "expr_1": true },
            "c": { "expr_2": true }
          }
        },
        "state_machine": {
          "start": [
            [
              "expr_0",
              "s0"
            ],
            [
              "expr_1",
              "s1"
            ],
            [
              "expr_2",
              "s2"
            ],
            [
              "expr_3",
              "s3"
            ]
          ],
          "s0": [[
              "expr_1",
              "end"
            ]],
          "s1": [[
              "expr_0",
              "end"
            ]],
          "s2": [[
              "expr_3",
              "end"
            ]],
          "s3": [[
              "expr_2",
              "end"
            ]]
        }
      },
      "body": async function (ctx, runAction, toPairs) {
        var fired = true;
        if (fired) {
          await runAction(ctx, void 0, "send_directive", ["(a and b) or (c and a)"], []);
        }
        if (fired)
          ctx.emit("debug", "fired");
        else
          ctx.emit("debug", "not fired");
      }
    }
  }
};