module.exports = {
  "rid": "io.picolabs.log",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "log",
          "name": "levels",
          "attrs": []
        }]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("log:levels"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("levels");
        $ctx.log.debug("rule selected", { "rule_name": "levels" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("levels", $fired);
        if ($fired) {
          $ctx.log.info("hello default");
          $ctx.log.error("hello error");
          $ctx.log.warn("hello warn");
          $ctx.log.info("hello info");
          $ctx.log.debug("hello debug");
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {};
    const $rulesetKrlSource = "ruleset io.picolabs.log {\n    rule levels {\n        select when log levels\n        fired {\n            log info \"hello default\";\n            log error \"hello error\";\n            log warn \"hello warn\";\n            log info \"hello info\";\n            log debug \"hello debug\"\n        }\n    }\n}\n";
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
