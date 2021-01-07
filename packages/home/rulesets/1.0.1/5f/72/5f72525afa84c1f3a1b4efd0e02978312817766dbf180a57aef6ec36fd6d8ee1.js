module.exports = {
  "rid": "io.picolabs.wrangler",
  "meta": {
    "name": "Wrangler Core",
    "description": "\n      Wrangler Core Module,\n      use example: \"use module io.picolabs.wrangler alias wrangler\".\n      This Ruleset/Module provides a developer interface to the pico (persistent compute object).\n      When a pico is created this ruleset will be installed to provide essential services.\n    ",
    "author": "BYU Pico Lab",
    "provides": [
      "skyQuery",
      "channels",
      "createChannel",
      "deleteChannel",
      "rulesetConfig",
      "rulesetMeta",
      "installedRIDs",
      "children",
      "parent_eci",
      "name",
      "myself"
    ],
    "shares": [
      "skyQuery",
      "channels",
      "rulesetConfig",
      "rulesetMeta",
      "installedRIDs",
      "children",
      "parent_eci",
      "name",
      "myself",
      "id"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const decode1 = $stdlib["decode"];
    const $typeof$1 = $stdlib["typeof"];
    const isnull1 = $stdlib["isnull"];
    const put1 = $stdlib["put"];
    const klog1 = $stdlib["klog"];
    const any1 = $stdlib["any"];
    const head1 = $stdlib["head"];
    const filter1 = $stdlib["filter"];
    const map1 = $stdlib["map"];
    const join1 = $stdlib["join"];
    const sort1 = $stdlib["sort"];
    const split1 = $stdlib["split"];
    const lc1 = $stdlib["lc"];
    const splice1 = $stdlib["splice"];
    const $length$1 = $stdlib["length"];
    const $delete$1 = $stdlib["delete"];
    const get1 = $stdlib["get"];
    const noop1 = $stdlib["noop"];
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
          "args": ["tags"]
        },
        {
          "name": "rulesetConfig",
          "args": ["rid"]
        },
        {
          "name": "rulesetMeta",
          "args": ["rid"]
        },
        {
          "name": "installedRIDs",
          "args": []
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
          "name": "myself",
          "args": []
        },
        {
          "name": "id",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "system",
          "name": "online",
          "attrs": []
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
          "name": "uninstall_ruleset_request",
          "attrs": ["rid"]
        },
        {
          "domain": "wrangler",
          "name": "new_channel_request",
          "attrs": [
            "tags",
            "eventPolicy",
            "queryPolicy"
          ]
        },
        {
          "domain": "wrangler",
          "name": "channel_deletion_request",
          "attrs": ["eci"]
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
          "name": "pico_created",
          "attrs": ["name"]
        },
        {
          "domain": "wrangler",
          "name": "pico_initialized",
          "attrs": []
        },
        {
          "domain": "engine_ui",
          "name": "setup",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "child_deletion_request",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "ready_for_deletion",
          "attrs": []
        }
      ]
    };
    const __testing2 = {
      "queries": [
        { "name": "name" },
        { "name": "myself" },
        {
          "name": "channels",
          "args": ["tags"]
        },
        { "name": "installedRIDs" },
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
          "name": "child_deletion_request",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "new_channel_request",
          "attrs": [
            "tags",
            "eventPolicy",
            "queryPolicy"
          ]
        },
        {
          "domain": "wrangler",
          "name": "channel_deletion_request",
          "attrs": ["eci"]
        },
        {
          "domain": "wrangler",
          "name": "install_ruleset_request",
          "attrs": ["url"]
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
          "name": "uninstall_ruleset_request",
          "attrs": ["rid"]
        }
      ]
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
      ]) && !is_bad_response3 ? response_content3 : await klog1($ctx, [
        error3,
        "error: "
      ]);
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
      const thisPico3 = await any1($ctx, [
        $ctx.module("ctx")["channels"]($ctx),
        $ctx.krl.Function(["c"], async function (c4) {
          return await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              c4,
              "id"
            ]),
            eci3
          ]);
        })
      ]);
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
    const rulesetByRID2 = $ctx.krl.Function(["rid"], async function (rid3) {
      return await head1($ctx, [await filter1($ctx, [
          $ctx.module("ctx")["rulesets"]($ctx),
          $ctx.krl.Function(["rs"], async function (rs4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                rs4,
                "rid"
              ]),
              rid3
            ]);
          })
        ])]);
    });
    const rulesetConfig2 = $ctx.krl.Function(["rid"], async function (rid3) {
      return await $stdlib["get"]($ctx, [
        await rulesetByRID2($ctx, [rid3]),
        "config"
      ]);
    });
    const rulesetMeta2 = $ctx.krl.Function(["rid"], async function (rid3) {
      return await $stdlib["get"]($ctx, [
        await rulesetByRID2($ctx, [rid3]),
        [
          "meta",
          "krlMeta"
        ]
      ]);
    });
    const installedRIDs2 = $ctx.krl.Function([], async function () {
      return await map1($ctx, [
        $ctx.module("ctx")["rulesets"]($ctx),
        $ctx.krl.Function(["rs"], async function (rs4) {
          return await $stdlib["get"]($ctx, [
            rs4,
            "rid"
          ]);
        })
      ]);
    });
    const channels2 = $ctx.krl.Function(["tags"], async function (tags3) {
      const all_channels3 = $ctx.module("ctx")["channels"]($ctx);
      const str_tags3 = await $stdlib["=="]($ctx, [
        await $typeof$1($ctx, [tags3]),
        "Array"
      ]) ? await join1($ctx, [
        tags3,
        ","
      ]) : tags3;
      const cf_tags3 = tags3 ? await join1($ctx, [
        await sort1($ctx, [await split1($ctx, [
            await lc1($ctx, [str_tags3]),
            ","
          ])]),
        ","
      ]) : void 0;
      return await isnull1($ctx, [cf_tags3]) ? all_channels3 : await filter1($ctx, [
        all_channels3,
        $ctx.krl.Function(["c"], async function (c4) {
          return await $stdlib["=="]($ctx, [
            await join1($ctx, [
              await sort1($ctx, [await $stdlib["get"]($ctx, [
                  c4,
                  "tags"
                ])]),
              ","
            ]),
            cf_tags3
          ]);
        })
      ]);
    });
    const deleteChannel2 = $ctx.krl.Action(["eci"], async function (eci3) {
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("ctx")["delChannel"])(this, [eci3]);
      }
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
    const myself2 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("name"),
        "id": await $ctx.rsCtx.getEnt("id"),
        "eci": await $ctx.rsCtx.getEnt("eci")
      };
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
              $ctx.module("ctx")["rid"]($ctx),
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
    const parent_eci2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("parent_eci");
    });
    const $name$2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("name");
    });
    const id2 = $ctx.krl.Function([], async function () {
      return $ctx.module("meta")["picoId"]($ctx);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
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
    $rs.when($ctx.krl.SelectWhen.e("wrangler:uninstall_ruleset_request", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(.+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "rid") ? $stdlib.as($ctx, [
        $event.data.attrs["rid"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var rid3 = setting["rid"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("uninstall_one_ruleset");
        $ctx.log.debug("rule selected", { "rule_name": "uninstall_one_ruleset" });
        var rid3 = $state.setting["rid"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["uninstall"])($ctx, [rid3]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_uninstalled", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:new_channel_request"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("createChannel");
        $ctx.log.debug("rule selected", { "rule_name": "createChannel" });
        const tags3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "tags"
        ]);
        const eventPolicy3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "eventPolicy"
        ]);
        const queryPolicy3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "queryPolicy"
        ]);
        var $fired = tags3 && eventPolicy3 && queryPolicy3;
        if ($fired) {
          var channel3 = await createChannel2($ctx, [
            tags3,
            eventPolicy3,
            queryPolicy3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "channel_created", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            { "channel": channel3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:channel_deletion_request", async function ($event, $state) {
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
        $ctx.setCurrentRuleName("deleteChannel");
        $ctx.log.debug("rule selected", { "rule_name": "deleteChannel" });
        var eci3 = $state.setting["eci"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await deleteChannel2($ctx, [eci3]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "channel_deleted", $ctx.module("event")["attrs"]($ctx));
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
          var newUiECI3 = await $ctx.krl.assertAction($ctx.module("ctx")["eventQuery"])($ctx, {
            "eci": newEci3,
            "domain": "engine_ui",
            "name": "setup",
            "rid": engine_ui_rid3,
            "queryName": "uiECI"
          });
          await $ctx.krl.assertAction($ctx.module("ctx")["event"])($ctx, {
            "eci": newEci3,
            "domain": "wrangler",
            "name": "pico_created",
            "attrs": { "name": $name$3 }
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
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:pico_created"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("initialize_child_after_creation");
        $ctx.log.debug("rule selected", { "rule_name": "initialize_child_after_creation" });
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
        const subs_url3 = await $ctx.krl.assertFunction(subscription_ruleset_url3)($ctx, []);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "install_ruleset_request", { "url": subs_url3 });
          await $ctx.rsCtx.putEnt("parent_eci", $ctx.module("ctx")["parent"]($ctx));
          await $ctx.rsCtx.putEnt("name", await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"]));
          await $ctx.rsCtx.putEnt("id", $ctx.module("ctx")["picoId"]($ctx));
          await $ctx.rsCtx.putEnt("eci", $ctx.module("event")["eci"]($ctx));
          await $ctx.rsCtx.raiseEvent("wrangler", "pico_initialized", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:pico_initialized"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("finish_child_initialization");
        $ctx.log.debug("rule selected", { "rule_name": "finish_child_initialization" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
              "eci": await $ctx.rsCtx.getEnt("parent_eci"),
              "domain": "wrangler",
              "type": "child_initialized",
              "attrs": $ctx.module("event")["attrs"]($ctx)
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
    $rs.when($ctx.krl.SelectWhen.e("engine_ui:setup"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("pico_root_created");
        $ctx.log.debug("rule selected", { "rule_name": "pico_root_created" });
        var $fired = await isnull1($ctx, [await $ctx.rsCtx.getEnt("id")]) && await isnull1($ctx, [await $ctx.rsCtx.getEnt("parent_eci")]);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("id", $ctx.module("ctx")["picoId"]($ctx));
          await $ctx.rsCtx.putEnt("eci", await $stdlib["get"]($ctx, [
            await head1($ctx, [await channels2($ctx, ["system,self"])]),
            "id"
          ]));
          await $ctx.rsCtx.putEnt("name", "Pico");
        }
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
    $rs.when($ctx.krl.SelectWhen.e("wrangler:ready_for_deletion"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("child_initiates_deletion");
        $ctx.log.debug("rule selected", { "rule_name": "child_initiates_deletion" });
        const my_eci3 = await get1($ctx, [
          await head1($ctx, [await channels2($ctx, ["system,child"])]),
          "id"
        ]);
        var $fired = my_eci3;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [{
              "eci": await $ctx.rsCtx.getEnt("parent_eci"),
              "domain": "wrangler",
              "type": "child_deletion_request",
              "attrs": { "eci": my_eci3 }
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
        "skyQuery": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await skyQuery2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "channels": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await channels2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "rulesetConfig": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await rulesetConfig2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "rulesetMeta": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await rulesetMeta2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "installedRIDs": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await installedRIDs2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "children": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await children2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "parent_eci": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await parent_eci2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "name": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await $name$2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "myself": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await myself2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "id": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await id2($ctx, query.args);
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
        "createChannel": createChannel2,
        "deleteChannel": deleteChannel2,
        "rulesetConfig": rulesetConfig2,
        "rulesetMeta": rulesetMeta2,
        "installedRIDs": installedRIDs2,
        "children": children2,
        "parent_eci": parent_eci2,
        "name": $name$2,
        "myself": myself2
      }
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
