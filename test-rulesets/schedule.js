module.exports = {
  "rid": "io.picolabs.schedule",
  "version": "draft",
  "meta": {
    "shares": [
      "getLog",
      "listScheduled"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const append = $stdlib["append"];
    const foo = $stdlib["foo"];
    const getLog = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("log");
    });
    const listScheduled = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction($ctx.module("schedule")["list"])($ctx, []);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("schedule:clear_log"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["clear_log"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("log", []);
      }
    });
    $rs.when($env.SelectWhen.e("schedule:push_log"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["push_log"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          $event.data.attrs
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:in_5min"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["in_5min"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo = await $ctx.module("schedule")["at"]($ctx, {
          "eci": $event.eci,
          "domain": "schedule",
          "name": "push_log",
          "attrs": {
            "from": "in_5min",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "time": await $env.krl.assertFunction($ctx.module("time")["add"])($ctx, [
            await $env.krl.assertFunction($ctx.module("time")["now"])($ctx, []),
            { "minutes": 5 }
          ])
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled in_5min": foo }
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:every_1min"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["every_1min"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo = await $ctx.module("schedule")["repeat"]($ctx, {
          "eci": $event.eci,
          "domain": "schedule",
          "name": "push_log",
          "attrs": {
            "from": "every_1min",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "timespec": "* */1 * * * *"
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled every_1min": foo }
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:rm_from_schedule"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction($ctx.module("schedule")["remove"])($ctx, [await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "id"
          ])]);
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
        "getLog": function ($args) {
          return getLog($ctx, $args);
        },
        "listScheduled": function ($args) {
          return listScheduled($ctx, $args);
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "getLog",
                "args": []
              },
              {
                "name": "listScheduled",
                "args": []
              }
            ],
            "events": [
              {
                "domain": "schedule",
                "name": "clear_log",
                "attrs": []
              },
              {
                "domain": "schedule",
                "name": "push_log",
                "attrs": []
              },
              {
                "domain": "schedule",
                "name": "in_5min",
                "attrs": ["name"]
              },
              {
                "domain": "schedule",
                "name": "every_1min",
                "attrs": ["name"]
              },
              {
                "domain": "schedule",
                "name": "rm_from_schedule",
                "attrs": ["id"]
              }
            ]
          };
        }
      }
    };
  }
};