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
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const reduce1 = $stdlib["reduce"];
    const map1 = $stdlib["map"];
    const send_directive1 = $stdlib["send_directive"];
    const g01 = "global 0";
    const g11 = 1;
    const getVals1 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("ent_var_name"),
        "p0": await $ctx.rsCtx.getEnt("ent_var_p0"),
        "p1": await $ctx.rsCtx.getEnt("ent_var_p1")
      };
    });
    const add1 = $ctx.krl.Function([
      "a",
      "b"
    ], async function (a2, b2) {
      return await $stdlib["+"]($ctx, [
        a2,
        b2
      ]);
    });
    const sum1 = $ctx.krl.Function(["arr"], async function (arr2) {
      return await $ctx.krl.assertFunction(reduce1)($ctx, [
        arr2,
        add1,
        0
      ]);
    });
    const incByN1 = $ctx.krl.Function(["n"], async function (n2) {
      return $ctx.krl.Function(["a"], async function (a3) {
        return await $stdlib["+"]($ctx, [
          a3,
          n2
        ]);
      });
    });
    const mapped1 = await $ctx.krl.assertFunction(map1)($ctx, [
      [
        1,
        2,
        3
      ],
      $ctx.krl.Function(["n"], async function (n2) {
        return await $stdlib["+"]($ctx, [
          n2,
          g11
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
      var name02 = setting["name0"] = matches[0];
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
      var name12 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventOr" });
      var name02 = $state.setting["name0"];
      var name12 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventOr",
          {
            "name0": name02,
            "name1": name12
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
      var name02 = setting["name0"] = matches[0];
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
      var name12 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventAnd" });
      var name02 = $state.setting["name0"];
      var name12 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventAnd",
          {
            "name0": name02,
            "name1": name12
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
      var name12 = setting["name1"] = matches[0];
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
      var name22 = setting["name2"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $ctx.krl.SelectWhen.e("scope:eventWithin3"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "eventWithin" });
      var name12 = $state.setting["name1"];
      var name22 = $state.setting["name2"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "eventWithin",
          {
            "name1": name12,
            "name2": name22
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
      var $name$2 = setting["name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "prelude_scope" });
      var $name$2 = $state.setting["name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      const p02 = "prelude 0";
      const p12 = "prelude 1";
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          {
            "name": $name$2,
            "p0": p02,
            "p1": p12,
            "g0": g01
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("ent_var_name", $name$2);
      await $ctx.rsCtx.putEnt("ent_var_p0", p02);
      await $ctx.rsCtx.putEnt("ent_var_p1", p12);
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:functions"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "functions" });
      const g02 = "overrided g0!";
      const inc52 = await $ctx.krl.assertFunction(incByN1)($ctx, [5]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          {
            "add_one_two": await $ctx.krl.assertFunction(add1)($ctx, [
              1,
              2
            ]),
            "inc5_3": await $ctx.krl.assertFunction(inc52)($ctx, [3]),
            "g0": g02
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
      const add2 = await $ctx.krl.assertFunction(add1)($ctx, [
        1,
        2
      ]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          { "add": add2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("scope:recur"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "recur" });
      const fact2 = $ctx.krl.Function(["n"], async function (n3) {
        return await $stdlib["<="]($ctx, [
          n3,
          1
        ]) ? 1 : await $stdlib["*"]($ctx, [
          n3,
          await $ctx.krl.assertFunction(fact2)($ctx, [await $stdlib["-"]($ctx, [
              n3,
              1
            ])])
        ]);
      });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "say",
          { "fact5": await $ctx.krl.assertFunction(fact2)($ctx, [5]) }
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
            return g01;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "g1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return g11;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getVals": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getVals1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "add": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return add1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "sum": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return sum1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "mapped": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return mapped1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
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
        }
      }
    };
  }
};