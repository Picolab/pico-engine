module.exports = {
  "rid": "io.picolabs.module-used",
  "version": "draft",
  "meta": {
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_dflt"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_conf",
        "with": ["configured_name"]
      }
    ],
    "shares": [
      "now",
      "getEntVal",
      "dfltName"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    await $ctx.useModule("io.picolabs.module-defined", "my_module_dflt");
    await $ctx.useModule("io.picolabs.module-defined", "my_module_conf", { "configured_name": "Jim" });
    const now1 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("time")["now"])($ctx, []);
    });
    const getEntVal1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("val");
    });
    const dfltName1 = await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []);
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_name"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "dflt_name" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "dflt_name",
          { "name": await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_name"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "conf_name" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "conf_name",
          { "name": await $ctx.krl.assertFunction($ctx.module("my_module_conf")["getName"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_info"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "dflt_info" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "dflt_info",
          { "info": await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getInfo"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_info"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "conf_info" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "conf_info",
          { "info": await $ctx.krl.assertFunction($ctx.module("my_module_conf")["getInfo"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_getInfoAction"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "dflt_getInfoAction" });
      var $fired = true;
      if ($fired) {
        var info2 = await $ctx.krl.assertAction($ctx.module("my_module_dflt")["getInfoAction"])($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("val", info2);
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_getInfoAction"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "conf_getInfoAction" });
      var $fired = true;
      if ($fired) {
        var info2 = await $ctx.krl.assertAction($ctx.module("my_module_conf")["getInfoAction"])($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("val", info2);
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:sayHelloWithOperator"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "sayHelloWithOperator" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["sayHello"]($ctx))($ctx, ["bob"])]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:uninstall"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "uninstall" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("ctx")["uninstall"])($ctx, ["io.picolabs.module-defined"]);
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
        "now": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return now1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getEntVal": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getEntVal1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "dfltName": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return dfltName1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "now",
                "args": []
              },
              {
                "name": "getEntVal",
                "args": []
              },
              {
                "name": "dfltName",
                "args": []
              }
            ],
            "events": [
              {
                "domain": "module_used",
                "name": "dflt_name",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "conf_name",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "dflt_info",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "conf_info",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "dflt_getInfoAction",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "conf_getInfoAction",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "sayHelloWithOperator",
                "attrs": []
              },
              {
                "domain": "module_used",
                "name": "uninstall",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};