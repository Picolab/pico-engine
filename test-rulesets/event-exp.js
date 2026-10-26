module.exports = {
  "rid": "io.picolabs.event-exp",
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
      try {
        $ctx.setCurrentRuleName("before");
        $ctx.log.debug("rule selected", { "rule_name": "before" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["before"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("before", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.after($ctx.krl.SelectWhen.e("ee_after:a"), $ctx.krl.SelectWhen.e("ee_after:b")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("after");
        $ctx.log.debug("rule selected", { "rule_name": "after" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["after"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("after", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("then");
        $ctx.log.debug("rule selected", { "rule_name": "then" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["then"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("then", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_and:a"), $ctx.krl.SelectWhen.e("ee_and:b")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("and");
        $ctx.log.debug("rule selected", { "rule_name": "and" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["and"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("and", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_or:a"), $ctx.krl.SelectWhen.e("ee_or:b")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("or");
        $ctx.log.debug("rule selected", { "rule_name": "or" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["or"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("or", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.between($ctx.krl.SelectWhen.e("ee_between:a"), $ctx.krl.SelectWhen.e("ee_between:b"), $ctx.krl.SelectWhen.e("ee_between:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("between");
        $ctx.log.debug("rule selected", { "rule_name": "between" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["between"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("between", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.notBetween($ctx.krl.SelectWhen.e("ee_not_between:a"), $ctx.krl.SelectWhen.e("ee_not_between:b"), $ctx.krl.SelectWhen.e("ee_not_between:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("not_between");
        $ctx.log.debug("rule selected", { "rule_name": "not_between" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["not between"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("not_between", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_andor:a"), $ctx.krl.SelectWhen.e("ee_andor:b")), $ctx.krl.SelectWhen.e("ee_andor:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("and_or");
        $ctx.log.debug("rule selected", { "rule_name": "and_or" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["(a and b) or c"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("and_or", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_orand:a"), $ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_orand:b"), $ctx.krl.SelectWhen.e("ee_orand:c"))), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("or_and");
        $ctx.log.debug("rule selected", { "rule_name": "or_and" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["a and (b or c)"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("or_and", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("ee_before_n:a"), $ctx.krl.SelectWhen.e("ee_before_n:b"), $ctx.krl.SelectWhen.e("ee_before_n:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("before_n");
        $ctx.log.debug("rule selected", { "rule_name": "before_n" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["before_n"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("before_n", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.after($ctx.krl.SelectWhen.e("ee_after_n:a"), $ctx.krl.SelectWhen.e("ee_after_n:b"), $ctx.krl.SelectWhen.e("ee_after_n:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("after_n");
        $ctx.log.debug("rule selected", { "rule_name": "after_n" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["after_n"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("after_n", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.then($ctx.krl.SelectWhen.e("ee_then_n:a"), $ctx.krl.SelectWhen.e("ee_then_n:b"), $ctx.krl.SelectWhen.e("ee_then_n:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("then_n");
        $ctx.log.debug("rule selected", { "rule_name": "then_n" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["then_n"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("then_n", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_and_n:a"), $ctx.krl.SelectWhen.e("ee_and_n:b"), $ctx.krl.SelectWhen.e("ee_and_n:c")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("and_n");
        $ctx.log.debug("rule selected", { "rule_name": "and_n" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["and_n"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("and_n", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("ee_or_n:a"), $ctx.krl.SelectWhen.e("ee_or_n:b"), $ctx.krl.SelectWhen.e("ee_or_n:c"), $ctx.krl.SelectWhen.e("ee_or_n:d")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("or_n");
        $ctx.log.debug("rule selected", { "rule_name": "or_n" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["or_n"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("or_n", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.any(2, $ctx.krl.SelectWhen.e("ee_any:a"), $ctx.krl.SelectWhen.e("ee_any:b"), $ctx.krl.SelectWhen.e("ee_any:c"), $ctx.krl.SelectWhen.e("ee_any:d")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("any");
        $ctx.log.debug("rule selected", { "rule_name": "any" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["any"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("any", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.count(3, $ctx.krl.SelectWhen.e("ee_count:a")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("count");
        $ctx.log.debug("rule selected", { "rule_name": "count" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["count"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("count", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat");
        $ctx.log.debug("rule selected", { "rule_name": "repeat" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["repeat"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("repeat", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("count_max");
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
        $ctx.recordRuleOutcome("count_max", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_min");
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
        $ctx.recordRuleOutcome("repeat_min", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_sum");
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
        $ctx.recordRuleOutcome("repeat_sum", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_avg");
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
        $ctx.recordRuleOutcome("repeat_avg", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_push");
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
        $ctx.recordRuleOutcome("repeat_push", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_push_multi");
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
        $ctx.recordRuleOutcome("repeat_push_multi", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("repeat_sum_multi");
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
        $ctx.recordRuleOutcome("repeat_sum_multi", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("ee_or_duppath:a"), $ctx.krl.SelectWhen.e("ee_or_duppath:a")), $ctx.krl.SelectWhen.e("ee_or_duppath:a")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("or_duppath");
        $ctx.log.debug("rule selected", { "rule_name": "or_duppath" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["(a before a) or a"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("or_duppath", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.notBetween($ctx.krl.SelectWhen.e("ee_notbet_duppath:a"), $ctx.krl.SelectWhen.e("ee_notbet_duppath:b"), $ctx.krl.SelectWhen.e("ee_notbet_duppath:a")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("notbet_duppath");
        $ctx.log.debug("rule selected", { "rule_name": "notbet_duppath" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["a not between (b, a)"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("notbet_duppath", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_b:a"), $ctx.krl.SelectWhen.e("ee_ab_or_b:b")), $ctx.krl.SelectWhen.e("ee_ab_or_b:b")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("ab_or_b");
        $ctx.log.debug("rule selected", { "rule_name": "ab_or_b" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["(a and b) or b"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("ab_or_b", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_ca:a"), $ctx.krl.SelectWhen.e("ee_ab_or_ca:b")), $ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("ee_ab_or_ca:c"), $ctx.krl.SelectWhen.e("ee_ab_or_ca:a"))), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("ab_or_ca");
        $ctx.log.debug("rule selected", { "rule_name": "ab_or_ca" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["(a and b) or (c and a)"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("ab_or_ca", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {};
    const $rulesetKrlSource = "ruleset io.picolabs.event-exp {\n    rule before {\n        select when ee_before a\n            before\n            ee_before b\n\n        send_directive(\"before\");\n    }\n    rule after {\n        select when ee_after a\n            after\n            ee_after b\n\n        send_directive(\"after\");\n    }\n    rule then {\n        select when ee_then a\n            then\n            ee_then b name re#bob#\n\n        send_directive(\"then\");\n    }\n    rule and {\n        select when ee_and a\n            and\n            ee_and b\n\n        send_directive(\"and\");\n    }\n    rule or {\n        select when ee_or a\n            or\n            ee_or b\n\n        send_directive(\"or\");\n    }\n    rule between {\n        select when ee_between a between(\n            ee_between b,\n            ee_between c\n        )\n\n        send_directive(\"between\");\n    }\n    rule not_between {\n        select when ee_not_between a not between(\n            ee_not_between b,\n            ee_not_between c\n        )\n\n        send_directive(\"not between\");\n    }\n    rule and_or {\n        select when (\n                ee_andor a\n                and\n                ee_andor b\n            )\n            or\n            ee_andor c\n\n        send_directive(\"(a and b) or c\");\n    }\n    rule or_and {\n        select when ee_orand a\n            and\n            (\n                ee_orand b\n                or\n                ee_orand c\n            )\n\n        send_directive(\"a and (b or c)\");\n    }\n    rule before_n {\n        select when before(\n            ee_before_n a,\n            ee_before_n b,\n            ee_before_n c\n        )\n\n        send_directive(\"before_n\");\n    }\n    rule after_n {\n        select when after(\n            ee_after_n a,\n            ee_after_n b,\n            ee_after_n c\n        )\n\n        send_directive(\"after_n\");\n    }\n    rule then_n {\n        select when then(\n            ee_then_n a,\n            ee_then_n b,\n            ee_then_n c\n        )\n\n        send_directive(\"then_n\");\n    }\n    rule and_n {\n        select when and(\n            ee_and_n a,\n            ee_and_n b,\n            ee_and_n c\n        )\n\n        send_directive(\"and_n\");\n    }\n    rule or_n {\n        select when or(\n            ee_or_n a,\n            ee_or_n b,\n            ee_or_n c,\n            ee_or_n d\n        )\n\n        send_directive(\"or_n\");\n    }\n    rule any {\n        select when any 2 (\n            ee_any a,\n            ee_any b,\n            ee_any c,\n            ee_any d\n        )\n\n        send_directive(\"any\");\n    }\n    rule count {\n        select when count 3 (\n            ee_count a\n        )\n\n        send_directive(\"count\");\n    }\n    rule repeat {\n        select when repeat 3 (\n            ee_repeat a name re#bob#\n        )\n\n        send_directive(\"repeat\");\n    }\n    rule count_max {\n        select when count 3 (\n            ee_count_max a b re#(\\d+)#\n        ) max(m)\n\n        send_directive(\"count_max\", {\"m\": m});\n    }\n    rule repeat_min {\n        select when repeat 3 (\n            ee_repeat_min a b re#(\\d+)#\n        ) min(m)\n\n        send_directive(\"repeat_min\", {\"m\": m});\n    }\n    rule repeat_sum {\n        select when repeat 3 (\n            ee_repeat_sum a b re#(\\d+)#\n        ) sum(m)\n\n        send_directive(\"repeat_sum\", {\"m\": m});\n    }\n    rule repeat_avg {\n        select when repeat 3 (\n            ee_repeat_avg a b re#(\\d+)#\n        ) avg(m)\n\n        send_directive(\"repeat_avg\", {\"m\": m});\n    }\n    rule repeat_push {\n        select when repeat 3 (\n            ee_repeat_push a b re#(\\d+)#\n        ) push(m)\n\n        send_directive(\"repeat_push\", {\"m\": m});\n    }\n    rule repeat_push_multi {\n        select when repeat 5 (\n            ee_repeat_push_multi a\n                a re#(\\d+)#\n                b re#(\\d+) (.*)#\n        ) push(a, b, c, d)\n\n        send_directive(\"repeat_push_multi\", {\n            \"a\": a,\n            \"b\": b,\n            \"c\": c,\n            \"d\": d\n        });\n    }\n    rule repeat_sum_multi {\n        select when repeat 3 (\n            ee_repeat_sum_multi a\n                a re#(\\d+)#\n                b re#(\\d+)#\n        ) sum(a, b)\n\n        send_directive(\"repeat_sum_multi\", {\n            \"a\": a,\n            \"b\": b\n        });\n    }\n    rule or_duppath {\n        select when (\n                ee_or_duppath a\n                before\n                ee_or_duppath a\n            )\n            or\n            ee_or_duppath a\n\n        send_directive(\"(a before a) or a\");\n    }\n    rule notbet_duppath {\n        select when ee_notbet_duppath a not between(\n            ee_notbet_duppath b,\n            ee_notbet_duppath a\n        )\n\n        send_directive(\"a not between (b, a)\");\n    }\n    rule ab_or_b {\n        select when (\n                ee_ab_or_b a\n                and\n                ee_ab_or_b b\n            )\n            or\n            ee_ab_or_b b\n\n        send_directive(\"(a and b) or b\");\n    }\n    rule ab_or_ca {\n        select when (\n                ee_ab_or_ca a\n                and\n                ee_ab_or_ca b\n            )\n            or\n            (\n                ee_ab_or_ca c\n                and\n                ee_ab_or_ca a\n            )\n\n        send_directive(\"(a and b) or (c and a)\");\n    }\n}\n";
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
