module.exports = {
  "rid": "io.picolabs.schedule",
  "meta": {
    "shares": [
      "getLog",
      "listScheduled"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const append1 = $stdlib["append"];
    const __testing1 = {
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
    const getLog2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("log");
    });
    const listScheduled2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("schedule")["list"])($ctx, []);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("schedule:clear_log"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("clear_log");
        $ctx.log.debug("rule selected", { "rule_name": "clear_log" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["clear_log"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("clear_log", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("log", []);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:push_log"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("push_log");
        $ctx.log.debug("rule selected", { "rule_name": "push_log" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["push_log"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("push_log", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("log"),
            $ctx.module("event")["attrs"]($ctx)
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:in_5min"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("in_5min");
        $ctx.log.debug("rule selected", { "rule_name": "in_5min" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["in_5min"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("in_5min", $fired);
        if ($fired) {
          var foo3 = await $ctx.module("schedule")["at"]($ctx, {
            "eci": $event.eci,
            "attrs": {
              "from": "in_5min",
              "name": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "name"
              ])
            },
            "domain": "schedule",
            "name": "push_log",
            "time": await $ctx.krl.assertFunction($ctx.module("time")["add"])($ctx, [
              await $ctx.krl.assertFunction($ctx.module("time")["now"])($ctx, []),
              { "minutes": 5 }
            ])
          });
          await $ctx.rsCtx.putEnt("log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("log"),
            { "scheduled in_5min": foo3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:every_1min"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("every_1min");
        $ctx.log.debug("rule selected", { "rule_name": "every_1min" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["every_1min"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("every_1min", $fired);
        if ($fired) {
          var foo3 = await $ctx.module("schedule")["repeat"]($ctx, {
            "eci": $event.eci,
            "attrs": {
              "from": "every_1min",
              "name": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "name"
              ])
            },
            "domain": "schedule",
            "name": "push_log",
            "timespec": "* */1 * * * *"
          });
          await $ctx.rsCtx.putEnt("log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("log"),
            { "scheduled every_1min": foo3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:rm_from_schedule"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("rm_from_schedule");
        $ctx.log.debug("rule selected", { "rule_name": "rm_from_schedule" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("schedule")["remove"])($ctx, [await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "id"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("rm_from_schedule", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:dynamic_at"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("dynamic_at");
        $ctx.log.debug("rule selected", { "rule_name": "dynamic_at" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("dynamic_at", $fired);
        if ($fired) {
          var foo3 = await $ctx.module("schedule")["at"]($ctx, {
            "eci": $event.eci,
            "attrs": {
              "from": "dynamic_at",
              "name": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "name"
              ])
            },
            "domainAndType": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "dn"
            ]),
            "time": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "at"
            ])
          });
          await $ctx.rsCtx.putEnt("log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("log"),
            { "scheduled dynamic_at": foo3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("schedule:dynamic_repeat"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("dynamic_repeat");
        $ctx.log.debug("rule selected", { "rule_name": "dynamic_repeat" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("dynamic_repeat", $fired);
        if ($fired) {
          var foo3 = await $ctx.module("schedule")["repeat"]($ctx, {
            "eci": $event.eci,
            "attrs": {
              "from": "dynamic_repeat",
              "name": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "name"
              ])
            },
            "domainAndType": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "dn"
            ]),
            "timespec": await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "timespec"
            ])
          });
          await $ctx.rsCtx.putEnt("log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("log"),
            { "scheduled dynamic_repeat": foo3 }
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {
      "getLog": getLog2,
      "listScheduled": listScheduled2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.schedule {\n    meta {\n        shares getLog, listScheduled\n    }\n    global {\n        getLog = function(){\n            ent:log;\n        }\n        listScheduled = function(){\n            schedule:list();\n        }\n    }\n    rule clear_log {\n        select when schedule clear_log\n\n        send_directive(\"clear_log\");\n\n        fired {\n            ent:log := []\n        }\n    }\n    rule push_log {\n        select when schedule push_log\n\n        send_directive(\"push_log\");\n\n        fired {\n            ent:log := ent:log.append(event:attrs)\n        }\n    }\n    rule in_5min {\n        select when schedule in_5min\n\n        send_directive(\"in_5min\");\n\n        fired {\n            schedule schedule event \"push_log\"\n                at time:add(time:now(), {\"minutes\": 5})\n                attributes {\n                    \"from\": \"in_5min\",\n                    \"name\": event:attrs{\"name\"}\n                }\n                setting(foo);\n            ent:log := ent:log.append({\"scheduled in_5min\": foo})\n        }\n    }\n    rule every_1min {\n        select when schedule every_1min\n\n        send_directive(\"every_1min\");\n\n        fired {\n            schedule schedule event \"push_log\"\n                repeat \"* */1 * * * *\"\n                attributes {\n                    \"from\": \"every_1min\",\n                    \"name\": event:attrs{\"name\"}\n                }\n                setting(foo);\n            ent:log := ent:log.append({\"scheduled every_1min\": foo})\n        }\n    }\n    rule rm_from_schedule {\n        select when schedule rm_from_schedule\n\n        schedule:remove(event:attrs{\"id\"});\n    }\n    rule dynamic_at {\n        select when schedule dynamic_at\n        fired {\n            schedule event event:attrs{\"dn\"}\n                at event:attrs{\"at\"}\n                attributes {\n                    \"from\": \"dynamic_at\",\n                    \"name\": event:attrs{\"name\"}\n                }\n                setting(foo);\n            ent:log := ent:log.append({\"scheduled dynamic_at\": foo})\n        }\n    }\n    rule dynamic_repeat {\n        select when schedule dynamic_repeat\n        fired {\n            schedule event event:attrs{\"dn\"}\n                repeat event:attrs{\"timespec\"}\n                attributes {\n                    \"from\": \"dynamic_repeat\",\n                    \"name\": event:attrs{\"name\"}\n                }\n                setting(foo);\n            ent:log := ent:log.append({\"scheduled dynamic_repeat\": foo})\n        }\n    }\n}\n";
    const $compileEvalExpression = $ctx["compileEvalExpression"];
    const $consoleEvalCache = new Map();
    const $runConsoleEval = async expr => {
      let runner = $consoleEvalCache.get(expr);
      if (!runner) {
        runner = $compileEvalExpression(expr, { rulesetKrl: $rulesetKrlSource }).run;
        $consoleEvalCache.set(expr, runner);
      }
      return await runner($ctx, $consoleGlobalRefs);
    };
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return {
          "directives": $ctx.drainDirectives(),
          "ruleOutcomes": $ctx.drainRuleOutcomes()
        };
      },
      "query": {
        "getLog": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getLog2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "listScheduled": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await listScheduled2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        },
        "__consoleEval": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await $runConsoleEval(query["args"]["expr"]);
          } finally {
            $ctx.setQuery(null);
          }
        }
      },
      "consoleGlobalRefs": $consoleGlobalRefs
    };
  }
};
