module.exports = {
  "rid": "io.picolabs.wrangler",
  "meta": {
    "name": "Wrangler Core",
    "description": "\n      Wrangler Core Module,\n      use example: \"use module io.picolabs.wrangler alias wrangler\".\n      This Ruleset/Module provides a developer interface to the pico (persistent computer object).\n      When a pico is created or authenticated this ruleset will be installed to provide essential\n      services.\n    ",
    "author": "BYU Pico Lab",
    "provides": [
      "skyQuery",
      "channels",
      "rulesetsInfo",
      "installedRulesets",
      "installRulesets",
      "uninstallRulesets",
      "registeredRulesets",
      "channel",
      "alwaysEci",
      "nameFromEci",
      "createChannel",
      "newPolicy",
      "children",
      "parent_eci",
      "name",
      "profile",
      "pico",
      "randomPicoName",
      "myself",
      "isMarkedForDeath"
    ],
    "shares": [
      "skyQuery",
      "channels",
      "rulesetsInfo",
      "installedRulesets",
      "registeredRulesets",
      "channel",
      "alwaysEci",
      "nameFromEci",
      "children",
      "parent_eci",
      "name",
      "profile",
      "pico",
      "randomPicoName",
      "myself",
      "id",
      "MAX_RAND_ENGL_NAMES",
      "isMarkedForDeath",
      "getPicoMap",
      "timeForCleanup",
      "__testing"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const put1 = $stdlib["put"];
    const append1 = $stdlib["append"];
    const defaultsTo1 = $stdlib["defaultsTo"];
    const decode1 = $stdlib["decode"];
    const $typeof$1 = $stdlib["typeof"];
    const isnull1 = $stdlib["isnull"];
    const split1 = $stdlib["split"];
    const map1 = $stdlib["map"];
    const any1 = $stdlib["any"];
    const head1 = $stdlib["head"];
    const filter1 = $stdlib["filter"];
    const collect1 = $stdlib["collect"];
    const $length$1 = $stdlib["length"];
    const reduce1 = $stdlib["reduce"];
    const none1 = $stdlib["none"];
    const send_directive1 = $stdlib["send_directive"];
    const intersection1 = $stdlib["intersection"];
    const difference1 = $stdlib["difference"];
    const join1 = $stdlib["join"];
    const splice1 = $stdlib["splice"];
    const $delete$1 = $stdlib["delete"];
    const get1 = $stdlib["get"];
    const klog1 = $stdlib["klog"];
    const noop1 = $stdlib["noop"];
    const keys1 = $stdlib["keys"];
    const __testing1 = {
      "queries": [
        {
          "name": "skyQuery",
          "args": [
            "eci",
            "mod",
            "func",
            "params",
            "_host",
            "_path",
            "_root_url"
          ]
        },
        {
          "name": "channels",
          "args": []
        },
        {
          "name": "rulesetsInfo",
          "args": ["rids"]
        },
        {
          "name": "installedRulesets",
          "args": []
        },
        {
          "name": "registeredRulesets",
          "args": []
        },
        {
          "name": "channel",
          "args": [
            "value",
            "collection",
            "filtered"
          ]
        },
        {
          "name": "alwaysEci",
          "args": ["value"]
        },
        {
          "name": "nameFromEci",
          "args": ["eci"]
        },
        {
          "name": "children",
          "args": [
            "name",
            "allowRogue"
          ]
        },
        {
          "name": "parent_eci",
          "args": []
        },
        {
          "name": "name",
          "args": []
        },
        {
          "name": "profile",
          "args": ["key"]
        },
        {
          "name": "pico",
          "args": []
        },
        {
          "name": "randomPicoName",
          "args": []
        },
        {
          "name": "pico",
          "args": []
        },
        {
          "name": "myself",
          "args": []
        },
        {
          "name": "id",
          "args": []
        },
        {
          "name": "MAX_RAND_ENGL_NAMES",
          "args": []
        },
        {
          "name": "isMarkedForDeath",
          "args": []
        },
        {
          "name": "getPicoMap",
          "args": []
        },
        {
          "name": "timeForCleanup",
          "args": []
        },
        {
          "name": "__testing",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "wrangler",
          "name": "asyncSkyQuery",
          "attrs": []
        },
        {
          "domain": "system",
          "name": "online",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "install_rulesets_requested",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "install_rulesets_requested",
          "attrs": ["init"]
        },
        {
          "domain": "wrangler",
          "name": "install_ruleset_request",
          "attrs": [
            "absoluteURL",
            "rid"
          ]
        },
        {
          "domain": "wrangler",
          "name": "install_ruleset_request",
          "attrs": [
            "url",
            "config"
          ]
        },
        {
          "domain": "wrangler",
          "name": "uninstall_rulesets_requested",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "channel_creation_requested",
          "attrs": [
            "name",
            "type",
            "policy_id"
          ]
        },
        {
          "domain": "wrangler",
          "name": "channel_deletion_requested",
          "attrs": [
            "eci",
            "name"
          ]
        },
        {
          "domain": "wrangler",
          "name": "new_child_request",
          "attrs": [
            "name",
            "backgroundColor"
          ]
        },
        {
          "domain": "wrangler",
          "name": "child_creation_failure",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "child_created",
          "attrs": [
            "rids_to_install",
            "rids_from_url",
            "parent_eci",
            "name",
            "id",
            "eci"
          ]
        },
        {
          "domain": "wrangler",
          "name": "finish_initialization",
          "attrs": [
            "parent_eci",
            "name"
          ]
        },
        {
          "domain": "wrangler",
          "name": "root_created",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "child_deletion_request",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "child_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "delete_children",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "send_intent_to_delete",
          "attrs": ["picoIDArray"]
        },
        {
          "domain": "wrangler",
          "name": "child_ready_for_deletion",
          "attrs": [
            "id",
            "parent_eci"
          ]
        },
        {
          "domain": "wrangler",
          "name": "child_sync",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "force_child_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "force_children_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "force_child_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "force_children_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "picos_to_force_delete_ready",
          "attrs": ["picoIDArray"]
        },
        {
          "domain": "wrangler",
          "name": "intent_to_delete_pico",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "set_timeout_before_pico_deleted",
          "attrs": ["new_timeout"]
        },
        {
          "domain": "wrangler",
          "name": "ruleset_needs_cleanup_period",
          "attrs": ["domain"]
        },
        {
          "domain": "wrangler",
          "name": "cleanup_finished",
          "attrs": ["domain"]
        },
        {
          "domain": "wrangler",
          "name": "pico_cleanup_timed_out",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "intent_to_delete_pico",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "cleanup_finished",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "child_ready_for_deletion",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "delete_this_pico_if_ready",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "pico_cleanup_timed_out",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "pico_forcibly_removed",
          "attrs": []
        }
      ]
    };
    const __testing2 = {
      "queries": [
        {
          "name": "channel",
          "args": [
            "value",
            "collection",
            "filtered"
          ]
        },
        {
          "name": "skyQuery",
          "args": [
            "eci",
            "mod",
            "func",
            "params",
            "_host",
            "_path",
            "_root_url"
          ]
        },
        {
          "name": "children",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "wrangler",
          "name": "new_child_request",
          "attrs": [
            "name",
            "backgroundColor"
          ]
        },
        {
          "domain": "wrangler",
          "name": "child_deletion",
          "attrs": [
            "id",
            "name"
          ]
        },
        {
          "domain": "wrangler",
          "name": "child_sync",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "channel_creation_requested",
          "attrs": [
            "name",
            "channel_type"
          ]
        },
        {
          "domain": "wrangler",
          "name": "channel_deletion_requested",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "install_rulesets_requested",
          "attrs": [
            "rids",
            "url"
          ]
        },
        {
          "domain": "wrangler",
          "name": "force_child_deletion",
          "attrs": [
            "id",
            "name"
          ]
        }
      ]
    };
    const config2 = {
      "os_rids": [
        "io.picolabs.wrangler",
        "io.picolabs.visual_params"
      ],
      "connection_rids": ["io.picolabs.subscription"]
    };
    const QUERY_SELF_INVALID_HTTP_MAP2 = {
      "status_code": 400,
      "status_line": "HTTP/1.1 400 Pico should not query itself",
      "content": "{\"error\":\"Pico should not query itself\"}"
    };
    const buildWebHook2 = $ctx.krl.Function([
      "eci",
      "mod",
      "func",
      "_host",
      "_path",
      "_root_url"
    ], async function (eci3, mod3, func3, _host3, _path3, _root_url3) {
      const createRootUrl3 = $ctx.krl.Function([
        "_host",
        "_path"
      ], async function (_host4, _path4) {
        const host4 = _host4 || $ctx.module("meta")["host"]($ctx);
        const path4 = _path4 || "/sky/cloud/";
        const root_url4 = await $stdlib["+"]($ctx, [
          host4,
          path4
        ]);
        return root_url4;
      });
      const root_url3 = _root_url3 || await $ctx.krl.assertFunction(createRootUrl3)($ctx, [
        _host3,
        _path3
      ]);
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            await $stdlib["+"]($ctx, [
              await $stdlib["+"]($ctx, [
                root_url3,
                eci3
              ]),
              "/"
            ]),
            mod3
          ]),
          "/"
        ]),
        func3
      ]);
    });
    const processHTTPResponse2 = $ctx.krl.Function(["response"], async function (response3) {
      const status3 = await $stdlib["get"]($ctx, [
        response3,
        "status_code"
      ]);
      const error_info3 = {
        "error": "sky query request was unsuccesful.",
        "httpStatus": {
          "code": status3,
          "message": await $stdlib["get"]($ctx, [
            response3,
            "status_line"
          ])
        }
      };
      const response_content3 = await decode1($ctx, [await $stdlib["get"]($ctx, [
          response3,
          "content"
        ])]);
      const response_error3 = await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [response_content3]),
        "Map"
      ]) && !await isnull1($ctx, [await $stdlib["get"]($ctx, [
          response_content3,
          "error"
        ])]) ? await $stdlib["get"]($ctx, [
        response_content3,
        "error"
      ]) : 0;
      const response_error_str3 = await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [response_content3]),
        "Map"
      ]) && !await isnull1($ctx, [await $stdlib["get"]($ctx, [
          response_content3,
          "error_str"
        ])]) ? await $stdlib["get"]($ctx, [
        response_content3,
        "error_str"
      ]) : 0;
      const error3 = await put1($ctx, [
        error_info3,
        {
          "skyQueryError": response_error3,
          "skyQueryErrorMsg": response_error_str3,
          "skyQueryReturnValue": response_content3
        }
      ]);
      const is_bad_response3 = await isnull1($ctx, [response_content3]) || await $stdlib["=="]($ctx, [
        response_content3,
        "null"
      ]) || response_error3 || response_error_str3;
      return await $stdlib["=="]($ctx, [
        status3,
        200
      ]) && !is_bad_response3 ? response_content3 : error3;
    });
    const skyQuery2 = $ctx.krl.Function([
      "eci",
      "mod",
      "func",
      "params",
      "_host",
      "_path",
      "_root_url"
    ], async function (eci3, mod3, func3, params3, _host3, _path3, _root_url3) {
      const thisPico3 = eci3 ? await $stdlib["=="]($ctx, [
        await $ctx.krl.assertFunction($ctx.module("engine")["getPicoIDByECI"])($ctx, [await defaultsTo1($ctx, [
            eci3,
            ""
          ])]),
        $ctx.module("meta")["picoId"]($ctx)
      ]) : false;
      const web_hook3 = await buildWebHook2($ctx, [
        eci3,
        mod3,
        func3,
        _host3,
        _path3,
        _root_url3
      ]);
      const response3 = !thisPico3 ? await $ctx.krl.assertFunction($ctx.module("http")["get"])($ctx, [
        web_hook3,
        await put1($ctx, [
          {},
          params3
        ])
      ]) : QUERY_SELF_INVALID_HTTP_MAP2;
      return await processHTTPResponse2($ctx, [response3]);
    });
    const getPicoMap2 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("name"),
        "id": await $ctx.rsCtx.getEnt("id"),
        "parent_eci": await $ctx.rsCtx.getEnt("parent_eci"),
        "eci": await $ctx.rsCtx.getEnt("eci")
      };
    });
    const isMarkedForDeath2 = $ctx.krl.Function([], async function () {
      return await defaultsTo1($ctx, [
        await $ctx.rsCtx.getEnt("marked_for_death"),
        false
      ]);
    });
    const timeForCleanup2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("default_timeout");
    });
    const registeredRulesets2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("engine")["listAllEnabledRIDs"])($ctx, []);
    });
    const rulesetsInfo2 = $ctx.krl.Function(["rids"], async function (rids3) {
      const _rids3 = await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [rids3]),
        "Array"
      ]) ? rids3 : await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [rids3]),
        "String"
      ]) ? await split1($ctx, [
        rids3,
        ";"
      ]) : "";
      return await map1($ctx, [
        _rids3,
        $ctx.krl.Function(["rid"], async function (rid4) {
          return await $ctx.krl.assertFunction($ctx.module("engine")["describeRuleset"])($ctx, [rid4]);
        })
      ]);
    });
    const gatherGivenArray2 = $ctx.krl.Function([
      "attr1",
      "attr2"
    ], async function (attr13, attr23) {
      const items3 = await defaultsTo1($ctx, [
        await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, [attr13]),
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, [attr23])
        ]),
        ""
      ]);
      const item_list3 = await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [items3]),
        "Array"
      ]) ? items3 : items3 ? await split1($ctx, [
        items3,
        new RegExp(";", "")
      ]) : [];
      return item_list3;
    });
    const installedRulesets2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("engine")["listInstalledRIDs"])($ctx, [$ctx.module("meta")["picoId"]($ctx)]);
    });
    const installRulesets2 = $ctx.krl.Action(["rids"], async function (rids3) {
      var $fired = true;
      if ($fired) {
        var new_ruleset3 = await $ctx.krl.assertAction($ctx.module("engine")["installRuleset"])(this, [
          $ctx.module("meta")["picoId"]($ctx),
          rids3
        ]);
      }
      return { "rids": new_ruleset3 };
    });
    const installRulesetByURL2 = $ctx.krl.Action(["url"], async function (url3) {
      var $fired = true;
      if ($fired) {
        var new_ruleset3 = await $ctx.krl.assertAction($ctx.module("engine")["installRuleset"])(this, {
          "0": $ctx.module("meta")["picoId"]($ctx),
          "url": url3
        });
      }
      return [new_ruleset3];
    });
    const uninstallRulesets2 = $ctx.krl.Action(["rids"], async function (rids3) {
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("engine")["uninstallRuleset"])(this, [
          $ctx.module("meta")["picoId"]($ctx),
          rids3
        ]);
      }
      return {};
    });
    const channels2 = $ctx.krl.Function([], async function () {
      return $ctx.module("ctx")["channels"]($ctx);
    });
    const channelNameExists2 = $ctx.krl.Function(["name"], async function ($name$3) {
      return !await isnull1($ctx, [await $ctx.krl.assertFunction(channel2)($ctx, [
          $name$3,
          void 0,
          void 0
        ])]);
    });
    const channelNameExistsForType2 = $ctx.krl.Function([
      "name",
      "type"
    ], async function ($name$3, type3) {
      const channel_array3 = await $ctx.krl.assertFunction(channel2)($ctx, [
        void 0,
        "type",
        type3
      ]);
      return await any1($ctx, [
        channel_array3,
        $ctx.krl.Function(["channel"], async function (channel4) {
          return await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              channel4,
              "name"
            ]),
            $name$3
          ]);
        })
      ]);
    });
    const nameFromEci2 = $ctx.krl.Function(["eci"], async function (eci3) {
      const channel3 = await $ctx.krl.assertFunction(channel2)($ctx, [
        eci3,
        void 0,
        void 0
      ]);
      return await $stdlib["get"]($ctx, [
        channel3,
        "name"
      ]);
    });
    const alwaysEci2 = $ctx.krl.Function(["value"], async function (value3) {
      const channels3 = await $ctx.krl.assertFunction($ctx.module("engine")["listChannels"])($ctx, [$ctx.module("meta")["picoId"]($ctx)]);
      const channel3 = await defaultsTo1($ctx, [
        await head1($ctx, [await filter1($ctx, [
            channels3,
            $ctx.krl.Function(["chan"], async function (chan4) {
              return await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  chan4,
                  "id"
                ]),
                value3
              ]) || await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  chan4,
                  "name"
                ]),
                value3
              ]);
            })
          ])]),
        {},
        "no channel found in alwayseci, by .head()"
      ]);
      return await $stdlib["get"]($ctx, [
        channel3,
        "id"
      ]);
    });
    const channel2 = $ctx.krl.Function([
      "value",
      "collection",
      "filtered"
    ], async function (value3, collection3, filtered3) {
      const channels3 = await $ctx.krl.assertFunction($ctx.module("engine")["listChannels"])($ctx, [$ctx.module("meta")["picoId"]($ctx)]);
      const single_channel3 = $ctx.krl.Function(["channels"], async function (channels4) {
        const channel_list4 = channels4;
        const result4 = await defaultsTo1($ctx, [
          await head1($ctx, [await filter1($ctx, [
              channel_list4,
              $ctx.krl.Function(["chan"], async function (chan5) {
                return await $stdlib["=="]($ctx, [
                  await $stdlib["get"]($ctx, [
                    chan5,
                    "id"
                  ]),
                  value3
                ]) || await $stdlib["=="]($ctx, [
                  await $stdlib["get"]($ctx, [
                    chan5,
                    "name"
                  ]),
                  value3
                ]);
              })
            ])]),
          void 0,
          "no channel found, by .head()"
        ]);
        return result4;
      });
      const type3 = $ctx.krl.Function(["chan"], async function (chan4) {
        const group4 = await $stdlib["=="]($ctx, [
          await $typeof$1($ctx, [chan4]),
          "Map"
        ]) ? await $stdlib["get"]($ctx, [
          chan4,
          collection3
        ]) : "error";
        return group4;
      });
      const return13 = await isnull1($ctx, [collection3]) ? channels3 : await collect1($ctx, [
        channels3,
        $ctx.krl.Function(["chan"], async function (chan4) {
          return await $ctx.krl.assertFunction(type3)($ctx, [chan4]);
        })
      ]);
      const return23 = await isnull1($ctx, [filtered3]) ? return13 : await $stdlib["get"]($ctx, [
        return13,
        filtered3
      ]);
      return await isnull1($ctx, [value3]) ? return23 : await single_channel3($ctx, [channels3]);
    });
    const deleteChannel2 = $ctx.krl.Action(["value"], async function (value3) {
      const channel3 = await $ctx.krl.assertFunction(channel2)($ctx, [
        value3,
        void 0,
        void 0
      ]);
      const eci3 = await $stdlib["get"]($ctx, [
        channel3,
        "id"
      ]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("engine")["removeChannel"])(this, [eci3]);
      }
      return channel3;
    });
    const createChannel2 = $ctx.krl.Action([
      "tags",
      "eventPolicy",
      "queryPolicy"
    ], async function (tags3, eventPolicy3, queryPolicy3) {
      var $fired = true;
      if ($fired) {
        var channel3 = await $ctx.krl.assertAction($ctx.module("ctx")["newChannel"])(this, {
          "tags": tags3,
          "eventPolicy": eventPolicy3,
          "queryPolicy": queryPolicy3
        });
      }
      return channel3;
    });
    const newPolicy2 = $ctx.krl.Action(["new_policy"], async function (new_policy3) {
      var $fired = true;
      if ($fired) {
        var created_policy3 = await $ctx.krl.assertAction($ctx.module("engine")["newPolicy"])(this, [new_policy3]);
      }
      return created_policy3;
    });
    const myself2 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("name"),
        "id": await $ctx.rsCtx.getEnt("id"),
        "eci": await $ctx.rsCtx.getEnt("eci")
      };
    });
    const childrenAsMap2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("wrangler_children");
    });
    const children2 = $ctx.krl.Function([
      "name",
      "allowRogue"
    ], async function ($name$3, allowRogue3 = true) {
      const convert3 = $ctx.krl.Function(["eci"], async function (eci4) {
        const pico4 = await put1($ctx, [
          await put1($ctx, [
            await put1($ctx, [
              {},
              "eci",
              eci4
            ]),
            "name",
            await $ctx.krl.assertFunction($ctx.module("ctx")["query"])($ctx, [
              eci4,
              "io.picolabs.pico-engine-ui",
              "name"
            ])
          ]),
          "parent_eci",
          await $ctx.krl.assertFunction($ctx.module("ctx")["query"])($ctx, [
            eci4,
            $ctx.module("ctx")["rid"]($ctx),
            "parent_eci"
          ])
        ]);
        return pico4;
      });
      const wrangler_children3 = await map1($ctx, [
        $ctx.module("ctx")["children"]($ctx),
        convert3
      ]);
      return wrangler_children3;
    });
    const getChild2 = $ctx.krl.Function(["id"], async function (id3) {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("wrangler_children"),
        id3
      ]);
    });
    const parent_eci2 = $ctx.krl.Function([], async function () {
      return $ctx.module("ctx")["parent"]($ctx);
    });
    const profile2 = $ctx.krl.Function(["key"], async function (key3) {
      return {};
    });
    const pico2 = $ctx.krl.Function([], async function () {
      const profile_return3 = {};
      const settings_return3 = {};
      const general_return3 = {};
      return {
        "profile": await $stdlib["get"]($ctx, [
          profile_return3,
          "profile"
        ]),
        "settings": await $stdlib["get"]($ctx, [
          settings_return3,
          "settings"
        ]),
        "general": await $stdlib["get"]($ctx, [
          general_return3,
          "general"
        ])
      };
    });
    const $name$2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("name");
    });
    const id2 = $ctx.krl.Function([], async function () {
      return $ctx.module("meta")["picoId"]($ctx);
    });
    const picoECIFromName2 = $ctx.krl.Function(["name"], async function ($name$3) {
      const pico3 = await head1($ctx, [await filter1($ctx, [
          await $ctx.rsCtx.getEnt("wrangler_children"),
          $ctx.krl.Function(["rec"], async function (rec4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                rec4,
                "name"
              ]),
              $name$3
            ]);
          })
        ])]);
      return await $stdlib["get"]($ctx, [
        pico3,
        "eci"
      ]);
    });
    const gatherDescendants2 = $ctx.krl.Function(["childID"], async function (childID3) {
      const moreChildren3 = await $ctx.krl.assertFunction($ctx.module("engine")["listChildren"])($ctx, [childID3]);
      const gatherChildrensChildren3 = $ctx.krl.Function(["moreChildren"], async function (moreChildren4) {
        const arrayOfChildrenArrays4 = await map1($ctx, [
          moreChildren4,
          $ctx.krl.Function(["x"], async function (x5) {
            return await $ctx.krl.assertFunction(gatherDescendants2)($ctx, [x5]);
          })
        ]);
        return await reduce1($ctx, [
          arrayOfChildrenArrays4,
          $ctx.krl.Function([
            "a",
            "b"
          ], async function (a5, b5) {
            return await append1($ctx, [
              a5,
              b5
            ]);
          })
        ]);
      });
      const result3 = await $stdlib["=="]($ctx, [
        await $length$1($ctx, [moreChildren3]),
        0
      ]) ? [] : await append1($ctx, [
        await $ctx.krl.assertFunction(gatherChildrensChildren3)($ctx, [moreChildren3]),
        moreChildren3
      ]);
      return result3;
    });
    const picoFromName2 = $ctx.krl.Function(["value"], async function (value3) {
      const ret3 = await filter1($ctx, [
        await defaultsTo1($ctx, [
          await children2($ctx, []),
          []
        ]),
        $ctx.krl.Function(["child"], async function (child4) {
          return await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              child4,
              "name"
            ]),
            value3
          ]) || await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              child4,
              "id"
            ]),
            value3
          ]);
        })
      ]);
      return await defaultsTo1($ctx, [
        await head1($ctx, [ret3]),
        "Error"
      ]);
    });
    const hasChild2 = $ctx.krl.Function(["value"], async function (value3) {
      return await head1($ctx, [await filter1($ctx, [
          await children2($ctx, []),
          $ctx.krl.Function(["child"], async function (child4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                child4,
                "name"
              ]),
              value3
            ]) || await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                child4,
                "id"
              ]),
              value3
            ]);
          })
        ])]);
    });
    const getPicosToDelete2 = $ctx.krl.Function([
      "deleteMap",
      "allowRogue"
    ], async function (deleteMap3, allowRogue3 = false) {
      const givenPicoID3 = await $stdlib["get"]($ctx, [
        deleteMap3,
        "id"
      ]);
      const nameToDelete3 = await $stdlib["get"]($ctx, [
        deleteMap3,
        "name"
      ]);
      const deleteAll3 = await $stdlib["get"]($ctx, [
        deleteMap3,
        "delete_all"
      ]);
      const filteredForRogue3 = allowRogue3 ? await $ctx.rsCtx.getEnt("wrangler_children") : await filter1($ctx, [
        await $ctx.rsCtx.getEnt("wrangler_children"),
        $ctx.krl.Function([
          "pico",
          "ID"
        ], async function (pico4, ID4) {
          return !await $stdlib["get"]($ctx, [
            pico4,
            "rogue"
          ]);
        })
      ]);
      return deleteAll3 ? filteredForRogue3 : await filter1($ctx, [
        filteredForRogue3,
        $ctx.krl.Function([
          "childMap",
          "childID"
        ], async function (childMap4, childID4) {
          return await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              childMap4,
              "name"
            ]),
            nameToDelete3
          ]) || await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              childMap4,
              "id"
            ]),
            givenPicoID3
          ]);
        })
      ]);
    });
    const getChildMapFromIDs2 = $ctx.krl.Function(["picoIDs"], async function (picoIDs3) {
      return await map1($ctx, [
        await collect1($ctx, [
          picoIDs3,
          $ctx.krl.Function(["id"], async function (id4) {
            return id4;
          })
        ]),
        $ctx.krl.Function(["picoIDArray"], async function (picoIDArray4) {
          const picoID4 = await $stdlib["get"]($ctx, [
            picoIDArray4,
            [0]
          ]);
          const grabbedChannel4 = await reduce1($ctx, [
            await $ctx.krl.assertFunction($ctx.module("engine")["listChannels"])($ctx, [picoID4]),
            $ctx.krl.Function([
              "channel_a",
              "channel_b"
            ], async function (channel_a5, channel_b5) {
              return channel_a5 ? channel_a5 : await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  channel_b5,
                  "name"
                ]),
                "main"
              ]) && await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  channel_b5,
                  "type"
                ]),
                "wrangler"
              ]) ? channel_b5 : await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  channel_b5,
                  "name"
                ]),
                "admin"
              ]) && await $stdlib["=="]($ctx, [
                await $stdlib["get"]($ctx, [
                  channel_b5,
                  "type"
                ]),
                "secret"
              ]) ? channel_b5 : channel_a5;
            }),
            void 0
          ]);
          const grabbedEci4 = await $stdlib["get"]($ctx, [
            grabbedChannel4,
            "id"
          ]);
          const attemptedMap4 = await skyQuery2($ctx, [
            grabbedEci4,
            $ctx.module("meta")["rid"]($ctx),
            "getPicoMap"
          ]);
          return await isnull1($ctx, [await $stdlib["get"]($ctx, [
              attemptedMap4,
              "error"
            ])]) ? await put1($ctx, [
            attemptedMap4,
            "eci",
            grabbedEci4
          ]) : {
            "id": picoID4,
            "parent_eci": "",
            "name": await $stdlib["+"]($ctx, [
              "rogue_",
              await $ctx.krl.assertFunction($ctx.module("random")["uuid"])($ctx, [])
            ]),
            "eci": grabbedEci4,
            "rogue": true
          };
        })
      ]);
    });
    const createPico2 = $ctx.krl.Action([
      "name",
      "rids",
      "rids_from_url"
    ], async function ($name$3, rids3, rids_from_url3) {
      var $fired = true;
      if ($fired) {
        var parent_channel3 = await $ctx.krl.assertAction($ctx.module("engine")["newChannel"])(this, [
          $ctx.module("meta")["picoId"]($ctx),
          $name$3,
          "children"
        ]);
        var child3 = await $ctx.krl.assertAction($ctx.module("engine")["newPico"])(this, []);
        var channel3 = await $ctx.krl.assertAction($ctx.module("engine")["newChannel"])(this, [
          await $stdlib["get"]($ctx, [
            child3,
            "id"
          ]),
          "main",
          "wrangler"
        ]);
        await $ctx.krl.assertAction($ctx.module("engine")["installRuleset"])(this, [
          await $stdlib["get"]($ctx, [
            child3,
            "id"
          ]),
          await $stdlib["get"]($ctx, [
            config2,
            "os_rids"
          ])
        ]);
        await $ctx.krl.assertAction($ctx.module("event")["send"])(this, [{
            "eci": await $stdlib["get"]($ctx, [
              channel3,
              "id"
            ]),
            "domain": "wrangler",
            "type": "child_created",
            "attrs": await put1($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              {
                "parent_eci": await $stdlib["get"]($ctx, [
                  parent_channel3,
                  "id"
                ]),
                "name": $name$3,
                "id": await $stdlib["get"]($ctx, [
                  child3,
                  "id"
                ]),
                "eci": await $stdlib["get"]($ctx, [
                  channel3,
                  "id"
                ]),
                "rids_to_install": await append1($ctx, [
                  await defaultsTo1($ctx, [
                    rids3,
                    []
                  ]),
                  await $stdlib["get"]($ctx, [
                    config2,
                    "connection_rids"
                  ])
                ]),
                "rids_from_url": await defaultsTo1($ctx, [
                  rids_from_url3,
                  []
                ])
              }
            ])
          }]);
      }
      return {
        "parent_eci": await $stdlib["get"]($ctx, [
          parent_channel3,
          "id"
        ]),
        "name": $name$3,
        "id": await $stdlib["get"]($ctx, [
          child3,
          "id"
        ]),
        "eci": await $stdlib["get"]($ctx, [
          channel3,
          "id"
        ])
      };
    });
    const MAX_RAND_ENGL_NAMES2 = 200;
    const randomPicoName2 = $ctx.krl.Function([], async function () {
      const w_children3 = await children2($ctx, []);
      const generateName3 = $ctx.krl.Function([], async function () {
        const word4 = await $ctx.krl.assertFunction($ctx.module("random")["word"])($ctx, []);
        return await none1($ctx, [
          w_children3,
          $ctx.krl.Function(["child"], async function (child5) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                child5,
                "name"
              ]),
              word4
            ]);
          })
        ]) ? word4 : await $ctx.krl.assertFunction(generateName3)($ctx, []);
      });
      return await $stdlib[">"]($ctx, [
        await $length$1($ctx, [w_children3]),
        MAX_RAND_ENGL_NAMES2
      ]) ? await $ctx.krl.assertFunction($ctx.module("random")["uuid"])($ctx, []) : await generateName3($ctx, []);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("wrangler:asyncSkyQuery"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("asyncSkyQuery");
        $ctx.log.debug("rule selected", { "rule_name": "asyncSkyQuery" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("system:online"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await children2($ctx, []));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let child3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("systemOnLine");
          $ctx.log.debug("rule selected", { "rule_name": "systemOnLine" });
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
                "eci": await $stdlib["get"]($ctx, [
                  child3,
                  "eci"
                ]),
                "domain": "system",
                "type": "online",
                "attrs": $ctx.module("event")["attrs"]($ctx)
              }]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:install_rulesets_requested"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await gatherGivenArray2($ctx, [
          "urls",
          "url"
        ]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let url3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("installURLRulesets");
          $ctx.log.debug("rule selected", { "rule_name": "installURLRulesets" });
          var $fired = true;
          if ($fired) {
            var rids3 = await installRulesetByURL2($ctx, [url3]);
            await send_directive1($ctx, [
              "rulesets installed",
              { "rids": rids3 }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          if ($fired) {
            await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_added", await put1($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "rids",
              rids3
            ]));
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:install_rulesets_requested"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("installRulesets");
        $ctx.log.debug("rule selected", { "rule_name": "installRulesets" });
        const rid_list3 = await gatherGivenArray2($ctx, [
          "rids",
          "rid"
        ]);
        const valid_rids3 = await intersection1($ctx, [
          rid_list3,
          await registeredRulesets2($ctx, [])
        ]);
        const invalid_rids3 = await difference1($ctx, [
          rid_list3,
          valid_rids3
        ]);
        const initial_install3 = await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["init"]),
          false
        ]);
        var $fired = await $stdlib[">"]($ctx, [
          await $length$1($ctx, [valid_rids3]),
          0
        ]);
        if ($fired) {
          var rids3 = await installRulesets2($ctx, [valid_rids3]);
          await send_directive1($ctx, [
            "rulesets installed",
            {
              "rids": await $stdlib["get"]($ctx, [
                rids3,
                "rids"
              ])
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_added", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["rids"],
            await $stdlib["get"]($ctx, [
              rids3,
              "rids"
            ])
          ]));
        }
        if (await $stdlib[">"]($ctx, [
            await $length$1($ctx, [invalid_rids3]),
            0
          ]))
          await $ctx.rsCtx.raiseEvent("wrangler", "install_rulesets_error", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["rids"],
            invalid_rids3
          ]));
        if (await $stdlib["=="]($ctx, [
            initial_install3,
            true
          ]))
          await $ctx.rsCtx.raiseEvent("wrangler", "finish_initialization", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "rids",
            await $stdlib["get"]($ctx, [
              rids3,
              "rids"
            ])
          ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:install_ruleset_request", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(.+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "absoluteURL") ? $stdlib.as($ctx, [
        $event.data.attrs["absoluteURL"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      m = new RegExp("(.+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "rid") ? $stdlib.as($ctx, [
        $event.data.attrs["rid"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var absoluteURL3 = setting["absoluteURL"] = matches[0];
      var rid3 = setting["rid"] = matches[1];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("install_ruleset_relatively");
        $ctx.log.debug("rule selected", { "rule_name": "install_ruleset_relatively" });
        var absoluteURL3 = $state.setting["absoluteURL"];
        var rid3 = $state.setting["rid"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        const parts3 = await split1($ctx, [
          absoluteURL3,
          "/"
        ]);
        const url3 = await join1($ctx, [
          await splice1($ctx, [
            parts3,
            await $stdlib["-"]($ctx, [
              await $length$1($ctx, [parts3]),
              1
            ]),
            1,
            await $stdlib["+"]($ctx, [
              rid3,
              ".krl"
            ])
          ]),
          "/"
        ]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "install_ruleset_request", await put1($ctx, [
            await $delete$1($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "absoluteURL"
            ]),
            { "url": url3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:install_ruleset_request", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(.+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "url") ? $stdlib.as($ctx, [
        $event.data.attrs["url"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var url3 = setting["url"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("install_ruleset_absolutely");
        $ctx.log.debug("rule selected", { "rule_name": "install_ruleset_absolutely" });
        var url3 = $state.setting["url"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        const config3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["config"]) || {};
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["flush"])($ctx, { "url": url3 });
          await $ctx.krl.assertAction($ctx.module("ctx")["install"])($ctx, {
            "url": url3,
            "config": config3
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
          await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_installed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            {
              "rids": await map1($ctx, [
                this_rs3,
                $ctx.krl.Function(["r"], async function (r4) {
                  return await get1($ctx, [
                    r4,
                    "rid"
                  ]);
                })
              ])
            }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:uninstall_rulesets_requested"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("uninstallRulesets");
        $ctx.log.debug("rule selected", { "rule_name": "uninstallRulesets" });
        const rid_list3 = await gatherGivenArray2($ctx, [
          "rids",
          "rid"
        ]);
        var $fired = true;
        if ($fired) {
          await uninstallRulesets2($ctx, [rid_list3]);
          await send_directive1($ctx, [
            "rulesets uninstalled",
            { "rids": rid_list3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:channel_creation_requested"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("createChannel");
        $ctx.log.debug("rule selected", { "rule_name": "createChannel" });
        const channel_name3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"]);
        const channel_type3 = await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["type"]),
          "_wrangler"
        ]);
        var $fired = !await channelNameExistsForType2($ctx, [
          channel_name3,
          channel_type3
        ]) && !await isnull1($ctx, [channel_name3]);
        if ($fired) {
          var channel3 = await createChannel2($ctx, [
            $ctx.module("meta")["picoId"]($ctx),
            channel_name3,
            channel_type3,
            await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["policy_id"])
          ]);
          await send_directive1($ctx, [
            "channel_Created",
            channel3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "channel_created", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["channel"],
            channel3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("system", "error", {
            "level": "info",
            "data": "could not create channel " + await $stdlib["as"]($ctx, [
              channel_name3,
              "String"
            ]) + ".",
            "rid": $ctx.rsCtx.ruleset.rid,
            "rule_name": "createChannel",
            "genus": "user"
          }, $ctx.rsCtx.ruleset.rid);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:channel_deletion_requested"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("deleteChannel");
        $ctx.log.debug("rule selected", { "rule_name": "deleteChannel" });
        const eci3 = await alwaysEci2($ctx, [await defaultsTo1($ctx, [
            await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["eci"]),
            await defaultsTo1($ctx, [
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"]),
              ""
            ])
          ])]);
        var $fired = eci3;
        if ($fired) {
          var channel3 = await deleteChannel2($ctx, [eci3]);
          await send_directive1($ctx, [
            "channel_deleted",
            channel3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "channel_deleted", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["channel"],
            channel3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "channel_deletion_failed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "reason",
            "No channel found for info given"
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:new_child_request", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp(".+", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      m = new RegExp(".*", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "backgroundColor") ? $stdlib.as($ctx, [
        $event.data.attrs["backgroundColor"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("createChild");
        $ctx.log.debug("rule selected", { "rule_name": "createChild" });
        const $name$3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "name"
        ]);
        const backgroundColor3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "backgroundColor"
        ]) || "#87CEFA";
        const engine_ui_rid3 = "io.picolabs.pico-engine-ui";
        const engine_ui_ruleset3 = $ctx.krl.Function([], async function () {
          const the_ruleset4 = await head1($ctx, [await filter1($ctx, [
              $ctx.module("ctx")["rulesets"]($ctx),
              $ctx.krl.Function(["r"], async function (r5) {
                return await $stdlib["=="]($ctx, [
                  await get1($ctx, [
                    r5,
                    "rid"
                  ]),
                  engine_ui_rid3
                ]);
              })
            ])]);
          return {
            "url": await get1($ctx, [
              the_ruleset4,
              "url"
            ]),
            "config": await get1($ctx, [
              the_ruleset4,
              "config"
            ])
          };
        });
        const subscription_ruleset_url3 = $ctx.krl.Function([], async function () {
          const subscription_rid4 = "io.picolabs.subscription";
          const parts4 = await split1($ctx, [
            $ctx.module("ctx")["rid_url"]($ctx),
            "/"
          ]);
          return await join1($ctx, [
            await splice1($ctx, [
              parts4,
              await $stdlib["-"]($ctx, [
                await $length$1($ctx, [parts4]),
                1
              ]),
              1,
              await $stdlib["+"]($ctx, [
                subscription_rid4,
                ".krl"
              ])
            ]),
            "/"
          ]);
        });
        const subs_url3 = await klog1($ctx, [
          await $ctx.krl.assertFunction(subscription_ruleset_url3)($ctx, []),
          "subs_url"
        ]);
        var $fired = true;
        if ($fired) {
          var newEci3 = await $ctx.krl.assertAction($ctx.module("ctx")["newPico"])($ctx, {
            "rulesets": [
              await engine_ui_ruleset3($ctx, []),
              {
                "url": $ctx.module("ctx")["rid_url"]($ctx),
                "config": {}
              }
            ]
          });
          await $ctx.krl.assertAction($ctx.module("ctx")["event"])($ctx, {
            "eci": newEci3,
            "domain": "wrangler",
            "name": "install_ruleset_request",
            "attrs": { "url": subs_url3 }
          });
          var newUiECI3 = await $ctx.krl.assertAction($ctx.module("ctx")["eventQuery"])($ctx, {
            "eci": newEci3,
            "domain": "engine_ui",
            "name": "setup",
            "rid": engine_ui_rid3,
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
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "new_child_created", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            { "eci": newEci3 }
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "child_creation_failure", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:child_creation_failure"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("createChild_failure");
        $ctx.log.debug("rule selected", { "rule_name": "createChild_failure" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "Pico_Not_Created",
            {}
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "info",
          "data": "Failed to create pico",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "createChild_failure",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:child_created"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("initialize_child_after_creation");
        $ctx.log.debug("rule selected", { "rule_name": "initialize_child_after_creation" });
        const rids_to_install3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["rids_to_install"]);
        const rids_to_install_from_url3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["rids_from_url"]);
        var $fired = await $stdlib[">"]($ctx, [
          await $length$1($ctx, [rids_to_install3]),
          0
        ]) || await $stdlib[">"]($ctx, [
          await $length$1($ctx, [rids_to_install_from_url3]),
          0
        ]);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "install_rulesets_requested", await put1($ctx, [
            await put1($ctx, [
              await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "init",
                true
              ]),
              ["rids"],
              rids_to_install3
            ]),
            ["urls"],
            rids_to_install_from_url3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "finish_initialization", $ctx.module("event")["attrs"]($ctx));
        }
        await $ctx.rsCtx.putEnt("parent_eci", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["parent_eci"]));
        await $ctx.rsCtx.putEnt("name", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"]));
        await $ctx.rsCtx.putEnt("id", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["id"]));
        await $ctx.rsCtx.putEnt("eci", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["eci"]));
        await $ctx.rsCtx.putEnt("wrangler_children", {});
        await $ctx.rsCtx.putEnt("default_timeout", { "minutes": 5 });
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:finish_initialization"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("finish_child_initialization");
        $ctx.log.debug("rule selected", { "rule_name": "finish_child_initialization" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
              "eci": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["parent_eci"]),
              "domain": "wrangler",
              "type": "child_initialized",
              "attrs": $ctx.module("event")["attrs"]($ctx)
            }]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("visual", "update", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "dname",
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"])
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:root_created"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("pico_root_created");
        $ctx.log.debug("rule selected", { "rule_name": "pico_root_created" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("id", $ctx.module("meta")["picoId"]($ctx));
        await $ctx.rsCtx.putEnt("eci", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["eci"]));
        await $ctx.rsCtx.putEnt("wrangler_children", {});
        await $ctx.rsCtx.putEnt("name", "Root Pico");
        await $ctx.rsCtx.raiseEvent("wrangler", "install_rulesets_requested", { "rid": "io.picolabs.subscription" });
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:child_deletion_request", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.+)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "eci") ? $stdlib.as($ctx, [
        $event.data.attrs["eci"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var eci3 = setting["eci"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("deleteOneChild");
        $ctx.log.debug("rule selected", { "rule_name": "deleteOneChild" });
        var eci3 = $state.setting["eci"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delPico"])($ctx, [eci3]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "child_deleted", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("wrangler:child_deletion"), $ctx.krl.SelectWhen.e("wrangler:delete_children")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("deleteChild");
        $ctx.log.debug("rule selected", { "rule_name": "deleteChild" });
        const picoIDMap3 = await filter1($ctx, [
          await getPicosToDelete2($ctx, [$ctx.module("event")["attrs"]($ctx)]),
          $ctx.krl.Function([
            "pico",
            "id"
          ], async function (pico4, id4) {
            return !await $stdlib["get"]($ctx, [
              pico4,
              "rogue"
            ]);
          })
        ]);
        const picoIDArray3 = await keys1($ctx, [picoIDMap3]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "pico_ids_to_delete",
            { "ids": picoIDArray3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("children_being_deleted", await put1($ctx, [
          await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("children_being_deleted"),
            {}
          ]),
          picoIDMap3
        ]));
        await $ctx.rsCtx.raiseEvent("wrangler", "send_intent_to_delete", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          { "picoIDArray": picoIDArray3 }
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:send_intent_to_delete"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["picoIDArray"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let picoID3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("send_intent_to_delete");
          $ctx.log.debug("rule selected", { "rule_name": "send_intent_to_delete" });
          const picoEci3 = await $stdlib.get($ctx, [
            await $ctx.rsCtx.getEnt("wrangler_children"),
            [
              picoID3,
              "eci"
            ]
          ]);
          const attrsToSend3 = await $delete$1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "picoIDArray"
          ]);
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
                "eci": picoEci3,
                "domain": "wrangler",
                "type": "intent_to_delete_pico",
                "attrs": attrsToSend3
              }]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          await $ctx.rsCtx.putEnt("wrangler_children", await $stdlib.delete($ctx, [
            await $ctx.rsCtx.getEnt("wrangler_children"),
            picoID3
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:child_ready_for_deletion"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("delete_child");
        $ctx.log.debug("rule selected", { "rule_name": "delete_child" });
        const picoID3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["id"]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("engine")["removePico"])($ctx, [picoID3]);
          await deleteChannel2($ctx, [await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["parent_eci"])]);
          await send_directive1($ctx, [
            "pico_deleted",
            { "pico": picoID3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("children_being_deleted", await $stdlib.delete($ctx, [
          await $ctx.rsCtx.getEnt("children_being_deleted"),
          picoID3
        ]));
        await $ctx.rsCtx.raiseEvent("wrangler", "child_deleted", $ctx.module("event")["attrs"]($ctx));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("wrangler:child_sync"), $ctx.krl.SelectWhen.e("wrangler:force_child_deletion")), $ctx.krl.SelectWhen.e("wrangler:force_children_deletion")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("syncChildren");
        $ctx.log.debug("rule selected", { "rule_name": "syncChildren" });
        const wranglerChildren3 = await keys1($ctx, [await $ctx.rsCtx.getEnt("wrangler_children")]);
        const engineChildren3 = await $ctx.krl.assertFunction($ctx.module("engine")["listChildren"])($ctx, []);
        const ghostChildren3 = await difference1($ctx, [
          engineChildren3,
          wranglerChildren3
        ]);
        const ghostChildrenMap3 = await getChildMapFromIDs2($ctx, [ghostChildren3]);
        const extraChildren3 = await difference1($ctx, [
          wranglerChildren3,
          engineChildren3
        ]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("wrangler_children", await filter1($ctx, [
          await $ctx.rsCtx.getEnt("wrangler_children"),
          $ctx.krl.Function([
            "v",
            "picoID"
          ], async function (v4, picoID4) {
            return !await $stdlib["><"]($ctx, [
              picoID4,
              extraChildren3
            ]);
          })
        ]));
        await $ctx.rsCtx.putEnt("wrangler_children", await put1($ctx, [
          await $ctx.rsCtx.getEnt("wrangler_children"),
          ghostChildrenMap3
        ]));
        if (await $stdlib[">"]($ctx, [
            await $length$1($ctx, [await keys1($ctx, [ghostChildrenMap3])]),
            0
          ]))
          await $ctx.rsCtx.raiseEvent("wrangler", "ghost_children_added", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "found_children",
            ghostChildrenMap3
          ]));
        if (await $stdlib[">"]($ctx, [
            await $length$1($ctx, [extraChildren3]),
            0
          ]))
          await $ctx.rsCtx.raiseEvent("wrangler", "nonexistent_children_removed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "removed_children",
            extraChildren3
          ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("wrangler:force_child_deletion"), $ctx.krl.SelectWhen.e("wrangler:force_children_deletion")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("forceChildrenDeletion");
        $ctx.log.debug("rule selected", { "rule_name": "forceChildrenDeletion" });
        const picoIDArray3 = await keys1($ctx, [await getPicosToDelete2($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            true
          ])]);
        const picoSubtreeArrays3 = await map1($ctx, [
          picoIDArray3,
          $ctx.krl.Function(["picoID"], async function (picoID4) {
            return await gatherDescendants2($ctx, [picoID4]);
          })
        ]);
        const flatArray3 = await append1($ctx, [
          await reduce1($ctx, [
            picoSubtreeArrays3,
            $ctx.krl.Function([
              "id_array_a",
              "id_array_b"
            ], async function (id_array_a4, id_array_b4) {
              return await append1($ctx, [
                id_array_a4,
                id_array_b4
              ]);
            }),
            []
          ]),
          picoIDArray3
        ]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "pico_ids_to_force_delete",
            { "pico_ids": flatArray3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "picos_to_force_delete_ready", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "picoIDArray",
          flatArray3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:picos_to_force_delete_ready"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["picoIDArray"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let picoID3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("delete_each_pico_id");
          $ctx.log.debug("rule selected", { "rule_name": "delete_each_pico_id" });
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction($ctx.module("engine")["removePico"])($ctx, [picoID3]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          await $ctx.rsCtx.putEnt("wrangler_children", await $stdlib.delete($ctx, [
            await $ctx.rsCtx.getEnt("wrangler_children"),
            picoID3
          ]));
          await $ctx.rsCtx.putEnt("children_being_deleted", await $stdlib.delete($ctx, [
            await $ctx.rsCtx.getEnt("children_being_deleted"),
            picoID3
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "pico_forcibly_removed", await put1($ctx, [
            await $delete$1($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "picoIDArray"
            ]),
            "id",
            picoID3
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:intent_to_delete_pico"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("parent_requested_deletion");
        $ctx.log.debug("rule selected", { "rule_name": "parent_requested_deletion" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("marked_for_death", true);
        await $ctx.rsCtx.raiseEvent("visual", "update", await put1($ctx, [
          await put1($ctx, [
            {},
            "dname",
            "Deleting"
          ]),
          "color",
          "#000000"
        ]));
        await $ctx.rsCtx.raiseEvent("wrangler", "delete_children", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "delete_all",
          true
        ]));
        await $ctx.rsCtx.raiseEvent("wrangler", "rulesets_need_to_cleanup", $ctx.module("event")["attrs"]($ctx));
        var scheduled_timeout3 = await $ctx.module("schedule")["at"]($ctx, {
          "eci": $event.eci,
          "attrs": $ctx.module("event")["attrs"]($ctx),
          "domain": "wrangler",
          "name": "pico_cleanup_timed_out",
          "time": await $ctx.krl.assertFunction($ctx.module("time")["add"])($ctx, [
            await $ctx.krl.assertFunction($ctx.module("time")["now"])($ctx, []),
            await defaultsTo1($ctx, [
              await $ctx.rsCtx.getEnt("default_timeout"),
              { "minutes": 5 }
            ])
          ])
        });
        await $ctx.rsCtx.putEnt("scheduled_timeout_event", scheduled_timeout3);
        await $ctx.rsCtx.putEnt("saved_attrs", $ctx.module("event")["attrs"]($ctx));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:set_timeout_before_pico_deleted"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("setDeletionTimeoutPeriod");
        $ctx.log.debug("rule selected", { "rule_name": "setDeletionTimeoutPeriod" });
        const new_timeout_obj3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["new_timeout"]);
        var $fired = await $ctx.krl.assertFunction($ctx.module("time")["add"])($ctx, [
          await $ctx.krl.assertFunction($ctx.module("time")["now"])($ctx, []),
          new_timeout_obj3
        ]);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("default_timeout", new_timeout_obj3);
          await $ctx.rsCtx.raiseEvent("wrangler", "timeout_before_pico_deleted_changed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "new_timeout",
            new_timeout_obj3
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:ruleset_needs_cleanup_period"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("registerForCleanup");
        $ctx.log.debug("rule selected", { "rule_name": "registerForCleanup" });
        const domain3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["domain"]);
        var $fired = domain3 && !await $ctx.rsCtx.getEnt("marked_for_death");
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("registered_for_cleanup", await append1($ctx, [
            await defaultsTo1($ctx, [
              await $ctx.rsCtx.getEnt("registered_for_cleanup"),
              []
            ]),
            domain3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "cleanup_domain_registration_failure", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "error",
            "Failed to register domain for cleanup guarantee"
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:cleanup_finished"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cleanupFinished");
        $ctx.log.debug("rule selected", { "rule_name": "cleanupFinished" });
        const domain3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["domain"]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("registered_for_cleanup", await filter1($ctx, [
          await $ctx.rsCtx.getEnt("registered_for_cleanup"),
          $ctx.krl.Function(["registeredDomain"], async function (registeredDomain4) {
            return await $stdlib["!="]($ctx, [
              registeredDomain4,
              domain3
            ]);
          })
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:pico_cleanup_timed_out"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cleanup_timed_out");
        $ctx.log.debug("rule selected", { "rule_name": "cleanup_timed_out" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "force_children_deletion", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          { "delete_all": true }
        ]));
        await $ctx.rsCtx.putEnt("registered_for_cleanup", []);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("wrangler:intent_to_delete_pico"), $ctx.krl.SelectWhen.e("wrangler:cleanup_finished")), $ctx.krl.SelectWhen.e("wrangler:child_ready_for_deletion")), $ctx.krl.SelectWhen.e("wrangler:delete_this_pico_if_ready")), $ctx.krl.SelectWhen.e("wrangler:pico_cleanup_timed_out")), $ctx.krl.SelectWhen.e("wrangler:pico_forcibly_removed")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("is_pico_ready_to_delete");
        $ctx.log.debug("rule selected", { "rule_name": "is_pico_ready_to_delete" });
        const ready_to_delete3 = await $ctx.rsCtx.getEnt("marked_for_death") && await $stdlib["=="]($ctx, [
          await $length$1($ctx, [await defaultsTo1($ctx, [
              await $ctx.rsCtx.getEnt("children_being_deleted"),
              []
            ])]),
          0
        ]) && await $stdlib["=="]($ctx, [
          await $length$1($ctx, [await defaultsTo1($ctx, [
              await $ctx.rsCtx.getEnt("registered_for_cleanup"),
              []
            ])]),
          0
        ]);
        var $fired = ready_to_delete3;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("schedule")["remove"])($ctx, [await $ctx.rsCtx.getEnt("scheduled_timeout_event")]);
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
              "eci": await parent_eci2($ctx, []),
              "domain": "wrangler",
              "type": "child_ready_for_deletion",
              "attrs": await put1($ctx, [
                await put1($ctx, [
                  $ctx.module("event")["attrs"]($ctx),
                  await defaultsTo1($ctx, [
                    await $ctx.rsCtx.getEnt("saved_attrs"),
                    {}
                  ])
                ]),
                await getPicoMap2($ctx, [])
              ])
            }]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
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
        "skyQuery": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return skyQuery2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "channels": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return channels2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "rulesetsInfo": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return rulesetsInfo2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "installedRulesets": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return installedRulesets2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "registeredRulesets": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return registeredRulesets2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "channel": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return channel2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "alwaysEci": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return alwaysEci2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "nameFromEci": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return nameFromEci2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "children": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return children2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "parent_eci": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return parent_eci2($ctx, query.args);
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
        "profile": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return profile2($ctx, query.args);
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
        "randomPicoName": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return randomPicoName2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "myself": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return myself2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "id": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return id2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "MAX_RAND_ENGL_NAMES": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return MAX_RAND_ENGL_NAMES2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "isMarkedForDeath": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return isMarkedForDeath2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getPicoMap": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getPicoMap2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "timeForCleanup": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return timeForCleanup2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing2;
        }
      },
      "provides": {
        "skyQuery": skyQuery2,
        "channels": channels2,
        "rulesetsInfo": rulesetsInfo2,
        "installedRulesets": installedRulesets2,
        "installRulesets": installRulesets2,
        "uninstallRulesets": uninstallRulesets2,
        "registeredRulesets": registeredRulesets2,
        "channel": channel2,
        "alwaysEci": alwaysEci2,
        "nameFromEci": nameFromEci2,
        "createChannel": createChannel2,
        "newPolicy": newPolicy2,
        "children": children2,
        "parent_eci": parent_eci2,
        "name": $name$2,
        "profile": profile2,
        "pico": pico2,
        "randomPicoName": randomPicoName2,
        "myself": myself2,
        "isMarkedForDeath": isMarkedForDeath2
      }
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
