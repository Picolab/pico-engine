module.exports = {
  "rid": "io.picolabs.testing",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "say",
          "name": "hello",
          "attrs": ["name"]
        }]
    };
    const __testing2 = {
      "queries": [{ "name": "joke" }],
      "event": await $stdlib["get"]($ctx, [
        __testing1,
        ["events"]
      ])
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("say:hello"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("say_hello");
        $ctx.log.debug("rule selected", { "rule_name": "say_hello" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("say_hello", $fired);
        await $ctx.rsCtx.putEnt("said", await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "name"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = { "__testing": __testing2 };
    const $rulesetKrlSource = "ruleset io.picolabs.testing {\n    global {\n        __testing = {\n            \"queries\": [{\"name\": \"joke\"}],\n            \"event\": __testing[\"events\"]\n        }\n    }\n    rule say_hello {\n        select when say hello\n        always {\n            ent:said := event:attrs{\"name\"}\n        }\n    }\n}\n";
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
          return __testing2;
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
