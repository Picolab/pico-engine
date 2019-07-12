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
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const reduce = $stdlib["reduce"];
    const map = $stdlib["map"];
    const g0 = "global 0";
    const g1 = 1;
    const getVals = $env.krl.function([], async function () {
      return {
        "name": await $ctx.rsCtx.getEnt("ent_var_name"),
        "p0": await $ctx.rsCtx.getEnt("ent_var_p0"),
        "p1": await $ctx.rsCtx.getEnt("ent_var_p1")
      };
    });
    const add = $env.krl.function([
      "a",
      "b"
    ], async function (a, b) {
      return await $stdlib["+"]($ctx, [
        a,
        b
      ]);
    });
    const sum = $env.krl.function(["arr"], async function (arr) {
      return await reduce($ctx, [
        arr,
        add,
        0
      ]);
    });
    const incByN = $env.krl.function(["n"], async function (n) {
      return $env.krl.function(["a"], async function (a) {
        return await $stdlib["+"]($ctx, [
          a,
          n
        ]);
      });
    });
    const mapped = await map($ctx, [
      [
        1,
        2,
        3
      ],
      $env.krl.function(["n"], async function (n) {
        return await $stdlib["+"]($ctx, [
          n,
          g1
        ]);
      })
    ]);
    const send_directive = $ctx.module("custom")["send_directive"];
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.or($env.SelectWhen.e("scope:eventOr0", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventOr1", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state) {
      var name0 = $state.setting["name0"];
      var name1 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive($ctx, [
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
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name0"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventAnd1", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), async function ($event, $state) {
      var name0 = $state.setting["name0"];
      var name1 = $state.setting["name1"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive($ctx, [
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
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name1"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), $env.SelectWhen.or($env.SelectWhen.e("scope:eventWithin2", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name2"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), $env.SelectWhen.e("scope:eventWithin3"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state) {
      var name1 = $state.setting["name1"];
      var name2 = $state.setting["name2"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await send_directive($ctx, [
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
      m = new RegExp("^(.*)$", "").exec($event.data.attrs["name"] == null ? "" : $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]));
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      setting["name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state) {
      var name = $state.setting["name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      const p0 = "prelude 0";
      const p1 = "prelude 1";
      var $fired = true;
      if ($fired) {
        await send_directive($ctx, [
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
    $rs.when($env.SelectWhen.e("scope:functions"), async function ($event, $state) {
      const g0 = "overrided g0!";
      const inc5 = await incByN($ctx, [5]);
      var $fired = true;
      if ($fired) {
        await send_directive($ctx, [
          "say",
          {
            "add_one_two": await add($ctx, [
              1,
              2
            ]),
            "inc5_3": await inc5($ctx, [3]),
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
      "event": async function (event) {
        await $rs.send(event);
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