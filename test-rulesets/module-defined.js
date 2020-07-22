module.exports = {
  "rid": "io.picolabs.module-defined",
  "version": "draft",
  "meta": {
    "provides": [
      "getInfo",
      "getName",
      "getInfoAction"
    ],
    "shares": ["getInfo"],
    "configure": ["configured_name"]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [{
          "name": "getInfo",
          "args": []
        }],
      "events": [{
          "domain": "module_defined",
          "name": "store_memo",
          "attrs": []
        }]
    };
    const configured_name2 = $ctx.configure("configured_name", "Bob");
    const privateFn2 = $ctx.krl.Function([], async function () {
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            "privateFn = name: ",
            configured_name2
          ]),
          " memo: "
        ]),
        await $ctx.rsCtx.getEnt("memo")
      ]);
    });
    const getName2 = $ctx.krl.Function([], async function () {
      return configured_name2;
    });
    const getInfo2 = $ctx.krl.Function([], async function () {
      return {
        "name": await $ctx.krl.assertFunction(getName2)($ctx, []),
        "memo": await $ctx.rsCtx.getEnt("memo"),
        "privateFn": await $ctx.krl.assertFunction(privateFn2)($ctx, [])
      };
    });
    const getInfoAction2 = $ctx.krl.Action([], async function () {
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)(this, [
          "getInfoAction",
          await $ctx.krl.assertFunction(getInfo2)($ctx, [])
        ]);
      }
      return {
        "name": await $stdlib["get"]($ctx, [
          await $ctx.krl.assertFunction(getInfo2)($ctx, []),
          ["name"]
        ])
      };
    });
    const sayHello2 = $ctx.krl.Function(["name"], async function ($name$3) {
      return "hello " + await $stdlib["as"]($ctx, [
        $name$3,
        "String"
      ]) + ".";
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("module_defined:store_memo", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "memo") ? $stdlib.as($ctx, [
        $event.data.attrs["memo"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var text3 = setting["text"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "store_memo" });
      var text3 = $state.setting["text"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "store_memo",
          {
            "name": configured_name2,
            "memo_to_store": text3
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("memo", await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            await $stdlib["+"]($ctx, [
              "[\"",
              text3
            ]),
            "\" by "
          ]),
          configured_name2
        ]),
        "]"
      ]));
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
        "getInfo": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getInfo2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        }
      },
      "provides": {
        "getInfo": getInfo2,
        "getName": getName2,
        "getInfoAction": getInfoAction2
      }
    };
  }
};