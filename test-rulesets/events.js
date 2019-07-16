module.exports = {
  "rid": "io.picolabs.events",
  "version": "draft",
  "meta": {
    "shares": [
      "getOnChooseFired",
      "getNoActionFired",
      "getSentAttrs",
      "getSentName"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const noop = $stdlib["noop"];
    const match = $stdlib["match"];
    const getOnChooseFired = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("on_choose_fired");
    });
    const getNoActionFired = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("no_action_fired");
    });
    const getSentAttrs = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("sent_attrs");
    });
    const getSentName = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("sent_name");
    });
    const global0 = "g zero";
    const global1 = "g one";
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("events:bind", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "bound",
          { "name": my_name }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:set_attr2", async function ($event, $state) {
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
      var number = setting["number"] = matches[0];
      var name = setting["name"] = matches[1];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var number = $state.setting["number"];
      var name = $state.setting["name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "set_attr2",
          {
            "number": number,
            "name": name
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:get"), async function ($event, $state) {
      const thing = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "thing"
      ]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "get",
          { "thing": thing }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:noop"), async function ($event, $state) {
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:noop2"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(noop)($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:ifthen", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = my_name;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["ifthen"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:on_fired", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "on_fired",
          { "previous_name": await $ctx.rsCtx.getEnt("on_fired_prev_name") }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("on_fired_prev_name", my_name);
      }
    });
    $rs.when($env.SelectWhen.e("events:on_choose", async function ($event, $state) {
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
      var thing = setting["thing"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var thing = $state.setting["thing"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        switch (thing) {
        case "one":
          await $env.krl.assertAction(send_directive)($ctx, ["on_choose - one"]);
          break;
        case "two":
          await $env.krl.assertAction(send_directive)($ctx, ["on_choose - two"]);
          break;
        }
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("on_choose_fired", true);
      }
      if (!$fired) {
        await $ctx.rsCtx.putEnt("on_choose_fired", false);
      }
    });
    $rs.when($env.SelectWhen.e("events:on_choose_if", async function ($event, $state) {
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
      var thing = setting["thing"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var thing = $state.setting["thing"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = await $stdlib["=="]($ctx, [
        await $stdlib["get"]($ctx, [
          $event.data.attrs,
          "fire"
        ]),
        "yes"
      ]);
      if ($fired) {
        switch (thing) {
        case "one":
          await $env.krl.assertAction(send_directive)($ctx, ["on_choose_if - one"]);
          break;
        case "two":
          await $env.krl.assertAction(send_directive)($ctx, ["on_choose_if - two"]);
          break;
        }
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("on_choose_fired", true);
      }
      if (!$fired) {
        await $ctx.rsCtx.putEnt("on_choose_fired", false);
      }
    });
    $rs.when($env.SelectWhen.e("events:on_every"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["on_every - one"]);
        await $env.krl.assertAction(send_directive)($ctx, ["on_every - two"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:on_sample"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        switch (Math.floor(Math.random() * 3)) {
        case 0:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - one"]);
          break;
        case 1:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - two"]);
          break;
        case 2:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - three"]);
          break;
        }
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:on_sample_if"), async function ($event, $state) {
      var $fired = await $stdlib["=="]($ctx, [
        await $stdlib["get"]($ctx, [
          $event.data.attrs,
          "fire"
        ]),
        "yes"
      ]);
      if ($fired) {
        switch (Math.floor(Math.random() * 3)) {
        case 0:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - one"]);
          break;
        case 1:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - two"]);
          break;
        case 2:
          await $env.krl.assertAction(send_directive)($ctx, ["on_sample - three"]);
          break;
        }
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:select_where", async function ($event, $state) {
      if (!await $env.krl.assertFunction(match)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "something"
          ]),
          new RegExp("^wat", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["select_where"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_match_0", async function ($event, $state) {
      if (!await $env.krl.assertFunction(match)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "something"
          ]),
          new RegExp("0", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_match_0"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_match_null", async function ($event, $state) {
      if (!await $env.krl.assertFunction(match)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "something"
          ]),
          new RegExp("null", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_match_null"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_match_false", async function ($event, $state) {
      if (!await $env.krl.assertFunction(match)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "something"
          ]),
          new RegExp("false", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_match_false"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_match_empty_str", async function ($event, $state) {
      if (!await $env.krl.assertFunction(match)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "something"
          ]),
          new RegExp("(?:)", "")
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_match_empty_str"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_after_setting", async function ($event, $state) {
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
      var a = setting["a"] = matches[0];
      if (!await $stdlib["=="]($ctx, [
          a,
          "one"
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var a = $state.setting["a"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_after_setting"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:where_using_global", async function ($event, $state) {
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
      var global0 = setting["global0"] = matches[0];
      if (!await $stdlib["=="]($ctx, [
          global0,
          global1
        ]))
        return { "match": false };
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var global0 = $state.setting["global0"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["where_using_global"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:implicit_match_0", async function ($event, $state) {
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
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["implicit_match_0"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:implicit_match_null", async function ($event, $state) {
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
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["implicit_match_null"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:implicit_match_false", async function ($event, $state) {
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
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["implicit_match_false"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:implicit_match_empty_str", async function ($event, $state) {
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
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["implicit_match_empty_str"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:no_action", async function ($event, $state) {
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
    }), async function ($event, $state) {
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("no_action_fired", true);
      }
      if (!$fired) {
        await $ctx.rsCtx.putEnt("no_action_fired", false);
      }
    });
    $rs.when($env.SelectWhen.e("events:action_send", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction($ctx.module("ctx")["event"])($ctx, {
          "eci": $event.eci,
          "domain": "events",
          "name": "store_sent_name",
          "attrs": {
            "name": my_name,
            "empty": [],
            "r": new RegExp("hi", "i")
          }
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("events:store_sent_name", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("sent_attrs", $event.data.attrs);
        await $ctx.rsCtx.putEnt("sent_name", my_name);
      }
    });
    $rs.when($env.SelectWhen.e("events:raise_set_name", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name });
      }
    });
    $rs.when($env.SelectWhen.e("events:raise_set_name_attr", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name });
      }
    });
    $rs.when($env.SelectWhen.e("events:raise_set_name_rid", async function ($event, $state) {
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
      var my_name = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var my_name = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      const rid = "io.picolabs.events";
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.raiseEvent("events", "store_sent_name", { "name": my_name });
      }
    });
    $rs.when($env.SelectWhen.e("events:event_eid"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "event_eid",
          { "eid": $ctx.module("event")["eid"]($ctx) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    null;
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
        "getOnChooseFired": function ($args) {
          return getOnChooseFired($ctx, $args);
        },
        "getNoActionFired": function ($args) {
          return getNoActionFired($ctx, $args);
        },
        "getSentAttrs": function ($args) {
          return getSentAttrs($ctx, $args);
        },
        "getSentName": function ($args) {
          return getSentName($ctx, $args);
        },
        "__testing": function () {
          return {
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
                "attrs": []
              },
              {
                "domain": "events",
                "name": "set_attr2",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "get",
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
                "attrs": []
              },
              {
                "domain": "events",
                "name": "on_fired",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "on_choose",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "on_choose_if",
                "attrs": ["fire"]
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
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_match_0",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_match_null",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_match_false",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_match_empty_str",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_after_setting",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "where_using_global",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "implicit_match_0",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "implicit_match_null",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "implicit_match_false",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "implicit_match_empty_str",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "no_action",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "action_send",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "store_sent_name",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "raise_set_name",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "raise_set_name_attr",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "raise_set_name_rid",
                "attrs": []
              },
              {
                "domain": "events",
                "name": "event_eid",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};