module.exports = {
  "rid": "io.picolabs.last",
  "meta": { "name": "testing postlude `last` statement" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": [
        {
          "domain": "last",
          "name": "all",
          "attrs": ["stop"]
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": ["stop"]
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": []
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": []
        }
      ]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo");
        $ctx.log.debug("rule selected", { "rule_name": "foo" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["foo"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("foo", $fired);
        if ($fired) {
          if (await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "stop"
              ]),
              "foo"
            ]))
            return $last();
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("bar");
        $ctx.log.debug("rule selected", { "rule_name": "bar" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["bar"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("bar", $fired);
        if ($fired) {
          if (await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "stop"
              ]),
              "bar"
            ]))
            return $last();
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("baz");
        $ctx.log.debug("rule selected", { "rule_name": "baz" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["baz"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("baz", $fired);
        if ($fired) {
          return $last();
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("qux");
        $ctx.log.debug("rule selected", { "rule_name": "qux" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["qux"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("qux", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {};
    const $rulesetKrlSource = "ruleset io.picolabs.last {\n    meta {\n        name \"testing postlude `last` statement\"\n    }\n    rule foo {\n        select when last all\n\n        send_directive(\"foo\");\n\n        fired {\n            last if event:attrs{\"stop\"} == \"foo\"\n        }\n    }\n    rule bar {\n        select when last all\n\n        send_directive(\"bar\");\n\n        fired {\n            last if event:attrs{\"stop\"} == \"bar\"\n        }\n    }\n    rule baz {\n        select when last all\n\n        send_directive(\"baz\");\n\n        fired {\n            last\n        }\n    }\n    rule qux {\n        select when last all\n\n        send_directive(\"qux\");\n    }\n}\n";
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
