module.exports = {
  "rid": "io.picolabs.error",
  "meta": { "shares": ["getErrors"] },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const append1 = $stdlib["append"];
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [{
          "name": "getErrors",
          "args": []
        }],
      "events": [
        {
          "domain": "system",
          "name": "error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "continue_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "continue_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "stop_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "stop_on_error",
          "attrs": []
        }
      ]
    };
    const getErrors2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("error_log");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("system:error"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("error_handle");
        $ctx.log.debug("rule selected", { "rule_name": "error_handle" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("error_handle", $fired);
        if ($fired) {
          await $ctx.rsCtx.putEnt("error_log", await append1($ctx, [
            await $ctx.rsCtx.getEnt("error_log"),
            $ctx.module("event")["attrs"]($ctx)
          ]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:continue_on_error"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("continue_on_errorA");
        $ctx.log.debug("rule selected", { "rule_name": "continue_on_errorA" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["continue_on_errorA"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("continue_on_errorA", $fired);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "debug",
          "data": "continue_on_errorA debug",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorA",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "info",
          "data": "continue_on_errorA info",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorA",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "warn",
          "data": "continue_on_errorA warn",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorA",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:continue_on_error"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("continue_on_errorB");
        $ctx.log.debug("rule selected", { "rule_name": "continue_on_errorB" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["continue_on_errorB"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("continue_on_errorB", $fired);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "debug",
          "data": "continue_on_errorB debug",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorB",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "info",
          "data": "continue_on_errorB info",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorB",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "warn",
          "data": "continue_on_errorB warn",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "continue_on_errorB",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:stop_on_error"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("stop_on_errorA");
        $ctx.log.debug("rule selected", { "rule_name": "stop_on_errorA" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["stop_on_errorA"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("stop_on_errorA", $fired);
        {
          $last();
          $ctx.rsCtx.clearSchedule();
          await $ctx.rsCtx.raiseEvent("system", "error", {
            "level": "error",
            "data": "stop_on_errorA 1",
            "rid": $ctx.rsCtx.ruleset.rid,
            "rule_name": "stop_on_errorA",
            "genus": "user"
          }, $ctx.rsCtx.ruleset.rid);
          return;
        }
        {
          $last();
          $ctx.rsCtx.clearSchedule();
          await $ctx.rsCtx.raiseEvent("system", "error", {
            "level": "error",
            "data": "stop_on_errorA 2 this should not fire b/c the first error stops execution",
            "rid": $ctx.rsCtx.ruleset.rid,
            "rule_name": "stop_on_errorA",
            "genus": "user"
          }, $ctx.rsCtx.ruleset.rid);
          return;
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:stop_on_error"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("stop_on_errorB");
        $ctx.log.debug("rule selected", { "rule_name": "stop_on_errorB" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["stop_on_errorB"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("stop_on_errorB", $fired);
        {
          $last();
          $ctx.rsCtx.clearSchedule();
          await $ctx.rsCtx.raiseEvent("system", "error", {
            "level": "error",
            "data": "stop_on_errorB 3 this should not fire b/c the first error clears the schedule",
            "rid": $ctx.rsCtx.ruleset.rid,
            "rule_name": "stop_on_errorB",
            "genus": "user"
          }, $ctx.rsCtx.ruleset.rid);
          return;
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = { "getErrors": getErrors2 };
    const $rulesetKrlSource = "ruleset io.picolabs.error {\n    meta {\n        shares getErrors\n    }\n    global {\n        getErrors = function(){\n            ent:error_log;\n        }\n    }\n    rule error_handle {\n        select when system error\n        fired {\n            ent:error_log := ent:error_log.append(event:attrs)\n        }\n    }\n    rule continue_on_errorA {\n        select when error continue_on_error\n\n        send_directive(\"continue_on_errorA\");\n\n        always {\n            error debug \"continue_on_errorA debug\";\n            error info \"continue_on_errorA info\";\n            error warn \"continue_on_errorA warn\"\n        }\n    }\n    rule continue_on_errorB {\n        select when error continue_on_error\n\n        send_directive(\"continue_on_errorB\");\n\n        always {\n            error debug \"continue_on_errorB debug\";\n            error info \"continue_on_errorB info\";\n            error warn \"continue_on_errorB warn\"\n        }\n    }\n    rule stop_on_errorA {\n        select when error stop_on_error\n\n        send_directive(\"stop_on_errorA\");\n\n        always {\n            error error \"stop_on_errorA 1\";\n            error error \"stop_on_errorA 2 this should not fire b/c the first error stops execution\"\n        }\n    }\n    rule stop_on_errorB {\n        select when error stop_on_error\n\n        send_directive(\"stop_on_errorB\");\n\n        always {\n            error error \"stop_on_errorB 3 this should not fire b/c the first error clears the schedule\"\n        }\n    }\n}\n";
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
        "getErrors": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getErrors2($ctx, query.args);
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
