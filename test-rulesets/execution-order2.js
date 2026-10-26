module.exports = {
  "rid": "io.picolabs.execution-order2",
  "meta": { "shares": ["getOrder"] },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const append1 = $stdlib["append"];
    const __testing1 = {
      "queries": [{
          "name": "getOrder",
          "args": []
        }],
      "events": [
        {
          "domain": "execution_order",
          "name": "reset_order",
          "attrs": []
        },
        {
          "domain": "execution_order",
          "name": "foo",
          "attrs": []
        },
        {
          "domain": "execution_order",
          "name": "bar",
          "attrs": []
        },
        {
          "domain": "execution_order",
          "name": "foo",
          "attrs": []
        },
        {
          "domain": "execution_order",
          "name": "bar",
          "attrs": []
        }
      ]
    };
    const getOrder2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("order");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("execution_order:reset_order"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("reset_order");
        $ctx.log.debug("rule selected", { "rule_name": "reset_order" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["2 - reset_order"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("reset_order", $fired);
        await $ctx.rsCtx.putEnt("order", []);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("execution_order:foo"), $ctx.krl.SelectWhen.e("execution_order:bar")), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo_or_bar");
        $ctx.log.debug("rule selected", { "rule_name": "foo_or_bar" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["2 - foo_or_bar"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("foo_or_bar", $fired);
        await $ctx.rsCtx.putEnt("order", await append1($ctx, [
          await $ctx.rsCtx.getEnt("order"),
          "2 - foo_or_bar"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("execution_order:foo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo");
        $ctx.log.debug("rule selected", { "rule_name": "foo" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["2 - foo"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("foo", $fired);
        await $ctx.rsCtx.putEnt("order", await append1($ctx, [
          await $ctx.rsCtx.getEnt("order"),
          "2 - foo"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("execution_order:bar"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("bar");
        $ctx.log.debug("rule selected", { "rule_name": "bar" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["2 - bar"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("bar", $fired);
        await $ctx.rsCtx.putEnt("order", await append1($ctx, [
          await $ctx.rsCtx.getEnt("order"),
          "2 - bar"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = { "getOrder": getOrder2 };
    const $rulesetKrlSource = "ruleset io.picolabs.execution-order2 {\n    meta {\n        shares getOrder\n    }\n    global {\n        getOrder = function(){\n            ent:order;\n        }\n    }\n    rule reset_order {\n        select when execution_order reset_order\n\n        send_directive(\"2 - reset_order\");\n\n        always {\n            ent:order := []\n        }\n    }\n    rule foo_or_bar {\n        select when execution_order foo\n            or\n            execution_order bar\n\n        send_directive(\"2 - foo_or_bar\");\n\n        always {\n            ent:order := ent:order.append(\"2 - foo_or_bar\")\n        }\n    }\n    rule foo {\n        select when execution_order foo\n\n        send_directive(\"2 - foo\");\n\n        always {\n            ent:order := ent:order.append(\"2 - foo\")\n        }\n    }\n    rule bar {\n        select when execution_order bar\n\n        send_directive(\"2 - bar\");\n\n        always {\n            ent:order := ent:order.append(\"2 - bar\")\n        }\n    }\n}\n";
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
        "getOrder": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getOrder2($ctx, query.args);
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
