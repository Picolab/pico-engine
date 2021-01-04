module.exports = {
  "rid": "io.picolabs.subscription",
  "meta": {
    "name": "subscription ",
    "description": "\n      Tx/Rx ruleset.\n    ",
    "author": "Tedrub Modulus",
    "use": [{
        "kind": "module",
        "rid": "io.picolabs.wrangler",
        "alias": "wrangler"
      }],
    "provides": [
      "established",
      "outbound",
      "inbound",
      "wellKnown_Rx",
      "autoAcceptConfig"
    ],
    "shares": [
      "established",
      "outbound",
      "inbound",
      "wellKnown_Rx",
      "autoAcceptConfig"
    ],
    "logging": true
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const put1 = $stdlib["put"];
    const map1 = $stdlib["map"];
    const get1 = $stdlib["get"];
    const $delete$1 = $stdlib["delete"];
    const defaultsTo1 = $stdlib["defaultsTo"];
    const isnull1 = $stdlib["isnull"];
    const $length$1 = $stdlib["length"];
    const filter1 = $stdlib["filter"];
    const join1 = $stdlib["join"];
    const sort1 = $stdlib["sort"];
    const lc1 = $stdlib["lc"];
    const head1 = $stdlib["head"];
    const index1 = $stdlib["index"];
    const any1 = $stdlib["any"];
    const values1 = $stdlib["values"];
    const klog1 = $stdlib["klog"];
    const match1 = $stdlib["match"];
    const as1 = $stdlib["as"];
    const noop1 = $stdlib["noop"];
    const append1 = $stdlib["append"];
    const splice1 = $stdlib["splice"];
    const decode1 = $stdlib["decode"];
    const __testing1 = {
      "queries": [
        {
          "name": "established",
          "args": [
            "key",
            "value"
          ]
        },
        {
          "name": "outbound",
          "args": [
            "key",
            "value"
          ]
        },
        {
          "name": "inbound",
          "args": [
            "key",
            "value"
          ]
        },
        {
          "name": "wellKnown_Rx",
          "args": []
        },
        {
          "name": "autoAcceptConfig",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "wrangler",
          "name": "ruleset_installed",
          "attrs": ["rids"]
        },
        {
          "domain": "wrangler",
          "name": "ruleset_added",
          "attrs": ["rids"]
        },
        {
          "domain": "wrangler",
          "name": "rulesets_need_to_cleanup",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "cancel_subscriptions",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "cancel_relationships",
          "attrs": ["establishedIDs"]
        },
        {
          "domain": "wrangler",
          "name": "cancel_relationships",
          "attrs": ["inboundIDs"]
        },
        {
          "domain": "wrangler",
          "name": "cancel_relationships",
          "attrs": ["outboundIDs"]
        },
        {
          "domain": "wrangler",
          "name": "subscription_removed",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "outbound_subscription_cancelled",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "inbound_subscription_cancelled",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "cancel_relationships",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "subscription",
          "attrs": [
            "name",
            "channel_type",
            "wellKnown_Tx"
          ]
        },
        {
          "domain": "wrangler",
          "name": "subscription_request_needed",
          "attrs": [
            "Rx_host",
            "wellKnown_Tx",
            "Tx_role",
            "Rx_role",
            "Rx",
            "Tx_host"
          ]
        },
        {
          "domain": "wrangler",
          "name": "new_subscription_request",
          "attrs": [
            "Tx",
            "channel_name",
            "channel_type"
          ]
        },
        {
          "domain": "wrangler",
          "name": "pending_subscription_approval",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "outbound_pending_subscription_approved",
          "attrs": ["Tx"]
        },
        {
          "domain": "wrangler",
          "name": "inbound_pending_subscription_approved",
          "attrs": [
            "Id",
            "bus"
          ]
        },
        {
          "domain": "wrangler",
          "name": "subscription_cancellation",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "established_removal",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "inbound_rejection",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "inbound_removal",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "outbound_cancellation",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "outbound_removal",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "send_event_on_subs",
          "attrs": [
            "subID",
            "Tx_role",
            "Rx_role",
            "domain",
            "type"
          ]
        },
        {
          "domain": "wrangler",
          "name": "send_event_to_subs",
          "attrs": [
            "domain",
            "type",
            "attrs",
            "subs"
          ]
        },
        {
          "domain": "wrangler",
          "name": "inbound_pending_subscription_added",
          "attrs": []
        },
        {
          "domain": "wrangler",
          "name": "autoAcceptConfigUpdate",
          "attrs": [
            "config",
            "configName",
            "password",
            "regexMap",
            "delete"
          ]
        }
      ]
    };
    await $ctx.useModule("io.picolabs.wrangler", "wrangler");
    const __testing2 = await put1($ctx, [
      await put1($ctx, [
        __testing1,
        "queries",
        await map1($ctx, [
          await get1($ctx, [
            __testing1,
            "queries"
          ]),
          $ctx.krl.Function(["q"], async function (q3) {
            return await $delete$1($ctx, [
              q3,
              "args"
            ]);
          })
        ])
      ]),
      "events",
      [
        {
          "domain": "wrangler",
          "name": "subscription",
          "attrs": [
            "wellKnown_Tx",
            "Rx_role",
            "Tx_role",
            "name",
            "channel_type",
            "Tx_host",
            "password"
          ]
        },
        {
          "domain": "wrangler",
          "name": "subscription",
          "attrs": [
            "wellKnown_Tx",
            "Rx_role",
            "Tx_role",
            "name",
            "channel_type",
            "password"
          ]
        },
        {
          "domain": "wrangler",
          "name": "subscription",
          "attrs": [
            "wellKnown_Tx",
            "password"
          ]
        },
        {
          "domain": "wrangler",
          "name": "subscription",
          "attrs": ["wellKnown_Tx"]
        },
        {
          "domain": "wrangler",
          "name": "pending_subscription_approval",
          "attrs": ["Id"]
        },
        {
          "domain": "wrangler",
          "name": "subscription_cancellation",
          "attrs": ["Id"]
        },
        {
          "domain": "wrangler",
          "name": "inbound_rejection",
          "attrs": ["Id"]
        },
        {
          "domain": "wrangler",
          "name": "outbound_cancellation",
          "attrs": ["Id"]
        },
        {
          "domain": "wrangler",
          "name": "autoAcceptConfigUpdate",
          "attrs": [
            "configName",
            "password",
            "regexMap",
            "delete"
          ]
        }
      ]
    ]);
    const allow_all_eventPolicy2 = {
      "allow": [{
          "domain": "*",
          "name": "*"
        }],
      "deny": []
    };
    const allow_all_queryPolicy2 = {
      "allow": [{
          "rid": "*",
          "name": "*"
        }],
      "deny": []
    };
    const wellKnown_eventPolicy2 = {
      "allow": [
        {
          "domain": "wrangler",
          "name": "subscription"
        },
        {
          "domain": "wrangler",
          "name": "new_subscription_request"
        },
        {
          "domain": "wrangler",
          "name": "inbound_removal"
        }
      ],
      "deny": []
    };
    const wellKnown_queryPolicy2 = {
      "allow": [{
          "rid": $ctx.module("ctx")["rid"]($ctx),
          "name": "wellKnown_Rx"
        }],
      "deny": []
    };
    const autoAcceptConfig2 = $ctx.krl.Function([], async function () {
      return await defaultsTo1($ctx, [
        await $ctx.rsCtx.getEnt("autoAcceptConfig"),
        {}
      ]);
    });
    const configMatchesPassword2 = $ctx.krl.Function([
      "config",
      "entryName",
      "hashedPassword"
    ], async function (config3, entryName3, hashedPassword3) {
      const doesntExist3 = await isnull1($ctx, [await $stdlib["get"]($ctx, [
          config3,
          [entryName3]
        ])]);
      const passwordMatched3 = await $stdlib["=="]($ctx, [
        await $stdlib["get"]($ctx, [
          config3,
          [
            entryName3,
            "password"
          ]
        ]),
        hashedPassword3
      ]);
      return doesntExist3 || passwordMatched3;
    });
    const established2 = $ctx.krl.Function([
      "key",
      "value"
    ], async function (key3, value3) {
      return await $ctx.krl.assertFunction(filterOn2)($ctx, [
        await $ctx.rsCtx.getEnt("established"),
        key3,
        value3
      ]);
    });
    const outbound2 = $ctx.krl.Function([
      "key",
      "value"
    ], async function (key3, value3) {
      return await $ctx.krl.assertFunction(filterOn2)($ctx, [
        await $ctx.rsCtx.getEnt("outbound"),
        key3,
        value3
      ]);
    });
    const inbound2 = $ctx.krl.Function([
      "key",
      "value"
    ], async function (key3, value3) {
      return await $ctx.krl.assertFunction(filterOn2)($ctx, [
        await $ctx.rsCtx.getEnt("inbound"),
        key3,
        value3
      ]);
    });
    const hasRelationships2 = $ctx.krl.Function([], async function () {
      return await $stdlib[">"]($ctx, [
        await $length$1($ctx, [await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("established"),
            []
          ])]),
        0
      ]) || await $stdlib[">"]($ctx, [
        await $length$1($ctx, [await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("inbound"),
            []
          ])]),
        0
      ]) || await $stdlib[">"]($ctx, [
        await $length$1($ctx, [await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("outbound"),
            []
          ])]),
        0
      ]);
    });
    const filterOn2 = $ctx.krl.Function([
      "array",
      "key",
      "value"
    ], async function (array3, key3, value3) {
      const defaultedArray3 = await defaultsTo1($ctx, [
        array3,
        []
      ]);
      return key3 && value3 ? await filter1($ctx, [
        defaultedArray3,
        $ctx.krl.Function(["bus"], async function (bus4) {
          return await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              bus4,
              key3
            ]),
            value3
          ]);
        })
      ]) : defaultedArray3;
    });
    const wellKnown_Rx2 = $ctx.krl.Function([], async function () {
      const tags3 = await join1($ctx, [
        await sort1($ctx, [await map1($ctx, [
            [
              "wellKnown_Rx",
              "Tx_Rx"
            ],
            $ctx.krl.Function(["t"], async function (t4) {
              return await lc1($ctx, [t4]);
            })
          ])]),
        ","
      ]);
      return await head1($ctx, [await filter1($ctx, [
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
              tags3
            ]);
          })
        ])]);
    });
    const indexOfId2 = $ctx.krl.Function([
      "buses",
      "Id"
    ], async function (buses3, Id3) {
      return await index1($ctx, [
        await map1($ctx, [
          buses3,
          $ctx.krl.Function(["bus"], async function (bus4) {
            return await $stdlib["get"]($ctx, [
              bus4,
              "Id"
            ]);
          })
        ]),
        Id3
      ]);
    });
    const findBus2 = $ctx.krl.Function(["buses"], async function (buses3) {
      return await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Id"]) ? await head1($ctx, [await filter1($ctx, [
          buses3,
          $ctx.krl.Function(["bus"], async function (bus4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                bus4,
                "Id"
              ]),
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Id"])
            ]);
          })
        ])]) : await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx"]) ? await head1($ctx, [await filter1($ctx, [
          buses3,
          $ctx.krl.Function(["bus"], async function (bus4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                bus4,
                "Rx"
              ]),
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx"])
            ]);
          })
        ])]) : await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx"]) ? await head1($ctx, [await filter1($ctx, [
          buses3,
          $ctx.krl.Function(["bus"], async function (bus4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                bus4,
                "Tx"
              ]),
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx"])
            ]);
          })
        ])]) : await head1($ctx, [await filter1($ctx, [
          buses3,
          $ctx.krl.Function(["bus"], async function (bus4) {
            return await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                bus4,
                "Rx"
              ]),
              $ctx.module("meta")["eci"]($ctx)
            ]);
          })
        ])]);
    });
    const pending_entry2 = $ctx.krl.Function([], async function () {
      const host3 = await $stdlib["=="]($ctx, [
        await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_host"]),
        $ctx.module("ctx")["host"]($ctx)
      ]) ? void 0 : await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_host"]);
      const roles3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_role"]) ? {
        "Rx_role": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_role"]),
        "Tx_role": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_role"])
      } : {};
      const _roles3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_host"]) ? await put1($ctx, [
        roles3,
        ["Tx_host"],
        host3
      ]) : roles3;
      return await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Id"]) ? await put1($ctx, [
        _roles3,
        ["Id"],
        await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Id"])
      ]) : await put1($ctx, [
        _roles3,
        ["Id"],
        await $ctx.krl.assertFunction($ctx.module("random")["uuid"])($ctx, [])
      ]);
    });
    const doesConfigMatch2 = $ctx.krl.Function(["config"], async function (config3) {
      return await any1($ctx, [
        await values1($ctx, [await klog1($ctx, [
            await map1($ctx, [
              await klog1($ctx, [
                await $stdlib["get"]($ctx, [
                  config3,
                  ["entries"]
                ]),
                "entries map"
              ]),
              $ctx.krl.Function([
                "regs",
                "k"
              ], async function (regs4, k4) {
                const $var$4 = await klog1($ctx, [
                  await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, [k4]),
                  await $stdlib["+"]($ctx, [
                    await $stdlib["+"]($ctx, [
                      "with event attr from ",
                      k4
                    ]),
                    "\\n"
                  ])
                ]);
                const matches4 = !await isnull1($ctx, [$var$4]) ? await any1($ctx, [
                  await map1($ctx, [
                    regs4,
                    $ctx.krl.Function(["regex_str"], async function (regex_str5) {
                      return await klog1($ctx, [
                        await match1($ctx, [
                          $var$4,
                          await klog1($ctx, [
                            await as1($ctx, [
                              regex_str5,
                              "RegExp"
                            ]),
                            "matching with "
                          ])
                        ]),
                        "function returned "
                      ]);
                    })
                  ]),
                  $ctx.krl.Function(["bool"], async function (bool5) {
                    return await $stdlib["=="]($ctx, [
                      bool5,
                      true
                    ]);
                  })
                ]) : false;
                return matches4;
              })
            ]),
            "resulting map"
          ])]),
        $ctx.krl.Function(["bool"], async function (bool4) {
          return bool4;
        })
      ]);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("wrangler:ruleset_installed", async function ($event, $state) {
      if (!await $stdlib["><"]($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["rids"]),
          $ctx.module("ctx")["rid"]($ctx)
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("create_wellKnown_Rx");
        $ctx.log.debug("rule selected", { "rule_name": "create_wellKnown_Rx" });
        const channel3 = await wellKnown_Rx2($ctx, []);
        var $fired = await isnull1($ctx, [channel3]);
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["newChannel"])($ctx, [
            [
              "wellKnown_Rx",
              "Tx_Rx"
            ],
            wellKnown_eventPolicy2,
            wellKnown_queryPolicy2
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "wellKnown_Rx_created", $ctx.module("event")["attrs"]($ctx));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "wellKnown_Rx_not_created", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:ruleset_added", async function ($event, $state) {
      if (!await $stdlib["><"]($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["rids"]),
          $ctx.module("meta")["rid"]($ctx)
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("register_for_cleanup");
        $ctx.log.debug("rule selected", { "rule_name": "register_for_cleanup" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "ruleset_needs_cleanup_period", { "domain": $ctx.module("meta")["rid"]($ctx) });
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:rulesets_need_to_cleanup"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cleanup_subscriptions");
        $ctx.log.debug("rule selected", { "rule_name": "cleanup_subscriptions" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "cancel_subscriptions", $ctx.module("event")["attrs"]($ctx));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:cancel_subscriptions"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cancel_all_subscriptions");
        $ctx.log.debug("rule selected", { "rule_name": "cancel_all_subscriptions" });
        const establishedSubIDs3 = await map1($ctx, [
          await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("established"),
            []
          ]),
          $ctx.krl.Function(["sub"], async function (sub4) {
            return await $stdlib["get"]($ctx, [
              sub4,
              "Id"
            ]);
          })
        ]);
        const inboundSubIDs3 = await map1($ctx, [
          await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("inbound"),
            []
          ]),
          $ctx.krl.Function(["inSub"], async function (inSub4) {
            return await $stdlib["get"]($ctx, [
              inSub4,
              "Id"
            ]);
          })
        ]);
        const outboundSubIDs3 = await map1($ctx, [
          await defaultsTo1($ctx, [
            await $ctx.rsCtx.getEnt("outbound"),
            []
          ]),
          $ctx.krl.Function(["outSub"], async function (outSub4) {
            return await $stdlib["get"]($ctx, [
              outSub4,
              "Id"
            ]);
          })
        ]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "cancel_relationships", await put1($ctx, [
          await put1($ctx, [
            await put1($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "establishedIDs",
              establishedSubIDs3
            ]),
            "inboundIDs",
            inboundSubIDs3
          ]),
          "outboundIDs",
          outboundSubIDs3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:cancel_relationships"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["establishedIDs"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let subID3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("cancel_established");
          $ctx.log.debug("rule selected", { "rule_name": "cancel_established" });
          var $fired = true;
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          await $ctx.rsCtx.raiseEvent("wrangler", "subscription_cancellation", await $delete$1($ctx, [
            await $delete$1($ctx, [
              await $delete$1($ctx, [
                await put1($ctx, [
                  $ctx.module("event")["attrs"]($ctx),
                  "Id",
                  subID3
                ]),
                "establishedIDs"
              ]),
              "inboundIDs"
            ]),
            "outboundIDs"
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:cancel_relationships"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["inboundIDs"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let subID3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("cancel_inbound");
          $ctx.log.debug("rule selected", { "rule_name": "cancel_inbound" });
          var $fired = true;
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          await $ctx.rsCtx.raiseEvent("wrangler", "inbound_rejection", await $delete$1($ctx, [
            await $delete$1($ctx, [
              await $delete$1($ctx, [
                await put1($ctx, [
                  $ctx.module("event")["attrs"]($ctx),
                  "Id",
                  subID3
                ]),
                "establishedIDs"
              ]),
              "inboundIDs"
            ]),
            "outboundIDs"
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:cancel_relationships"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["outboundIDs"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let subID3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("cancel_outbound");
          $ctx.log.debug("rule selected", { "rule_name": "cancel_outbound" });
          var $fired = true;
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          await $ctx.rsCtx.raiseEvent("wrangler", "outbound_cancellation", await $delete$1($ctx, [
            await $delete$1($ctx, [
              await $delete$1($ctx, [
                await put1($ctx, [
                  $ctx.module("event")["attrs"]($ctx),
                  "Id",
                  subID3
                ]),
                "establishedIDs"
              ]),
              "inboundIDs"
            ]),
            "outboundIDs"
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("wrangler:subscription_removed"), $ctx.krl.SelectWhen.e("wrangler:outbound_subscription_cancelled")), $ctx.krl.SelectWhen.e("wrangler:inbound_subscription_cancelled")), $ctx.krl.SelectWhen.e("wrangler:cancel_relationships")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("done_cleaning_up");
        $ctx.log.debug("rule selected", { "rule_name": "done_cleaning_up" });
        var $fired = await $ctx.krl.assertFunction($ctx.module("wrangler")["isMarkedForDeath"])($ctx, []) && !await hasRelationships2($ctx, []);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "cleanup_finished", { "domain": $ctx.module("meta")["rid"]($ctx) });
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:subscription"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("createRxBus");
        $ctx.log.debug("rule selected", { "rule_name": "createRxBus" });
        const channel_name3 = await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["name"]),
          await $ctx.krl.assertFunction($ctx.module("random")["word"])($ctx, [])
        ]);
        const channel_type3 = await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["channel_type"]),
          "Tx_Rx",
          "Tx_Rx channel_type used."
        ]);
        const pending_entry3 = await put1($ctx, [
          await pending_entry2($ctx, []),
          ["wellKnown_Tx"],
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["wellKnown_Tx"])
        ]);
        var $fired = await $stdlib["get"]($ctx, [
          pending_entry3,
          "wellKnown_Tx"
        ]);
        if ($fired) {
          var channel3 = await $ctx.krl.assertAction($ctx.module("ctx")["newChannel"])($ctx, [
            [
              channel_name3,
              channel_type3
            ],
            allow_all_eventPolicy2,
            allow_all_queryPolicy2
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          const newBus3 = await put1($ctx, [
            pending_entry3,
            {
              "Rx": await $stdlib["get"]($ctx, [
                channel3,
                "id"
              ])
            }
          ]);
          const fullNewBus3 = await put1($ctx, [
            newBus3,
            {
              "channel_name": channel_name3,
              "channel_type": channel_type3
            }
          ]);
          await $ctx.rsCtx.putEnt("outbound", await append1($ctx, [
            await outbound2($ctx, []),
            newBus3
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "subscription_request_needed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            fullNewBus3
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "outbound_pending_subscription_added", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            fullNewBus3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "wellKnown_Tx_format_failure", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:subscription_request_needed"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("requestSubscription");
        $ctx.log.debug("rule selected", { "rule_name": "requestSubscription" });
        const myHost3 = await $stdlib["=="]($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_host"]),
          "localhost"
        ]) ? void 0 : await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_host"]) ? await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_host"]) : $ctx.module("ctx")["host"]($ctx);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
            {
              "eci": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["wellKnown_Tx"]),
              "domain": "wrangler",
              "type": "new_subscription_request",
              "attrs": await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                {
                  "Rx_role": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_role"]),
                  "Tx_role": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_role"]),
                  "Tx": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx"]),
                  "Tx_host": myHost3
                }
              ])
            },
            await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_host"])
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
    $rs.when($ctx.krl.SelectWhen.e("wrangler:new_subscription_request"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("addInboundPendingSubscription");
        $ctx.log.debug("rule selected", { "rule_name": "addInboundPendingSubscription" });
        const pending_entry3 = await put1($ctx, [
          await pending_entry2($ctx, []),
          ["Tx"],
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx"])
        ]);
        var $fired = await $stdlib["get"]($ctx, [
          pending_entry3,
          "Tx"
        ]);
        if ($fired) {
          var channel3 = await $ctx.krl.assertAction($ctx.module("ctx")["newChannel"])($ctx, [
            [
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["channel_name"]),
              await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["channel_type"])
            ],
            allow_all_eventPolicy2,
            allow_all_queryPolicy2
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          const Rx3 = await $stdlib["get"]($ctx, [
            channel3,
            "id"
          ]);
          const newBus3 = await put1($ctx, [
            pending_entry3,
            { "Rx": Rx3 }
          ]);
          await $ctx.rsCtx.putEnt("inbound", await append1($ctx, [
            await inbound2($ctx, []),
            newBus3
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "inbound_pending_subscription_added", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["Rx"],
            Rx3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "no_Tx_failure", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:pending_subscription_approval"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("approveInboundPendingSubscription");
        $ctx.log.debug("rule selected", { "rule_name": "approveInboundPendingSubscription" });
        const bus3 = await findBus2($ctx, [await inbound2($ctx, [])]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
            {
              "eci": await $stdlib["get"]($ctx, [
                bus3,
                "Tx"
              ]),
              "domain": "wrangler",
              "type": "outbound_pending_subscription_approved",
              "attrs": await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                {
                  "Id": await $stdlib["get"]($ctx, [
                    bus3,
                    "Id"
                  ]),
                  "Tx": await $stdlib["get"]($ctx, [
                    bus3,
                    "Rx"
                  ])
                }
              ])
            },
            await $stdlib["get"]($ctx, [
              bus3,
              "Tx_host"
            ])
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "inbound_pending_subscription_approved", await put1($ctx, [
          await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "Id",
            await $stdlib["get"]($ctx, [
              bus3,
              "Id"
            ])
          ]),
          ["bus"],
          bus3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:outbound_pending_subscription_approved"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("addOutboundSubscription");
        $ctx.log.debug("rule selected", { "rule_name": "addOutboundSubscription" });
        const outbound3 = await outbound2($ctx, []);
        const bus3 = await $delete$1($ctx, [
          await put1($ctx, [
            await findBus2($ctx, [outbound3]),
            { "Tx": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx"]) }
          ]),
          ["wellKnown_Tx"]
        ]);
        const index3 = await indexOfId2($ctx, [
          outbound3,
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]);
        var $fired = await $stdlib[">="]($ctx, [
          index3,
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
          await $ctx.rsCtx.putEnt("established", await append1($ctx, [
            await established2($ctx, []),
            bus3
          ]));
          await $ctx.rsCtx.putEnt("outbound", await splice1($ctx, [
            outbound3,
            index3,
            1
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "subscription_added", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            ["bus"],
            bus3
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:inbound_pending_subscription_approved"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("addInboundSubscription");
        $ctx.log.debug("rule selected", { "rule_name": "addInboundSubscription" });
        const inbound3 = await inbound2($ctx, []);
        const index3 = await indexOfId2($ctx, [
          inbound3,
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Id"])
        ]);
        var $fired = await $stdlib[">="]($ctx, [
          index3,
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
          await $ctx.rsCtx.putEnt("established", await append1($ctx, [
            await established2($ctx, []),
            await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["bus"])
          ]));
          await $ctx.rsCtx.putEnt("inbound", await splice1($ctx, [
            inbound3,
            index3,
            1
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "subscription_added", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:subscription_cancellation"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cancelEstablished");
        $ctx.log.debug("rule selected", { "rule_name": "cancelEstablished" });
        const bus3 = await findBus2($ctx, [await established2($ctx, [])]);
        const Tx_host3 = await $stdlib["get"]($ctx, [
          bus3,
          "Tx_host"
        ]);
        var $fired = bus3;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
            {
              "eci": await $stdlib["get"]($ctx, [
                bus3,
                "Tx"
              ]),
              "domain": "wrangler",
              "type": "established_removal",
              "attrs": await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                {
                  "Rx": await $stdlib["get"]($ctx, [
                    bus3,
                    "Tx"
                  ]),
                  "Tx": await $stdlib["get"]($ctx, [
                    bus3,
                    "Rx"
                  ]),
                  "Id": await $stdlib["get"]($ctx, [
                    bus3,
                    "Id"
                  ])
                }
              ])
            },
            Tx_host3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "established_removal", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "Id",
            await $stdlib["get"]($ctx, [
              bus3,
              "Id"
            ])
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:established_removal"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("removeEstablished");
        $ctx.log.debug("rule selected", { "rule_name": "removeEstablished" });
        const buses3 = await established2($ctx, []);
        const bus3 = await findBus2($ctx, [buses3]);
        const index3 = await indexOfId2($ctx, [
          buses3,
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]);
        var $fired = await $stdlib[">="]($ctx, [
          index3,
          0
        ]);
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delChannel"])($ctx, [await $stdlib["get"]($ctx, [
              bus3,
              "Rx"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("established", await splice1($ctx, [
            buses3,
            index3,
            1
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "subscription_removed", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            { "bus": bus3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:inbound_rejection"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cancelInbound");
        $ctx.log.debug("rule selected", { "rule_name": "cancelInbound" });
        const bus3 = await findBus2($ctx, [await inbound2($ctx, [])]);
        const Tx_host3 = await $stdlib["get"]($ctx, [
          bus3,
          "Tx_host"
        ]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
            {
              "eci": await $stdlib["get"]($ctx, [
                bus3,
                "Tx"
              ]),
              "domain": "wrangler",
              "type": "outbound_removal",
              "attrs": await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                {
                  "Id": await $stdlib["get"]($ctx, [
                    bus3,
                    "Id"
                  ])
                }
              ])
            },
            Tx_host3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "inbound_removal", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "Id",
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:inbound_removal"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("removeInbound");
        $ctx.log.debug("rule selected", { "rule_name": "removeInbound" });
        const buses3 = await inbound2($ctx, []);
        const bus3 = await findBus2($ctx, [buses3]);
        const index3 = await indexOfId2($ctx, [
          buses3,
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]);
        var $fired = await $stdlib[">="]($ctx, [
          index3,
          0
        ]);
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delChannel"])($ctx, [await $stdlib["get"]($ctx, [
              bus3,
              "Rx"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("inbound", await splice1($ctx, [
            buses3,
            index3,
            1
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "inbound_subscription_cancelled", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            { "bus": bus3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:outbound_cancellation"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("cancelOutbound");
        $ctx.log.debug("rule selected", { "rule_name": "cancelOutbound" });
        const bus3 = await findBus2($ctx, [await outbound2($ctx, [])]);
        const Tx_host3 = await $stdlib["get"]($ctx, [
          bus3,
          "Tx_host"
        ]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
            {
              "eci": await $stdlib["get"]($ctx, [
                bus3,
                "wellKnown_Tx"
              ]),
              "domain": "wrangler",
              "type": "inbound_removal",
              "attrs": await put1($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                {
                  "Id": await $stdlib["get"]($ctx, [
                    bus3,
                    "Id"
                  ]),
                  "Tx": await $stdlib["get"]($ctx, [
                    bus3,
                    "Rx"
                  ])
                }
              ])
            },
            Tx_host3
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.raiseEvent("wrangler", "outbound_removal", await put1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "Id",
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:outbound_removal"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("removeOutbound");
        $ctx.log.debug("rule selected", { "rule_name": "removeOutbound" });
        const buses3 = await outbound2($ctx, []);
        const bus3 = await findBus2($ctx, [buses3]);
        const index3 = await indexOfId2($ctx, [
          buses3,
          await $stdlib["get"]($ctx, [
            bus3,
            "Id"
          ])
        ]);
        var $fired = await $stdlib[">="]($ctx, [
          index3,
          0
        ]);
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["delChannel"])($ctx, [await $stdlib["get"]($ctx, [
              bus3,
              "Rx"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("outbound", await splice1($ctx, [
            buses3,
            index3,
            1
          ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "outbound_subscription_cancelled", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            { "bus": bus3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:send_event_on_subs"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("sendEventToSubCheck");
        $ctx.log.debug("rule selected", { "rule_name": "sendEventToSubCheck" });
        const subID3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["subID"]);
        const Tx_role3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Tx_role"]);
        const Rx_role3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["Rx_role"]);
        const establishedWithID3 = subID3 ? await established2($ctx, [
          "Id",
          subID3
        ]) : [];
        const establishedWithTx_role3 = Tx_role3 ? await established2($ctx, [
          "Tx_role",
          Tx_role3
        ]) : [];
        const establishedWithRx_role3 = Rx_role3 ? await established2($ctx, [
          "Rx_role",
          Rx_role3
        ]) : [];
        const subs3 = await append1($ctx, [
          await append1($ctx, [
            establishedWithID3,
            establishedWithTx_role3
          ]),
          establishedWithRx_role3
        ]);
        var $fired = await $stdlib[">"]($ctx, [
          await $length$1($ctx, [subs3]),
          0
        ]) && await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["domain"]) && await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["type"]);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "send_event_to_subs", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "subs",
            subs3
          ]));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "failed_to_send_event_to_sub", await put1($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            {
              "foundSubsToSendTo": await $stdlib[">"]($ctx, [
                await $length$1($ctx, [subs3]),
                0
              ]),
              "domainGiven": await as1($ctx, [
                await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["domain"]),
                "Boolean"
              ]),
              "typeGiven": await as1($ctx, [
                await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["type"]),
                "Boolean"
              ])
            }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:send_event_to_subs"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["subs"]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let sub3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("send_event_to_subs");
          $ctx.log.debug("rule selected", { "rule_name": "send_event_to_subs" });
          const tx3 = await $stdlib["get"]($ctx, [
            sub3,
            "Tx"
          ]);
          const host3 = await $stdlib["get"]($ctx, [
            sub3,
            "Tx_host"
          ]);
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction($ctx.module("event")["send"])($ctx, [
              {
                "eci": tx3,
                "domain": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["domain"]),
                "type": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["type"]),
                "attrs": await defaultsTo1($ctx, [
                  await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["attrs"]),
                  {}
                ])
              },
              host3
            ]);
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
    $rs.when($ctx.krl.SelectWhen.e("wrangler:inbound_pending_subscription_added"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("autoAccept");
        $ctx.log.debug("rule selected", { "rule_name": "autoAccept" });
        const matches3 = await any1($ctx, [
          await values1($ctx, [await klog1($ctx, [
              await map1($ctx, [
                await autoAcceptConfig2($ctx, []),
                $ctx.krl.Function([
                  "config",
                  "configName"
                ], async function (config4, configName4) {
                  return await doesConfigMatch2($ctx, [config4]);
                })
              ]),
              "final map"
            ])]),
          $ctx.krl.Function(["bool"], async function (bool4) {
            return bool4;
          })
        ]);
        var $fired = matches3;
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "pending_subscription_approval", $ctx.module("event")["attrs"]($ctx));
          await $ctx.rsCtx.raiseEvent("wrangler", "auto_accepted_subscription_request", $ctx.module("event")["attrs"]($ctx));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("wrangler:autoAcceptConfigUpdate"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("autoAcceptConfigUpdate");
        $ctx.log.debug("rule selected", { "rule_name": "autoAcceptConfigUpdate" });
        const givenConfig3 = await defaultsTo1($ctx, [
          await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["config"]),
          {
            "configName": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["configName"]),
            "password": await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["password"]),
            "entries": await decode1($ctx, [await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["regexMap"])])
          }
        ]);
        const givenName3 = await $stdlib["get"]($ctx, [
          givenConfig3,
          ["configName"]
        ]);
        const configPassword3 = await defaultsTo1($ctx, [
          await $stdlib["get"]($ctx, [
            givenConfig3,
            ["password"]
          ]),
          ""
        ]);
        const config3 = await autoAcceptConfig2($ctx, []);
        const existingConfig3 = await defaultsTo1($ctx, [
          await $stdlib["get"]($ctx, [
            config3,
            [givenName3]
          ]),
          {}
        ]);
        const configToAdd3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["delete"]) ? void 0 : givenConfig3;
        var $fired = await klog1($ctx, [
          givenName3,
          "configName"
        ]);
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("autoAcceptConfig", await autoAcceptConfig2($ctx, []));
          await $ctx.rsCtx.putEnt("autoAcceptConfig", await $stdlib.set($ctx, [
            await $ctx.rsCtx.getEnt("autoAcceptConfig"),
            [givenName3],
            await klog1($ctx, [
              configToAdd3,
              "added config"
            ])
          ]));
          if (await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["delete"]))
            await $ctx.rsCtx.putEnt("autoAcceptConfig", await $delete$1($ctx, [
              await $ctx.rsCtx.getEnt("autoAcceptConfig"),
              givenName3
            ]));
          await $ctx.rsCtx.raiseEvent("wrangler", "auto_accept_config_updated", $ctx.module("event")["attrs"]($ctx));
        }
        if (!$fired) {
          await $ctx.rsCtx.raiseEvent("wrangler", "autoAcceptConfigUpdate_failure", $ctx.module("event")["attrs"]($ctx));
        }
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
        "established": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return established2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "outbound": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return outbound2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "inbound": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return inbound2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "wellKnown_Rx": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return wellKnown_Rx2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "autoAcceptConfig": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return autoAcceptConfig2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing2;
        }
      },
      "provides": {
        "established": established2,
        "outbound": outbound2,
        "inbound": inbound2,
        "wellKnown_Rx": wellKnown_Rx2,
        "autoAcceptConfig": autoAcceptConfig2
      }
    };
  }
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IiIsInNvdXJjZXNDb250ZW50IjpbXX0=
