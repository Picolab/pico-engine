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
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    $env.useModule("io.picolabs.module-defined", null, "my_module_dflt");
    $env.useModule("io.picolabs.module-defined", null, "my_module_conf", { "configured_name": "Jim" });
    const send_directive = $stdlib["send_directive"];
    const now = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction($ctx.module("time")["now"])($ctx, []);
    });
    const getEntVal = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("val");
    });
    const dfltName = await $env.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []);
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("module_used:dflt_name"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "dflt_name",
          { "name": await $env.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("module_used:conf_name"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "conf_name",
          { "name": await $env.krl.assertFunction($ctx.module("my_module_conf")["getName"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("module_used:dflt_info"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "dflt_info",
          { "info": await $env.krl.assertFunction($ctx.module("my_module_dflt")["getInfo"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("module_used:conf_info"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "conf_info",
          { "info": await $env.krl.assertFunction($ctx.module("my_module_conf")["getInfo"])($ctx, []) }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("module_used:dflt_getInfoAction"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        var info = await $env.krl.assertAction($ctx.module("my_module_dflt")["getInfoAction"])($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("val", info);
    });
    $rs.when($env.SelectWhen.e("module_used:conf_getInfoAction"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        var info = await $env.krl.assertAction($ctx.module("my_module_conf")["getInfoAction"])($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("val", info);
    });
    $rs.when($env.SelectWhen.e("module_used:sayHelloWithOperator"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [await $env.krl.assertFunction($ctx.module("my_module_dflt")["sayHello"]($ctx))($ctx, ["bob"])]);
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
        "now": function ($args) {
          return now($ctx, $args);
        },
        "getEntVal": function ($args) {
          return getEntVal($ctx, $args);
        },
        "dfltName": function ($args) {
          return dfltName;
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
              }
            ]
          };
        }
      }
    };
  }
};