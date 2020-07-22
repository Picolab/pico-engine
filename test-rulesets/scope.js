module.exports = {
  "rid": "io.picolabs.scope",
  "version": "draft",
  "meta": {
    "name": "testing scope",
    "shares": [
      "g0",
      "g1",
      "getVals",
      "add",
      "sum",
      "mapped"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const reduce1 = $stdlib["reduce"];
    const map1 = $stdlib["map"];
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [
        {
          "name": "g0",
          "args": []
        },
        {
          "name": "g1",
          "args": []
        },
        {
          "name": "getVals",
          "args": []
        },
        {
          "name": "add",
          "args": [
            "a",
            "b"
          ]
        },
        {
          "name": "sum",
          "args": ["arr"]
        },
        {
          "name": "mapped",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "scope",
          "name": "eventOr0",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventOr1",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventAnd0",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventAnd1",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventWithin0",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventWithin1",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventWithin2",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "eventWithin3",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "prelude",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "functions",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "shadow",
          "attrs": []
        },
        {
          "domain": "scope",
          "name": "recur",
          "attrs": []
        }
      ]
    };
    const g02 = "global 0";
    const g12 = 1;
    const getVals2 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("ent_var_name"),
        "p0": await $ctx.rsCtx.getEnt("ent_var_p0"),
        "p1": await $ctx.rsCtx.getEnt("ent_var_p1")
      };
    });
    const add2 = $ctx.krl.Function([
      "a",
      "b"
    ], async function (a3, b3) {
      return await $stdlib["+"]($ctx, [
        a3,
        b3
      ]);
    });
    const sum2 = $ctx.krl.Function(["arr"], async function (arr3) {
      return await $ctx.krl.assertFunction(reduce1)($ctx, [
        arr3,
        add2,
        0
      ]);
    });
    const incByN2 = $ctx.krl.Function(["n"], async function (n3) {
      return $ctx.krl.Function(["a"], async function (a4) {
        return await $stdlib["+"]($ctx, [
          a4,
          n3
        ]);
      });
    });
    const mapped2 = await $ctx.krl.assertFunction(map1)($ctx, [
      [
        1,
        2,
        3
      ],
      $ctx.krl.Function(["n"], async function (n3) {
        return await $stdlib["+"]($ctx, [
          n3,
          g12
        ]);
      })
    ]);
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("scope:eventOr0", async function ($event, $state) {
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
      var name03 = setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $ctx.krl.SelectWhen.e("scope:eventOr1", async function ($event, $state) {
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
      var name13 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventOr" });
      var name03 = $state.setting["name0"];
      var name13 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventOr",
          {
            "name0": name03,
            "name1": name13
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("scope:eventAnd0", async function ($event, $state) {
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
      var name03 = setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $ctx.krl.SelectWhen.e("scope:eventAnd1", async function ($event, $state) {
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
      var name13 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventAnd" });
      var name03 = $state.setting["name0"];
      var name13 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventAnd",
          {
            "name0": name03,
            "name1": name13
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.within(1 * 1000, $ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("scope:eventWithin0"), $ctx.krl.SelectWhen.e("scope:eventWithin1", async function ($event, $state) {
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
      var name13 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), $ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("scope:eventWithin2", async function ($event, $state) {
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
      var name23 = setting["name2"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $ctx.krl.SelectWhen.e("scope:eventWithin3"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventWithin" });
      var name13 = $state.setting["name1"];
      var name23 = $state.setting["name2"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventWithin",
          {
            "name1": name13,
            "name2": name23
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:prelude", async function ($event, $state) {
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
      var $name$3 = setting["name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "prelude_scope" });
      var $name$3 = $state.setting["name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      const p03 = "prelude 0";
      const p13 = "prelude 1";
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          {
            "name": $name$3,
            "p0": p03,
            "p1": p13,
            "g0": g02
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("ent_var_name", $name$3);
      await $ctx.rsCtx.putEnt("ent_var_p0", p03);
      await $ctx.rsCtx.putEnt("ent_var_p1", p13);
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:functions"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "functions" });
      const g03 = "overrided g0!";
      const inc53 = await $ctx.krl.assertFunction(incByN2)($ctx, [5]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          {
            "add_one_two": await $ctx.krl.assertFunction(add2)($ctx, [
              1,
              2
            ]),
            "inc5_3": await $ctx.krl.assertFunction(inc53)($ctx, [3]),
            "g0": g03
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:shadow"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "shadow" });
      const add3 = await $ctx.krl.assertFunction(add2)($ctx, [
        1,
        2
      ]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          { "add": add3 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:recur"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "recur" });
      const fact3 = $ctx.krl.Function(["n"], async function (n4) {
        return await $stdlib["<="]($ctx, [
          n4,
          1
        ]) ? 1 : await $stdlib["*"]($ctx, [
          n4,
          await $ctx.krl.assertFunction(fact3)($ctx, [await $stdlib["-"]($ctx, [
              n4,
              1
            ])])
        ]);
      });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          { "fact5": await $ctx.krl.assertFunction(fact3)($ctx, [5]) }
        ]);
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
        "g0": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return g02;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "g1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return g12;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getVals": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getVals2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "add": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return add2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "sum": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return sum2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "mapped": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return mapped2;
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