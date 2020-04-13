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
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const configured_name = $env.configure("configured_name", "Bob");
    const send_directive = $stdlib["send_directive"];
    const privateFn = $env.krl.Function([], async function () {
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            "privateFn = name: ",
            configured_name
          ]),
          " memo: "
        ]),
        await $ctx.rsCtx.getEnt("memo")
      ]);
    });
    const getName = $env.krl.Function([], async function () {
      return configured_name;
    });
    const getInfo = $env.krl.Function([], async function () {
      return {
        "name": await $env.krl.assertFunction(getName)($ctx, []),
        "memo": await $ctx.rsCtx.getEnt("memo"),
        "privateFn": await $env.krl.assertFunction(privateFn)($ctx, [])
      };
    });
    const getInfoAction = $env.krl.Action([], async function () {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "getInfoAction",
          await $env.krl.assertFunction(getInfo)($ctx, [])
        ]);
      }
      return {
        "name": await $stdlib["get"]($ctx, [
          await $env.krl.assertFunction(getInfo)($ctx, []),
          ["name"]
        ])
      };
    });
    const sayHello = $env.krl.Function(["name"], async function ($name$) {
      return "hello " + await $stdlib["as"]($ctx, [
        $name$,
        "String"
      ]) + ".";
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("module_defined:store_memo", async function ($event, $state) {
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
      var text = setting["text"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      var text = $state.setting["text"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "store_memo",
          {
            "name": configured_name,
            "memo_to_store": text
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
              text
            ]),
            "\" by "
          ]),
          configured_name
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
        "getInfo": function ($args) {
          return getInfo($ctx, $args);
        },
        "__testing": function () {
          return {
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
        }
      },
      "provides": {
        "getInfo": getInfo,
        "getName": getName,
        "getInfoAction": getInfoAction
      }
    };
  }
};
