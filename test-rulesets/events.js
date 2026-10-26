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
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const get1 = $stdlib["get"];
    const noop1 = $stdlib["noop"];
    const match1 = $stdlib["match"];
    const __testing1 = {
      "queries": [
        {
          "name": "getOnChooseFired",
          "args": []
        },
        {
          "name": "getNoActionFired",
          "args": []
        },
        {
          "name": "getSentAttrs",
          "args": []
        },
        {
          "name": "getSentName",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "events",
          "name": "bind",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "set_attr2",
          "attrs": [
            "number",
            "name"
          ]
        },
        {
          "domain": "events",
          "name": "get",
          "attrs": ["thing"]
        },
        {
          "domain": "events",
          "name": "attrs_get",
          "attrs": ["thing"]
        },
        {
          "domain": "events",
          "name": "noop",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "noop2",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "ifthen",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "on_fired",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "on_choose",
          "attrs": ["thing"]
        },
        {
          "domain": "events",
          "name": "on_choose_if",
          "attrs": [
            "thing",
            "fire"
          ]
        },
        {
          "domain": "events",
          "name": "on_every",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "on_sample",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "on_sample_if",
          "attrs": ["fire"]
        },
        {
          "domain": "events",
          "name": "select_where",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "where_match_0",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "where_match_null",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "where_match_false",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "where_match_empty_str",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "where_after_setting",
          "attrs": ["a"]
        },
        {
          "domain": "events",
          "name": "where_using_global",
          "attrs": ["a"]
        },
        {
          "domain": "events",
          "name": "implicit_match_0",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "implicit_match_null",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "implicit_match_false",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "implicit_match_empty_str",
          "attrs": ["something"]
        },
        {
          "domain": "events",
          "name": "no_action",
          "attrs": ["fired"]
        },
        {
          "domain": "events",
          "name": "action_send",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "store_sent_name",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "raise_basic",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "raise_set_name",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "raise_set_name_attr",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "raise_set_name_rid",
          "attrs": ["name"]
        },
        {
          "domain": "events",
          "name": "raise_dynamic",
          "attrs": ["domainType"]
        },
        {
          "domain": "events",
          "name": "event_eid",
          "attrs": []
        },
        {
          "domain": "events",
          "name": "event_attrs",
          "attrs": []
        }
      ]
    };
    const getOnChooseFired2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("on_choose_fired");
    });
    const getNoActionFired2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("no_action_fired");
    });
    const getSentAttrs2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("sent_attrs");
    });
    const getSentName2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("sent_name");
    });
    const global02 = "g zero";
    const global12 = "g one";
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("events:bind", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("set_attr");
        $ctx.log.debug("rule selected", { "rule_name": "set_attr" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "bound",
            { "name": my_name3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("set_attr", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:set_attr2", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("[Nn]0*(\\d*)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "number") ? $stdlib.as($ctx, [
        $event.data.attrs["number"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      m = new RegExp("(.*)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var number3 = setting["number"] = matches[0];
      var $name$3 = setting["name"] = matches[1];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("set_attr2");
        $ctx.log.debug("rule selected", { "rule_name": "set_attr2" });
        var number3 = $state.setting["number"];
        var $name$3 = $state.setting["name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "set_attr2",
            {
              "number": number3,
              "name": $name$3
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("set_attr2", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:get"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("get_attr");
        $ctx.log.debug("rule selected", { "rule_name": "get_attr" });
        const thing3 = await $ctx.krl.assertFunction($ctx.module("event")["attr"])($ctx, ["thing"]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "get",
            { "thing": thing3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("get_attr", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:attrs_get"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("attrs_get");
        $ctx.log.debug("rule selected", { "rule_name": "attrs_get" });
        const thing3 = await get1($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "thing"
        ]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "attrs_get",
            { "thing": thing3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("attrs_get", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:noop"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("noop");
        $ctx.log.debug("rule selected", { "rule_name": "noop" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("noop", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:noop2"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("noop2");
        $ctx.log.debug("rule selected", { "rule_name": "noop2" });
        var $fired = true;
        if ($fired) {
          await noop1($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("noop2", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:ifthen", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("ifthen");
        $ctx.log.debug("rule selected", { "rule_name": "ifthen" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = my_name3;
        if ($fired) {
          await send_directive1($ctx, ["ifthen"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("ifthen", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_fired", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_fired");
        $ctx.log.debug("rule selected", { "rule_name": "on_fired" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "on_fired",
            { "previous_name": await $ctx.rsCtx.getEnt("on_fired_prev_name") }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_fired", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("on_fired_prev_name", my_name3);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_choose", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "thing") ? $stdlib.as($ctx, [
        $event.data.attrs["thing"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var thing3 = setting["thing"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_choose");
        $ctx.log.debug("rule selected", { "rule_name": "on_choose" });
        var thing3 = $state.setting["thing"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          switch (thing3) {
          case "one":
            await send_directive1($ctx, ["on_choose - one"]);
            break;
          case "two":
            await send_directive1($ctx, ["on_choose - two"]);
            break;
          }
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_choose", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("on_choose_fired", true);
        }
        if (!$fired) {
          await $ctx.rsCtx.putEnt("on_choose_fired", false);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_choose_if", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "thing") ? $stdlib.as($ctx, [
        $event.data.attrs["thing"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var thing3 = setting["thing"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_choose_if");
        $ctx.log.debug("rule selected", { "rule_name": "on_choose_if" });
        var thing3 = $state.setting["thing"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = await $stdlib["=="]($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "fire"
          ]),
          "yes"
        ]);
        if ($fired) {
          switch (thing3) {
          case "one":
            await send_directive1($ctx, ["on_choose_if - one"]);
            break;
          case "two":
            await send_directive1($ctx, ["on_choose_if - two"]);
            break;
          }
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_choose_if", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("on_choose_fired", true);
        }
        if (!$fired) {
          await $ctx.rsCtx.putEnt("on_choose_fired", false);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_every"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_every");
        $ctx.log.debug("rule selected", { "rule_name": "on_every" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["on_every - one"]);
          await send_directive1($ctx, ["on_every - two"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_every", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_sample"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_sample");
        $ctx.log.debug("rule selected", { "rule_name": "on_sample" });
        var $fired = true;
        if ($fired) {
          switch (Math.floor(Math.random() * 3)) {
          case 0:
            await send_directive1($ctx, ["on_sample - one"]);
            break;
          case 1:
            await send_directive1($ctx, ["on_sample - two"]);
            break;
          case 2:
            await send_directive1($ctx, ["on_sample - three"]);
            break;
          }
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_sample", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:on_sample_if"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_sample_if");
        $ctx.log.debug("rule selected", { "rule_name": "on_sample_if" });
        var $fired = await $stdlib["=="]($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "fire"
          ]),
          "yes"
        ]);
        if ($fired) {
          switch (Math.floor(Math.random() * 3)) {
          case 0:
            await send_directive1($ctx, ["on_sample - one"]);
            break;
          case 1:
            await send_directive1($ctx, ["on_sample - two"]);
            break;
          case 2:
            await send_directive1($ctx, ["on_sample - three"]);
            break;
          }
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("on_sample_if", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:select_where", async function ($event, $state) {
      if (!await match1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "something"
          ]),
          new RegExp("^wat", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("select_where");
        $ctx.log.debug("rule selected", { "rule_name": "select_where" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["select_where"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("select_where", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_match_0", async function ($event, $state) {
      if (!await match1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "something"
          ]),
          new RegExp("0", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_match_0");
        $ctx.log.debug("rule selected", { "rule_name": "where_match_0" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_match_0"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_match_0", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_match_null", async function ($event, $state) {
      if (!await match1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "something"
          ]),
          new RegExp("null", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_match_null");
        $ctx.log.debug("rule selected", { "rule_name": "where_match_null" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_match_null"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_match_null", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_match_false", async function ($event, $state) {
      if (!await match1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "something"
          ]),
          new RegExp("false", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_match_false");
        $ctx.log.debug("rule selected", { "rule_name": "where_match_false" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_match_false"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_match_false", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_match_empty_str", async function ($event, $state) {
      if (!await match1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "something"
          ]),
          new RegExp("(?:)", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_match_empty_str");
        $ctx.log.debug("rule selected", { "rule_name": "where_match_empty_str" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_match_empty_str"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_match_empty_str", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_after_setting", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(.*)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "a") ? $stdlib.as($ctx, [
        $event.data.attrs["a"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var a3 = setting["a"] = matches[0];
      if (!await $stdlib["=="]($ctx, [
          a3,
          "one"
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_after_setting");
        $ctx.log.debug("rule selected", { "rule_name": "where_after_setting" });
        var a3 = $state.setting["a"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_after_setting"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_after_setting", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:where_using_global", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(.*)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "a") ? $stdlib.as($ctx, [
        $event.data.attrs["a"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var global03 = setting["global0"] = matches[0];
      if (!await $stdlib["=="]($ctx, [
          global03,
          global12
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("where_using_global");
        $ctx.log.debug("rule selected", { "rule_name": "where_using_global" });
        var global03 = $state.setting["global0"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["where_using_global"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("where_using_global", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:implicit_match_0", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("0", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "something") ? $stdlib.as($ctx, [
        $event.data.attrs["something"],
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
        $ctx.setCurrentRuleName("implicit_match_0");
        $ctx.log.debug("rule selected", { "rule_name": "implicit_match_0" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["implicit_match_0"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("implicit_match_0", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:implicit_match_null", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("null", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "something") ? $stdlib.as($ctx, [
        $event.data.attrs["something"],
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
        $ctx.setCurrentRuleName("implicit_match_null");
        $ctx.log.debug("rule selected", { "rule_name": "implicit_match_null" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["implicit_match_null"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("implicit_match_null", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:implicit_match_false", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("false", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "something") ? $stdlib.as($ctx, [
        $event.data.attrs["something"],
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
        $ctx.setCurrentRuleName("implicit_match_false");
        $ctx.log.debug("rule selected", { "rule_name": "implicit_match_false" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["implicit_match_false"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("implicit_match_false", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:implicit_match_empty_str", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(?:)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "something") ? $stdlib.as($ctx, [
        $event.data.attrs["something"],
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
        $ctx.setCurrentRuleName("implicit_match_empty_str");
        $ctx.log.debug("rule selected", { "rule_name": "implicit_match_empty_str" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["implicit_match_empty_str"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("implicit_match_empty_str", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:no_action", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^yes$", "i").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "fired") ? $stdlib.as($ctx, [
        $event.data.attrs["fired"],
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
        $ctx.setCurrentRuleName("no_action");
        $ctx.log.debug("rule selected", { "rule_name": "no_action" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("no_action", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("no_action_fired", true);
        }
        if (!$fired) {
          await $ctx.rsCtx.putEnt("no_action_fired", false);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:action_send", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("action_send");
        $ctx.log.debug("rule selected", { "rule_name": "action_send" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["event"])($ctx, {
            "eci": $ctx.module("event")["eci"]($ctx),
            "domain": "events",
            "name": "store_sent_name",
            "attrs": {
              "name": my_name3,
              "empty": [],
              "r": new RegExp("hi", "i")
            }
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("action_send", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:store_sent_name", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("store_sent_name");
        $ctx.log.debug("rule selected", { "rule_name": "store_sent_name" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("store_sent_name", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("sent_attrs", $ctx.module("event")["attrs"]($ctx));
          await $ctx.rsCtx.putEnt("sent_name", my_name3);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:raise_basic"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("raise_basic");
        $ctx.log.debug("rule selected", { "rule_name": "raise_basic" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("raise_basic", $fired);
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("events", "event_attrs", undefined);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:raise_set_name", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("raise_set_name");
        $ctx.log.debug("rule selected", { "rule_name": "raise_set_name" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("raise_set_name", $fired);
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name3 });
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:raise_set_name_attr", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("raise_set_name_attr");
        $ctx.log.debug("rule selected", { "rule_name": "raise_set_name_attr" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("raise_set_name_attr", $fired);
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name3 });
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:raise_set_name_rid", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("raise_set_name_rid");
        $ctx.log.debug("rule selected", { "rule_name": "raise_set_name_rid" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        const rid3 = "io.picolabs.events";
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("raise_set_name_rid", $fired);
        if ($fired) {
          await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name3 });
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:raise_dynamic", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "domainType") ? $stdlib.as($ctx, [
        $event.data.attrs["domainType"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var domainType3 = setting["domainType"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("raise_dynamic");
        $ctx.log.debug("rule selected", { "rule_name": "raise_dynamic" });
        var domainType3 = $state.setting["domainType"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("raise_dynamic", $fired);
        if ($fired) {
          {
            let $parts = $ctx.krl.toString(domainType3).replace(/\s+/g, "").split(":");
            await $ctx.rsCtx.raiseEvent($parts[0], $parts.slice(1).join(":"), $ctx.module("event")["attrs"]($ctx));
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:event_eid"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("event_eid");
        $ctx.log.debug("rule selected", { "rule_name": "event_eid" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "event_eid",
            { "eid": $ctx.module("event")["eid"]($ctx) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("event_eid", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("events:event_attrs"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("event_attrs");
        $ctx.log.debug("rule selected", { "rule_name": "event_attrs" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "event_attrs",
            { "attrs": $ctx.module("event")["attrs"]($ctx) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("event_attrs", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    null;
    const $consoleGlobalRefs = {
      "getOnChooseFired": getOnChooseFired2,
      "getNoActionFired": getNoActionFired2,
      "getSentAttrs": getSentAttrs2,
      "getSentName": getSentName2,
      "global0": global02,
      "global1": global12
    };
    const $rulesetKrlSource = "ruleset io.picolabs.events {\n    meta {\n        shares getOnChooseFired, getNoActionFired, getSentAttrs, getSentName\n    }\n    global {\n        getOnChooseFired = function(){\n            ent:on_choose_fired;\n        }\n        getNoActionFired = function(){\n            ent:no_action_fired;\n        }\n        getSentAttrs = function(){\n            ent:sent_attrs;\n        }\n        getSentName = function(){\n            ent:sent_name;\n        }\n        global0 = \"g zero\"\n        global1 = \"g one\"\n    }\n    rule set_attr {\n        select when events bind name re#^(.*)$# setting(my_name)\n\n        send_directive(\"bound\", {\"name\": my_name});\n    }\n    rule set_attr2 {\n        select when events set_attr2\n                number re#[Nn]0*(\\d*)#\n                name re#(.*)#\n                setting(number, name)\n\n        send_directive(\"set_attr2\", {\n            \"number\": number,\n            \"name\": name\n        });\n    }\n    rule get_attr {\n        select when events get\n\n        pre {\n            thing = event:attr(\"thing\")\n        }\n\n        send_directive(\"get\", {\"thing\": thing});\n    }\n    rule attrs_get {\n        select when events attrs_get\n\n        pre {\n            thing = event:attrs.get(\"thing\")\n        }\n\n        send_directive(\"attrs_get\", {\"thing\": thing});\n    }\n    rule noop {\n        select when events noop\n    }\n    rule noop2 {\n        select when events noop2\n\n        noop();\n    }\n    rule ifthen {\n        select when events ifthen name re#^(.*)$# setting(my_name)\n\n        if my_name then\n            send_directive(\"ifthen\");\n    }\n    rule on_fired {\n        select when events on_fired name re#^(.*)$# setting(my_name)\n\n        send_directive(\"on_fired\", {\"previous_name\": ent:on_fired_prev_name});\n\n        fired {\n            ent:on_fired_prev_name := my_name\n        }\n    }\n    rule on_choose {\n        select when events on_choose thing re#^(.*)$# setting(thing)\n\n        choose thing {\n            one =>\n                send_directive(\"on_choose - one\");\n\n            two =>\n                send_directive(\"on_choose - two\");\n        }\n\n        fired {\n            ent:on_choose_fired := true\n        } else {\n            ent:on_choose_fired := false\n        }\n    }\n    rule on_choose_if {\n        select when events on_choose_if thing re#^(.*)$# setting(thing)\n\n        if event:attrs{\"fire\"} == \"yes\" then\n        choose thing {\n            one =>\n                send_directive(\"on_choose_if - one\");\n\n            two =>\n                send_directive(\"on_choose_if - two\");\n        }\n\n        fired {\n            ent:on_choose_fired := true\n        } else {\n            ent:on_choose_fired := false\n        }\n    }\n    rule on_every {\n        select when events on_every\n\n        every {\n            send_directive(\"on_every - one\");\n\n            send_directive(\"on_every - two\");\n        }\n    }\n    rule on_sample {\n        select when events on_sample\n\n        sample {\n            send_directive(\"on_sample - one\");\n\n            send_directive(\"on_sample - two\");\n\n            send_directive(\"on_sample - three\");\n        }\n    }\n    rule on_sample_if {\n        select when events on_sample_if\n\n        if event:attrs{\"fire\"} == \"yes\" then\n        sample {\n            send_directive(\"on_sample - one\");\n\n            send_directive(\"on_sample - two\");\n\n            send_directive(\"on_sample - three\");\n        }\n    }\n    rule select_where {\n        select when events select_where where event:attrs{\"something\"}.match(re#^wat#)\n\n        send_directive(\"select_where\");\n    }\n    rule where_match_0 {\n        select when events where_match_0 where event:attrs{\"something\"}.match(re#0#)\n\n        send_directive(\"where_match_0\");\n    }\n    rule where_match_null {\n        select when events where_match_null where event:attrs{\"something\"}.match(re#null#)\n\n        send_directive(\"where_match_null\");\n    }\n    rule where_match_false {\n        select when events where_match_false where event:attrs{\"something\"}.match(re#false#)\n\n        send_directive(\"where_match_false\");\n    }\n    rule where_match_empty_str {\n        select when events where_match_empty_str where event:attrs{\"something\"}.match(re##)\n\n        send_directive(\"where_match_empty_str\");\n    }\n    rule where_after_setting {\n        select when events where_after_setting a re#(.*)# setting(a) where a == \"one\"\n\n        send_directive(\"where_after_setting\");\n    }\n    rule where_using_global {\n        select when events where_using_global a re#(.*)# setting(global0) where global0 == global1\n\n        send_directive(\"where_using_global\");\n    }\n    rule implicit_match_0 {\n        select when events implicit_match_0 something re#0#\n\n        send_directive(\"implicit_match_0\");\n    }\n    rule implicit_match_null {\n        select when events implicit_match_null something re#null#\n\n        send_directive(\"implicit_match_null\");\n    }\n    rule implicit_match_false {\n        select when events implicit_match_false something re#false#\n\n        send_directive(\"implicit_match_false\");\n    }\n    rule implicit_match_empty_str {\n        select when events implicit_match_empty_str something re##\n\n        send_directive(\"implicit_match_empty_str\");\n    }\n    rule no_action {\n        select when events no_action fired re#^yes$#i\n        fired {\n            ent:no_action_fired := true\n        } else {\n            ent:no_action_fired := false\n        }\n    }\n    rule action_send {\n        select when events action_send name re#^(.*)$# setting(my_name)\n\n        ctx:event(\n            eci = event:eci,\n            domain = \"events\",\n            name = \"store_sent_name\",\n            attrs = {\n            \"name\": my_name,\n            \"empty\": [],\n            \"r\": re#hi#i\n        },\n        );\n    }\n    rule store_sent_name {\n        select when events store_sent_name name re#^(.*)$# setting(my_name)\n        fired {\n            ent:sent_attrs := event:attrs;\n            ent:sent_name := my_name\n        }\n    }\n    rule raise_basic {\n        select when events raise_basic\n        fired {\n            raise events event \"event_attrs\"\n        }\n    }\n    rule raise_set_name {\n        select when events raise_set_name name re#^(.*)$# setting(my_name)\n        fired {\n            raise events event \"store_sent_name\"\n                attributes {\"name\": my_name}\n        }\n    }\n    rule raise_set_name_attr {\n        select when events raise_set_name_attr name re#^(.*)$# setting(my_name)\n        fired {\n            raise events event \"store_sent_name\"\n                attributes {\"name\": my_name}\n        }\n    }\n    rule raise_set_name_rid {\n        select when events raise_set_name_rid name re#^(.*)$# setting(my_name)\n\n        pre {\n            rid = \"io.picolabs.events\"\n        }\n        fired {\n            raise events event \"store_sent_name\" for rid\n                attributes {\"name\": my_name}\n        }\n    }\n    rule raise_dynamic {\n        select when events raise_dynamic domainType re#^(.*)$# setting(domainType)\n        fired {\n            raise event domainType\n                attributes event:attrs\n        }\n    }\n    rule event_eid {\n        select when events event_eid\n\n        send_directive(\"event_eid\", {\"eid\": event:eid});\n    }\n    rule event_attrs {\n        select when events event_attrs\n\n        send_directive(\"event_attrs\", {\"attrs\": event:attrs});\n    }\n    rule ignored is inactive {\n        select when events ignored\n\n        send_directive(\"ignored - should not see this\");\n    }\n}\n";
    const $compileEvalExpression = $ctx["compileEvalExpression"];
    const $consoleEvalCache = new Map();
    const $runConsoleEval = async expr => {
      let runner = $consoleEvalCache.get(expr);
      if (!runner) {
        runner = $compileEvalExpression(expr, { rulesetKrl: $rulesetKrlSource }).run;
        $consoleEvalCache.set(expr, runner);
      }
      return await runner($ctx, $consoleGlobalRefs);
    };
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return {
          "directives": $ctx.drainDirectives(),
          "ruleOutcomes": $ctx.drainRuleOutcomes()
        };
      },
      "query": {
        "getOnChooseFired": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getOnChooseFired2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getNoActionFired": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getNoActionFired2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getSentAttrs": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getSentAttrs2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getSentName": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getSentName2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        },
        "__consoleEval": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await $runConsoleEval(query["args"]["expr"]);
          } finally {
            $ctx.setQuery(null);
          }
        }
      },
      "consoleGlobalRefs": $consoleGlobalRefs
    };
  }
};
