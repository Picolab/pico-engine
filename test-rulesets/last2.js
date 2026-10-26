module.exports = {
  "rid": "io.picolabs.last2",
  "meta": { "name": "This second ruleset tests that `last` only stops the current ruleset" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "last",
          "name": "all",
          "attrs": []
        }]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo");
        $ctx.log.debug("rule selected", { "rule_name": "foo" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["last2 foo"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("foo", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {};
    const $rulesetKrlSource = "ruleset io.picolabs.last2 {\n    meta {\n        name \"This second ruleset tests that `last` only stops the current ruleset\"\n    }\n    rule foo {\n        select when last all\n\n        send_directive(\"last2 foo\");\n    }\n}\n";
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
