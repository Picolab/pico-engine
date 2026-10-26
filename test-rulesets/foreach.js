module.exports = {
  "rid": "io.picolabs.foreach",
  "meta": { "name": "testing foreach" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const range1 = $stdlib["range"];
    const split1 = $stdlib["split"];
    const __testing1 = {
      "queries": [],
      "events": [
        {
          "domain": "foreach",
          "name": "basic",
          "attrs": []
        },
        {
          "domain": "foreach",
          "name": "map",
          "attrs": []
        },
        {
          "domain": "foreach",
          "name": "nested",
          "attrs": []
        },
        {
          "domain": "foreach",
          "name": "scope",
          "attrs": []
        },
        {
          "domain": "foreach",
          "name": "final",
          "attrs": [
            "y",
            "x"
          ]
        },
        {
          "domain": "foreach",
          "name": "final_raised",
          "attrs": [
            "x",
            "y"
          ]
        },
        {
          "domain": "foreach",
          "name": "key_vs_index",
          "attrs": []
        }
      ]
    };
    const doubleThis2 = $ctx.krl.Function(["arr"], async function (arr3) {
      return [
        arr3,
        arr3
      ];
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("foreach:basic"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs([
          1,
          2,
          3
        ]);
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let x3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("basic");
          $ctx.log.debug("rule selected", { "rule_name": "basic" });
          var $fired = true;
          if ($fired) {
            await send_directive1($ctx, [
              "basic",
              { "x": x3 }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          $ctx.recordRuleOutcome("basic", $fired);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:map"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs({
          "a": 1,
          "b": 2,
          "c": 3
        });
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let v3 = $foreach0_pairs[$foreach0_i][1];
          let k3 = $foreach0_pairs[$foreach0_i][0];
          $ctx.setCurrentRuleName("map");
          $ctx.log.debug("rule selected", { "rule_name": "map" });
          var $fired = true;
          if ($fired) {
            await send_directive1($ctx, [
              "map",
              {
                "k": k3,
                "v": v3
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          $ctx.recordRuleOutcome("map", $fired);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:nested"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs([
          1,
          2,
          3
        ]);
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let x3 = $foreach0_pairs[$foreach0_i][1];
          let $foreach1_pairs = $ctx.krl.toPairs([
            "a",
            "b",
            "c"
          ]);
          let $foreach1_len = $foreach1_pairs.length;
          let $foreach1_i;
          for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
            let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
            let y3 = $foreach1_pairs[$foreach1_i][1];
            $ctx.setCurrentRuleName("nested");
            $ctx.log.debug("rule selected", { "rule_name": "nested" });
            var $fired = true;
            if ($fired) {
              await send_directive1($ctx, [
                "nested",
                {
                  "x": x3,
                  "y": y3
                }
              ]);
            }
            if ($fired)
              $ctx.log.debug("fired");
            else
              $ctx.log.debug("not fired");
            $ctx.recordRuleOutcome("nested", $fired);
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:scope"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await doubleThis2($ctx, [[
            1,
            2,
            3
          ]]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let arr3 = $foreach0_pairs[$foreach0_i][1];
          let $foreach1_pairs = $ctx.krl.toPairs(arr3);
          let $foreach1_len = $foreach1_pairs.length;
          let $foreach1_i;
          for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
            let foo3 = $foreach1_pairs[$foreach1_i][1];
            let $foreach2_pairs = $ctx.krl.toPairs(await range1($ctx, [
              0,
              foo3
            ]));
            let $foreach2_len = $foreach2_pairs.length;
            let $foreach2_i;
            for ($foreach2_i = 0; $foreach2_i < $foreach2_len; $foreach2_i++) {
              let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1 && $foreach2_i === $foreach2_len - 1;
              let bar3 = $foreach2_pairs[$foreach2_i][1];
              $ctx.setCurrentRuleName("scope");
              $ctx.log.debug("rule selected", { "rule_name": "scope" });
              const baz3 = await $stdlib["*"]($ctx, [
                foo3,
                bar3
              ]);
              var $fired = true;
              if ($fired) {
                await send_directive1($ctx, [
                  "scope",
                  {
                    "foo": foo3,
                    "bar": bar3,
                    "baz": baz3
                  }
                ]);
              }
              if ($fired)
                $ctx.log.debug("fired");
              else
                $ctx.log.debug("not fired");
              $ctx.recordRuleOutcome("scope", $fired);
            }
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:final"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs(await split1($ctx, [
          await $stdlib["get"]($ctx, [
            $ctx.module("event")["attrs"]($ctx),
            "x"
          ]),
          ","
        ]));
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let x3 = $foreach0_pairs[$foreach0_i][1];
          let $foreach1_pairs = $ctx.krl.toPairs(await split1($ctx, [
            await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "y"
            ]),
            ","
          ]));
          let $foreach1_len = $foreach1_pairs.length;
          let $foreach1_i;
          for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
            let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
            let y3 = $foreach1_pairs[$foreach1_i][1];
            $ctx.setCurrentRuleName("final");
            $ctx.log.debug("rule selected", { "rule_name": "final" });
            var $fired = true;
            if ($fired) {
              await send_directive1($ctx, [
                "final",
                {
                  "x": x3,
                  "y": y3
                }
              ]);
            }
            if ($fired)
              $ctx.log.debug("fired");
            else
              $ctx.log.debug("not fired");
            $ctx.recordRuleOutcome("final", $fired);
            if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
              await $ctx.rsCtx.raiseEvent("foreach", "final_raised", {
                "x": x3,
                "y": y3
              });
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:final_raised"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("final_raised");
        $ctx.log.debug("rule selected", { "rule_name": "final_raised" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "final_raised",
            {
              "x": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "x"
              ]),
              "y": await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "y"
              ])
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("final_raised", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:key_vs_index"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs({
          "foo": "bar",
          "baz": "qux"
        });
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let a3 = $foreach0_pairs[$foreach0_i][1];
          let k3 = $foreach0_pairs[$foreach0_i][0];
          let $foreach1_pairs = $ctx.krl.toPairs([
            "one",
            "two",
            "three"
          ]);
          let $foreach1_len = $foreach1_pairs.length;
          let $foreach1_i;
          for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
            let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
            let b3 = $foreach1_pairs[$foreach1_i][1];
            let i3 = $foreach1_pairs[$foreach1_i][0];
            $ctx.setCurrentRuleName("key_vs_index");
            $ctx.log.debug("rule selected", { "rule_name": "key_vs_index" });
            var $fired = true;
            if ($fired) {
              await send_directive1($ctx, [
                "key_vs_index",
                {
                  "a": a3,
                  "k": k3,
                  "b": b3,
                  "i": i3
                }
              ]);
            }
            if ($fired)
              $ctx.log.debug("fired");
            else
              $ctx.log.debug("not fired");
            $ctx.recordRuleOutcome("key_vs_index", $fired);
          }
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = { "doubleThis": doubleThis2 };
    const $rulesetKrlSource = "ruleset io.picolabs.foreach {\n    meta {\n        name \"testing foreach\"\n    }\n    global {\n        doubleThis = function(arr){\n            [arr, arr];\n        }\n    }\n    rule basic {\n        select when foreach basic\n        foreach [1, 2, 3] setting(x)\n\n        send_directive(\"basic\", {\"x\": x});\n    }\n    rule map {\n        select when foreach map\n        foreach {\n            \"a\": 1,\n            \"b\": 2,\n            \"c\": 3\n        } setting(v, k)\n\n        send_directive(\"map\", {\n            \"k\": k,\n            \"v\": v\n        });\n    }\n    rule nested {\n        select when foreach nested\n        foreach [1, 2, 3] setting(x)\n            foreach [\"a\", \"b\", \"c\"] setting(y)\n\n        send_directive(\"nested\", {\n            \"x\": x,\n            \"y\": y\n        });\n    }\n    rule scope {\n        select when foreach scope\n        foreach doubleThis([1, 2, 3]) setting(arr)\n            foreach arr setting(foo)\n                foreach 0.range(foo) setting(bar)\n\n        pre {\n            baz = foo * bar\n        }\n\n        send_directive(\"scope\", {\n            \"foo\": foo,\n            \"bar\": bar,\n            \"baz\": baz\n        });\n    }\n    rule final {\n        select when foreach final\n        foreach event:attrs{\"x\"}.split(\",\") setting(x)\n            foreach event:attrs{\"y\"}.split(\",\") setting(y)\n\n        send_directive(\"final\", {\n            \"x\": x,\n            \"y\": y\n        });\n\n        always {\n            raise foreach event \"final_raised\"\n                attributes {\n                    \"x\": x,\n                    \"y\": y\n                } on final\n        }\n    }\n    rule final_raised {\n        select when foreach final_raised\n\n        send_directive(\"final_raised\", {\n            \"x\": event:attrs{\"x\"},\n            \"y\": event:attrs{\"y\"}\n        });\n    }\n    rule key_vs_index {\n        select when foreach key_vs_index\n        foreach {\n            \"foo\": \"bar\",\n            \"baz\": \"qux\"\n        } setting(a, k)\n            foreach [\"one\", \"two\", \"three\"] setting(b, i)\n\n        send_directive(\"key_vs_index\", {\n            \"a\": a,\n            \"k\": k,\n            \"b\": b,\n            \"i\": i\n        });\n    }\n}\n";
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
