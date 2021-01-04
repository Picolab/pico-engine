module.exports = {
  "rid": "io.picolabs.pico-engine-ui",
  "meta": {
    "version": "0.0.0",
    "name": "pico-engine-ui",
    "description": "This is the only ruleset the pico-engine-ui.js needs to operate",
    "shares": [
      "box",
      "uiECI",
      "pico",
      "logs",
      "testingECI",
      "name"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const head1 = $stdlib["head"];
    const map1 = $stdlib["map"];
    const filter1 = $stdlib["filter"];
    const join1 = $stdlib["join"];
    const sort1 = $stdlib["sort"];
    const as1 = $stdlib["as"];
    const get1 = $stdlib["get"];
    const __testing1 = {
      "queries": [
        {
          "name": "box",
          "args": []
        },
        {
          "name": "uiECI",
          "args": []
        },
        {
          "name": "pico",
          "args": []
        },
        {
          "name": "logs",
          "args": []
        },
        {
          "name": "testingECI",
          "args": []
        },
        {
          "name": "name",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "engine_ui",
          "name": "setup",
          "attrs": []
        },
        {
          "domain": "engine_ui",
          "name": "box",
          "attrs": [
            "x",
            "y",
            "width",
            "height",
            "name",
            "backgroundColor"
          ]
        },
        {
          "domain": "engine_ui",
          "name": "new",
          "attrs": [
            "name",
            "backgroundColor"
          ]
        },
        {
          "domain": "engine_ui",
          "name": "del",
          "attrs": ["eci"]
        },
        {
          "domain": "engine_ui",
          "name": "install",
          "attrs": [
            "url",
            "config"
          ]
        },
        {
          "domain": "engine_ui",
          "name": "uninstall",
          "attrs": ["rid"]
        },
        {
          "domain": "engine_ui",
          "name": "flush",
          "attrs": ["url"]
        },
        {
          "domain": "engine_ui",
          "name": "new_channel",
          "attrs": [
            "tags",
            "eventPolicy",
            "queryPolicy"
          ]
        },
        {
          "domain": "engine_ui",
          "name": "del_channel",
          "attrs": ["eci"]
        },
        {
          "domain": "engine_ui",
          "name": "testing_eci",
          "attrs": ["eci"]
        }
      ]
    };
    const uiECI2 = $ctx.krl.Function([], async function () {
      return await head1($ctx, [await map1($ctx, [
          await filter1($ctx, [
            $ctx.module("ctx")["channels"]($ctx),
            $ctx.krl.Function(["c"], async function (c4) {
              return await $stdlib["=="]($ctx, [
                await join1($ctx, [
                  await sort1($ctx, [await $stdlib["get"]($ctx, [
                      c4,
                      ["tags"]
                    ])]),
                  ","
                ]),
                "engine,ui"
              ]);
            })
          ]),
          $ctx.krl.Function(["c"], async function (c4) {
            return await $stdlib["get"]($ctx, [
              c4,
              ["id"]
            ]);
          })
        ])]);
    });
    const getOtherUiECI2 = $ctx.krl.Function(["eci"], async function (eci3) {
      return eci3 ? await $ctx.krl.assertFunction($ctx.module("ctx")["query"])($ctx, [
        eci3,
        $ctx.module("ctx")["rid"]($ctx),
        "uiECI"
      ]) : void 0;
    });
    const testingECI2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("testingECI");
    });
    const $name$2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("name") || "Pico";
    });
    const box2 = $ctx.krl.Function([], async function () {
      return {
        "eci": await uiECI2($ctx, []),
        "parent": await getOtherUiECI2($ctx, [$ctx.module("ctx")["parent"]($ctx)]),
        "children": await map1($ctx, [
          $ctx.module("ctx")["children"]($ctx),
          getOtherUiECI2
        ]),
        "name": await $name$2($ctx, []),
        "backgroundColor": await $ctx.rsCtx.getEnt("backgroundColor") || "#87cefa",
        "x": await $ctx.rsCtx.getEnt("x") || 100,
        "y": await $ctx.rsCtx.getEnt("y") || 100,
        "width": await $ctx.rsCtx.getEnt("width") || 100,
        "height": await $ctx.rsCtx.getEnt("height") || 100
      };
    });
    const pico2 = $ctx.krl.Function([], async function () {
      return {
        "eci": await uiECI2($ctx, []),
        "parent": await getOtherUiECI2($ctx, [$ctx.module("ctx")["parent"]($ctx)]),
        "children": await map1($ctx, [
          $ctx.module("ctx")["children"]($ctx),
          getOtherUiECI2
        ]),
        "channels": $ctx.module("ctx")["channels"]($ctx),
        "rulesets": $ctx.module("ctx")["rulesets"]($ctx)
      };
    });
    const logs2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("ctx")["logs"])($ctx, []);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:setup"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("setup");
        $ctx.log.debug("rule selected", { "rule_name": "setup" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["upsertChannel"])($ctx, {
            "tags": [
              "engine",
              "ui"
            ],
            "eventPolicy": {
              "allow": [
                {
                  "domain": "engine_ui",
                  "name": "setup"
                },
                {
                  "domain": "engine_ui",
                  "name": "box"
                },
                {
                  "domain": "engine_ui",
                  "name": "new"
                },
                {
                  "domain": "engine_ui",
                  "name": "del"
                },
                {
                  "domain": "engine_ui",
                  "name": "install"
                },
                {
                  "domain": "engine_ui",
                  "name": "uninstall"
                },
                {
                  "domain": "engine_ui",
                  "name": "flush"
                },
                {
                  "domain": "engine_ui",
                  "name": "new_channel"
                },
                {
                  "domain": "engine_ui",
                  "name": "del_channel"
                },
                {
                  "domain": "engine_ui",
                  "name": "testing_eci"
                },
                {
                  "domain": "engine",
                  "name": "started"
                }
              ],
              "deny": []
            },
            "queryPolicy": {
              "allow": [
                {
                  "rid": "*",
                  "name": "__testing"
                },
                {
                  "rid": "io.picolabs.pico-engine-ui",
                  "name": "uiECI"
                },
                {
                  "rid": "io.picolabs.pico-engine-ui",
                  "name": "box"
                },
                {
                  "rid": "io.picolabs.pico-engine-ui",
                  "name": "pico"
                },
                {
                  "rid": "io.picolabs.pico-engine-ui",
                  "name": "logs"
                },
                {
                  "rid": "io.picolabs.pico-engine-ui",
                  "name": "testingECI"
                },
                {
                  "rid": "io.picolabs.subscription",
                  "name": "established"
                }
              ],
              "deny": []
            }
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:box"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("box");
        $ctx.log.debug("rule selected", { "rule_name": "box" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "x"
          ]))
          await $ctx.rsCtx.putEnt("x", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "x"
            ]),
            "Number"
          ]));
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "y"
          ]))
          await $ctx.rsCtx.putEnt("y", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "y"
            ]),
            "Number"
          ]));
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "width"
          ]))
          await $ctx.rsCtx.putEnt("width", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "width"
            ]),
            "Number"
          ]));
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "height"
          ]))
          await $ctx.rsCtx.putEnt("height", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "height"
            ]),
            "Number"
          ]));
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "name"
          ]))
          await $ctx.rsCtx.putEnt("name", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "name"
            ]),
            "String"
          ]));
        if (await $stdlib["><"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "backgroundColor"
          ]))
          await $ctx.rsCtx.putEnt("backgroundColor", await as1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "backgroundColor"
            ]),
            "String"
          ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:new"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("new");
        $ctx.log.debug("rule selected", { "rule_name": "new" });
        const $name$3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "name"
        ]) || await $ctx.rsCtx.getEnt("name");
        const backgroundColor3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "backgroundColor"
        ]) || await $ctx.rsCtx.getEnt("backgroundColor");
        var $fired = true;
        if ($fired) {
          var newEci3 = await $ctx.krl.assertAction($ctx.module("ctx")["newPico"])($ctx, {
            "rulesets": [{
                "url": $ctx.module("ctx")["rid_url"]($ctx),
                "config": {}
              }]
          });
          var newUiECI3 = await $ctx.krl.assertAction($ctx.module("ctx")["eventQuery"])($ctx, {
            "eci": newEci3,
            "domain": "engine_ui",
            "name": "setup",
            "rid": "io.picolabs.pico-engine-ui",
            "queryName": "uiECI"
          });
          await $ctx.krl.assertAction($ctx.module("ctx")["event"])($ctx, {
            "eci": newUiECI3,
            "domain": "engine_ui",
            "name": "box",
            "attrs": {
              "name": $name$3,
              "backgroundColor": backgroundColor3
            }
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:del"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("del");
        $ctx.log.debug("rule selected", { "rule_name": "del" });
        const delUiEci3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "eci"
        ]);
        const delEci3 = await head1($ctx, [await filter1($ctx, [
            $ctx.module("ctx")["children"]($ctx),
            $ctx.krl.Function(["eci"], async function (eci4) {
              const other4 = await getOtherUiECI2($ctx, [eci4]);
              return await $stdlib["=="]($ctx, [
                other4,
                delUiEci3
              ]);
            })
          ])]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delPico"])($ctx, [delEci3]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:install"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("install");
        $ctx.log.debug("rule selected", { "rule_name": "install" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["flush"])($ctx, { "url": url3 });
          await $ctx.krl.assertAction($ctx.module("ctx")["install"])($ctx, {
            "url": url3,
            "config": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "config"
            ])
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          const this_rs3 = await filter1($ctx, [
            $ctx.module("ctx")["rulesets"]($ctx),
            $ctx.krl.Function(["r"], async function (r4) {
              return await $stdlib["=="]($ctx, [
                await get1($ctx, [
                  r4,
                  "url"
                ]),
                url3
              ]);
            })
          ]);
          await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_installed", {
            "rids": await map1($ctx, [
              this_rs3,
              $ctx.krl.Function(["r"], async function (r4) {
                return await get1($ctx, [
                  r4,
                  "rid"
                ]);
              })
            ])
          });
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:uninstall"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("uninstall");
        $ctx.log.debug("rule selected", { "rule_name": "uninstall" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["uninstall"])($ctx, {
            "rid": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "rid"
            ])
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:flush"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("flush");
        $ctx.log.debug("rule selected", { "rule_name": "flush" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["flush"])($ctx, {
            "url": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "url"
            ])
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:new_channel"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("new_channel");
        $ctx.log.debug("rule selected", { "rule_name": "new_channel" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["newChannel"])($ctx, {
            "tags": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "tags"
            ]),
            "eventPolicy": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "eventPolicy"
            ]),
            "queryPolicy": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "queryPolicy"
            ])
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:del_channel"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("del_channel");
        $ctx.log.debug("rule selected", { "rule_name": "del_channel" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delChannel"])($ctx, [await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "eci"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:testing_eci"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("testing_eci");
        $ctx.log.debug("rule selected", { "rule_name": "testing_eci" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("testingECI", await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "eci"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return $ctx.drainDirectives();
      },
      "query": {
        "box": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return box2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "uiECI": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return uiECI2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "pico": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return pico2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "logs": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return logs2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "testingECI": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return testingECI2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "name": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return $name$2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
