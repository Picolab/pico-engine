module.exports = {
  "rid": "io.picolabs.select_where",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": []
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("all");
        $ctx.log.debug("rule selected", { "rule_name": "all" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "all",
            {
              "domain": $ctx.module("event")["domain"]($ctx),
              "name": $ctx.module("event")["name"]($ctx),
              "attrs": $ctx.module("event")["attrs"]($ctx)
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("all", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": await $stdlib["=="]($ctx, [
          $ctx.module("event")["domain"]($ctx),
          "set"
        ]) && await $stdlib["=="]($ctx, [
          $ctx.module("event")["name"]($ctx),
          "watcher"
        ]),
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("set_watcher");
        $ctx.log.debug("rule selected", { "rule_name": "set_watcher" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("set_watcher", $fired);
        await $ctx.rsCtx.putEnt("watcher", await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "domain"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": await $stdlib["=="]($ctx, [
          $ctx.module("event")["domain"]($ctx),
          await $ctx.rsCtx.getEnt("watcher")
        ]),
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("watcher");
        $ctx.log.debug("rule selected", { "rule_name": "watcher" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["watcher matched!"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("watcher", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {};
    const $rulesetKrlSource = "ruleset io.picolabs.select_where {\n    rule all {\n        select where true\n\n        send_directive(\"all\", {\n            \"domain\": event:domain,\n            \"name\": event:name,\n            \"attrs\": event:attrs\n        });\n    }\n    rule set_watcher {\n        select where (event:domain == \"set\") && (event:name == \"watcher\")\n        always {\n            ent:watcher := event:attrs{\"domain\"}\n        }\n    }\n    rule watcher {\n        select where event:domain == ent:watcher\n\n        send_directive(\"watcher matched!\");\n    }\n}\n";
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
