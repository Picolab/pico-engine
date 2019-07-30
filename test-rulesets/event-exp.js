module.exports = {
  "rid": "io.picolabs.event-exp",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.before($env.SelectWhen.e("ee_before:a"), $env.SelectWhen.e("ee_before:b")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["before"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.after($env.SelectWhen.e("ee_after:a"), $env.SelectWhen.e("ee_after:b")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["after"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.then($env.SelectWhen.e("ee_then:a"), $env.SelectWhen.e("ee_then:b", async function ($event, $state) {
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
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["then"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.and($env.SelectWhen.e("ee_and:a"), $env.SelectWhen.e("ee_and:b")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["and"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.e("ee_or:a"), $env.SelectWhen.e("ee_or:b")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["or"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.between($env.SelectWhen.e("ee_between:a"), $env.SelectWhen.e("ee_between:b"), $env.SelectWhen.e("ee_between:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["between"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.notBetween($env.SelectWhen.e("ee_not_between:a"), $env.SelectWhen.e("ee_not_between:b"), $env.SelectWhen.e("ee_not_between:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["not between"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.and($env.SelectWhen.e("ee_andor:a"), $env.SelectWhen.e("ee_andor:b")), $env.SelectWhen.e("ee_andor:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["(a and b) or c"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.and($env.SelectWhen.e("ee_orand:a"), $env.SelectWhen.or($env.SelectWhen.e("ee_orand:b"), $env.SelectWhen.e("ee_orand:c"))), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["a and (b or c)"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.before($env.SelectWhen.e("ee_before_n:a"), $env.SelectWhen.e("ee_before_n:b"), $env.SelectWhen.e("ee_before_n:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["before_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.after($env.SelectWhen.e("ee_after_n:a"), $env.SelectWhen.e("ee_after_n:b"), $env.SelectWhen.e("ee_after_n:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["after_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.then($env.SelectWhen.e("ee_then_n:a"), $env.SelectWhen.e("ee_then_n:b"), $env.SelectWhen.e("ee_then_n:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["then_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.and($env.SelectWhen.e("ee_and_n:a"), $env.SelectWhen.e("ee_and_n:b"), $env.SelectWhen.e("ee_and_n:c")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["and_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.e("ee_or_n:a"), $env.SelectWhen.e("ee_or_n:b"), $env.SelectWhen.e("ee_or_n:c"), $env.SelectWhen.e("ee_or_n:d")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["or_n"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.any(2, $env.SelectWhen.e("ee_any:a"), $env.SelectWhen.e("ee_any:b"), $env.SelectWhen.e("ee_any:c"), $env.SelectWhen.e("ee_any:d")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["any"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.count(3, $env.SelectWhen.e("ee_count:a")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["count"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat:a", async function ($event, $state) {
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
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["repeat"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.count(3, $env.SelectWhen.e("ee_count_max:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "max", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var m = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "count_max",
          { "m": m }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat_min:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "min", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var m = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_min",
          { "m": m }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat_sum:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "sum", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var m = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_sum",
          { "m": m }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat_avg:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "avg", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var m = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_avg",
          { "m": m }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat_push:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "push", [[
          "m",
          matches[0]
        ]]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var m = $state.setting["m"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_push",
          { "m": m }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(5, $env.SelectWhen.e("ee_repeat_push_multi:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "push", [
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
      var a = $state.setting["a"];
      var b = $state.setting["b"];
      var c = $state.setting["c"];
      var d = $state.setting["d"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_push_multi",
          {
            "a": a,
            "b": b,
            "c": c,
            "d": d
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.repeat(3, $env.SelectWhen.e("ee_repeat_sum_multi:a", async function ($event, $state) {
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
      $state = await $ctx.aggregateEvent($state, "sum", [
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
      var a = $state.setting["a"];
      var b = $state.setting["b"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "repeat_sum_multi",
          {
            "a": a,
            "b": b
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.before($env.SelectWhen.e("ee_or_duppath:a"), $env.SelectWhen.e("ee_or_duppath:a")), $env.SelectWhen.e("ee_or_duppath:a")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["(a before a) or a"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.notBetween($env.SelectWhen.e("ee_notbet_duppath:a"), $env.SelectWhen.e("ee_notbet_duppath:b"), $env.SelectWhen.e("ee_notbet_duppath:a")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["a not between (b, a)"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.and($env.SelectWhen.e("ee_ab_or_b:a"), $env.SelectWhen.e("ee_ab_or_b:b")), $env.SelectWhen.e("ee_ab_or_b:b")), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["(a and b) or b"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.or($env.SelectWhen.and($env.SelectWhen.e("ee_ab_or_ca:a"), $env.SelectWhen.e("ee_ab_or_ca:b")), $env.SelectWhen.and($env.SelectWhen.e("ee_ab_or_ca:c"), $env.SelectWhen.e("ee_ab_or_ca:a"))), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["(a and b) or (c and a)"]);
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
          return {
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
                "attrs": []
              },
              {
                "domain": "ee_then",
                "name": "b",
                "attrs": []
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
                "attrs": []
              },
              {
                "domain": "ee_count_max",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_min",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_sum",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_avg",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_push",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_push_multi",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "ee_repeat_sum_multi",
                "name": "a",
                "attrs": []
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
        }
      }
    };
  }
};