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
    const reduce = $stdlib["reduce"];
    const map = $stdlib["map"];
    const send_directive = $stdlib["send_directive"];
    const g0 = "global 0";
    const g1 = 1;
    const getVals = $env.krl.Function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("ent_var_name"),
        "p0": await $ctx.rsCtx.getEnt("ent_var_p0"),
        "p1": await $ctx.rsCtx.getEnt("ent_var_p1")
      };
    });
    const add = $env.krl.Function([
      "a",
      "b"
    ], async function (a, b) {
      return await $stdlib["+"]($ctx, [
        a,
        b
      ]);
    });
    const sum = $env.krl.Function(["arr"], async function (arr) {
      return await $env.krl.assertFunction(reduce)($ctx, [
        arr,
        add,
        0
      ]);
    });
    const incByN = $env.krl.Function(["n"], async function (n) {
      return $env.krl.Function(["a"], async function (a) {
        return await $stdlib["+"]($ctx, [
          a,
          n
        ]);
      });
    });
    const mapped = await $env.krl.assertFunction(map)($ctx, [
      [
        1,
        2,
        3
      ],
      $env.krl.Function(["n"], async function (n) {
        return await $stdlib["+"]($ctx, [
          n,
          g1
        ]);
      })
    ]);
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.or($env.SelectWhen.e("scope:eventOr0", async function ($event, $state) {
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
      var name0 = setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventOr1", async function ($event, $state) {
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
      var name1 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var name0 = $state.setting["name0"];
      var name1 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "eventOr",
          {
            "name0": name0,
            "name1": name1
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.and($env.SelectWhen.e("scope:eventAnd0", async function ($event, $state) {
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
      var name0 = setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventAnd1", async function ($event, $state) {
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
      var name1 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state, $last) {
      var name0 = $state.setting["name0"];
      var name1 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "eventAnd",
          {
            "name0": name0,
            "name1": name1
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.within(1 * 1000, $env.SelectWhen.and($env.SelectWhen.or($env.SelectWhen.e("scope:eventWithin0"), $env.SelectWhen.e("scope:eventWithin1", async function ($event, $state) {
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
      var name1 = setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), $env.SelectWhen.or($env.SelectWhen.e("scope:eventWithin2", async function ($event, $state) {
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
      var name2 = setting["name2"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventWithin3"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      var name1 = $state.setting["name1"];
      var name2 = $state.setting["name2"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "eventWithin",
          {
            "name1": name1,
            "name2": name2
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("scope:prelude", async function ($event, $state) {
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
      var name = setting["name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      var name = $state.setting["name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      const p0 = "prelude 0";
      const p1 = "prelude 1";
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "say",
          {
            "name": name,
            "p0": p0,
            "p1": p1,
            "g0": g0
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("ent_var_name", name);
      await $ctx.rsCtx.putEnt("ent_var_p0", p0);
      await $ctx.rsCtx.putEnt("ent_var_p1", p1);
    });
    $rs.when($env.SelectWhen.e("scope:functions"), async function ($event, $state, $last) {
      const g0 = "overrided g0!";
      const inc5 = await $env.krl.assertFunction(incByN)($ctx, [5]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "say",
          {
            "add_one_two": await $env.krl.assertFunction(add)($ctx, [
              1,
              2
            ]),
            "inc5_3": await $env.krl.assertFunction(inc5)($ctx, [3]),
            "g0": g0
          }
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
        "g0": function ($args) {
          return g0;
        },
        "g1": function ($args) {
          return g1;
        },
        "getVals": function ($args) {
          return getVals($ctx, $args);
        },
        "add": function ($args) {
          return add($ctx, $args);
        },
        "sum": function ($args) {
          return sum($ctx, $args);
        },
        "mapped": function ($args) {
          return mapped;
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
              }
            ]
          };
        }
      }
    };
  }
};