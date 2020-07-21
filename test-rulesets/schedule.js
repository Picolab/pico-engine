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
    const send_directive1 = $stdlib["send_directive"];
    const append1 = $stdlib["append"];
    const getLog1 = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("log");
    });
    const listScheduled1 = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction($ctx.module("schedule")["list"])($ctx, []);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("schedule:clear_log"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "clear_log" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["clear_log"]);
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
      $ctx.log.debug("rule selected", { "rule_name": "push_log" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["push_log"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append1)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          $event.data.attrs
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:in_5min"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "in_5min" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["in_5min"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo2 = await $ctx.module("schedule")["at"]($ctx, {
          "eci": $event.eci,
          "attrs": {
            "from": "in_5min",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "domain": "schedule",
          "name": "push_log",
          "time": await $env.krl.assertFunction($ctx.module("time")["add"])($ctx, [
            await $env.krl.assertFunction($ctx.module("time")["now"])($ctx, []),
            { "minutes": 5 }
          ])
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append1)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled in_5min": foo2 }
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:every_1min"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "every_1min" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["every_1min"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo2 = await $ctx.module("schedule")["repeat"]($ctx, {
          "eci": $event.eci,
          "attrs": {
            "from": "every_1min",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "domain": "schedule",
          "name": "push_log",
          "timespec": "* */1 * * * *"
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append1)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled every_1min": foo2 }
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:rm_from_schedule"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "rm_from_schedule" });
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
    $rs.when($env.SelectWhen.e("schedule:dynamic_at"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "dynamic_at" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo2 = await $ctx.module("schedule")["at"]($ctx, {
          "eci": $event.eci,
          "attrs": {
            "from": "dynamic_at",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "domainAndType": await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "dn"
          ]),
          "time": await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "at"
          ])
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append1)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled dynamic_at": foo2 }
        ]));
      }
    });
    $rs.when($env.SelectWhen.e("schedule:dynamic_repeat"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "dynamic_repeat" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        var foo2 = await $ctx.module("schedule")["repeat"]($ctx, {
          "eci": $event.eci,
          "attrs": {
            "from": "dynamic_repeat",
            "name": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "name"
            ])
          },
          "domainAndType": await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "dn"
          ]),
          "timespec": await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "timespec"
          ])
        });
        await $ctx.rsCtx.putEnt("log", await $env.krl.assertFunction(append1)($ctx, [
          await $ctx.rsCtx.getEnt("log"),
          { "scheduled dynamic_repeat": foo2 }
        ]));
      }
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
        "getLog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getLog1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "listScheduled": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return listScheduled1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
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
              },
              {
                "domain": "schedule",
                "name": "dynamic_at",
                "attrs": [
                  "name",
                  "dn",
                  "at"
                ]
              },
              {
                "domain": "schedule",
                "name": "dynamic_repeat",
                "attrs": [
                  "name",
                  "dn",
                  "timespec"
                ]
              }
            ]
          };
        }
      }
    };
  }
};