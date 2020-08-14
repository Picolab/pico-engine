module.exports = {
  "rid": "io.picolabs.event-exp",
  "version": "draft",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": [
        {
          "domain": "ee_before",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_before",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_after",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_after",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_then",
          "name": "a",
          "attrs": ["name"]
        },
        {
          "domain": "ee_then",
          "name": "b",
          "attrs": ["name"]
        },
        {
          "domain": "ee_and",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_and",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_or",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_or",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_between",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_between",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_between",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_not_between",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_not_between",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_not_between",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_andor",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_andor",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_andor",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_orand",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_orand",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_orand",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_before_n",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_before_n",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_before_n",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_after_n",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_after_n",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_after_n",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_then_n",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_then_n",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_then_n",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_and_n",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_and_n",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_and_n",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_or_n",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_or_n",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_or_n",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_or_n",
          "name": "d",
          "attrs": []
        },
        {
          "domain": "ee_any",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_any",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_any",
          "name": "c",
          "attrs": []
        },
        {
          "domain": "ee_any",
          "name": "d",
          "attrs": []
        },
        {
          "domain": "ee_count",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_repeat",
          "name": "a",
          "attrs": ["name"]
        },
        {
          "domain": "ee_count_max",
          "name": "a",
          "attrs": ["b"]
        },
        {
          "domain": "ee_repeat_min",
          "name": "a",
          "attrs": ["b"]
        },
        {
          "domain": "ee_repeat_sum",
          "name": "a",
          "attrs": ["b"]
        },
        {
          "domain": "ee_repeat_avg",
          "name": "a",
          "attrs": ["b"]
        },
        {
          "domain": "ee_repeat_push",
          "name": "a",
          "attrs": ["b"]
        },
        {
          "domain": "ee_repeat_push_multi",
          "name": "a",
          "attrs": [
            "a",
            "b"
          ]
        },
        {
          "domain": "ee_repeat_sum_multi",
          "name": "a",
          "attrs": [
            "a",
            "b"
          ]
        },
        {
          "domain": "ee_or_duppath",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_notbet_duppath",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_notbet_duppath",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_ab_or_b",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_ab_or_b",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_ab_or_ca",
          "name": "a",
          "attrs": []
        },
        {
          "domain": "ee_ab_or_ca",
          "name": "b",
          "attrs": []
        },
        {
          "domain": "ee_ab_or_ca",
          "name": "c",
          "attrs": []
        }
      ]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("ee_before:a"), $ctx.krl.SelectWhen.e("ee_before:b")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "before" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["before"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.after($ctx.krl.SelectWhen.e("ee_after:a"), $ctx.krl.SelectWhen.e("ee_after:b")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "after" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["after"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.then($ctx.krl.SelectWhen.e("ee_then:a"), $ctx.krl.SelectWhen.e("ee_then:b", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("bob", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
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
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "then" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["then"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_and:a"), $ctx.krl.SelectWhen.e("ee_and:b")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "and" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["and"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_or:a"), $ctx.krl.SelectWhen.e("ee_or:b")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "or" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["or"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.between($ctx.krl.SelectWhen.e("ee_between:a"), $ctx.krl.SelectWhen.e("ee_between:b"), $ctx.krl.SelectWhen.e("ee_between:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "between" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["between"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.notBetween($ctx.krl.SelectWhen.e("ee_not_between:a"), $ctx.krl.SelectWhen.e("ee_not_between:b"), $ctx.krl.SelectWhen.e("ee_not_between:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "not_between" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["not between"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_andor:a"), $ctx.krl.SelectWhen.e("ee_andor:b")), $ctx.krl.SelectWhen.e("ee_andor:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "and_or" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["(a and b) or c"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_orand:a"), $ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_orand:b"), $ctx.krl.SelectWhen.e("ee_orand:c"))), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "or_and" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["a and (b or c)"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("ee_before_n:a"), $ctx.krl.SelectWhen.e("ee_before_n:b"), $ctx.krl.SelectWhen.e("ee_before_n:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "before_n" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["before_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.after($ctx.krl.SelectWhen.e("ee_after_n:a"), $ctx.krl.SelectWhen.e("ee_after_n:b"), $ctx.krl.SelectWhen.e("ee_after_n:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "after_n" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["after_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.then($ctx.krl.SelectWhen.e("ee_then_n:a"), $ctx.krl.SelectWhen.e("ee_then_n:b"), $ctx.krl.SelectWhen.e("ee_then_n:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "then_n" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["then_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_and_n:a"), $ctx.krl.SelectWhen.e("ee_and_n:b"), $ctx.krl.SelectWhen.e("ee_and_n:c")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "and_n" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["and_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_or_n:a"), $ctx.krl.SelectWhen.e("ee_or_n:b"), $ctx.krl.SelectWhen.e("ee_or_n:c"), $ctx.krl.SelectWhen.e("ee_or_n:d")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "or_n" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["or_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.any(2, $ctx.krl.SelectWhen.e("ee_any:a"), $ctx.krl.SelectWhen.e("ee_any:b"), $ctx.krl.SelectWhen.e("ee_any:c"), $ctx.krl.SelectWhen.e("ee_any:d")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "any" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["any"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.count(3, $ctx.krl.SelectWhen.e("ee_count:a")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "count" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["count"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("bob", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
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
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["repeat"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.count(3, $ctx.krl.SelectWhen.e("ee_count_max:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "max", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "count_max" });
      var m3 = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "count_max",
          { "m": m3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat_min:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "min", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_min" });
      var m3 = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_min",
          { "m": m3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat_sum:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "sum", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_sum" });
      var m3 = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_sum",
          { "m": m3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat_avg:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "avg", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_avg" });
      var m3 = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_avg",
          { "m": m3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat_push:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "push", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_push" });
      var m3 = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_push",
          { "m": m3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(5, $ctx.krl.SelectWhen.e("ee_repeat_push_multi:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "a") ? $stdlib.as($ctx, [
        $event.data.attrs["a"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      m = new RegExp("(\\d+) (.*)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "push", [
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
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_push_multi" });
      var a3 = $state.setting["a"];
      var b3 = $state.setting["b"];
      var c3 = $state.setting["c"];
      var d3 = $state.setting["d"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_push_multi",
          {
            "a": a3,
            "b": b3,
            "c": c3,
            "d": d3
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("ee_repeat_sum_multi:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "a") ? $stdlib.as($ctx, [
        $event.data.attrs["a"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      m = new RegExp("(\\d+)", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      $state = await $ctx.krl.aggregateEvent($state, "sum", [
        [
          "a",
          matches[0]
        ],
        [
          "b",
          matches[1]
        ]
      ]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "repeat_sum_multi" });
      var a3 = $state.setting["a"];
      var b3 = $state.setting["b"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, [
          "repeat_sum_multi",
          {
            "a": a3,
            "b": b3
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("ee_or_duppath:a"), $ctx.krl.SelectWhen.e("ee_or_duppath:a")), $ctx.krl.SelectWhen.e("ee_or_duppath:a")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "or_duppath" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["(a before a) or a"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.notBetween($ctx.krl.SelectWhen.e("ee_notbet_duppath:a"), $ctx.krl.SelectWhen.e("ee_notbet_duppath:b"), $ctx.krl.SelectWhen.e("ee_notbet_duppath:a")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "notbet_duppath" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["a not between (b, a)"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_b:a"), $ctx.krl.SelectWhen.e("ee_ab_or_b:b")), $ctx.krl.SelectWhen.e("ee_ab_or_b:b")), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "ab_or_b" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["(a and b) or b"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_ca:a"), $ctx.krl.SelectWhen.e("ee_ab_or_ca:b")), $ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_ca:c"), $ctx.krl.SelectWhen.e("ee_ab_or_ca:a"))), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "ab_or_ca" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["(a and b) or (c and a)"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
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
        "__testing": function () {
          return __testing1;
        }
      }
    };
  }
};