module.exports = {
  "rid": "io.picolabs.module-defined",
  "meta": {
    "provides": [
      "getInfo",
      "getName",
      "getInfoAction"
    ],
    "shares": ["getInfo"],
    "configure": ["configured_name"]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [{
          "name": "getInfo",
          "args": []
        }],
      "events": [{
          "domain": "module_defined",
          "name": "store_memo",
          "attrs": ["memo"]
        }]
    };
    const configured_name2 = $ctx.configure("configured_name", "Bob");
    const privateFn2 = $ctx.krl.Function([], async function () {
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            "privateFn = name: ",
            configured_name2
          ]),
          " memo: "
        ]),
        await $ctx.rsCtx.getEnt("memo")
      ]);
    });
    const getName2 = $ctx.krl.Function([], async function () {
      return configured_name2;
    });
    const getInfo2 = $ctx.krl.Function([], async function () {
      return {
        "name": await getName2($ctx, []),
        "memo": await $ctx.rsCtx.getEnt("memo"),
        "privateFn": await privateFn2($ctx, [])
      };
    });
    const getInfoAction2 = $ctx.krl.Action([], async function () {
      var $fired = true;
      if ($fired) {
        await send_directive1(this, [
          "getInfoAction",
          await $ctx.krl.assertFunction(getInfo2)($ctx, [])
        ]);
      }
      return {
        "name": await $stdlib["get"]($ctx, [
          await $ctx.krl.assertFunction(getInfo2)($ctx, []),
          ["name"]
        ])
      };
    });
    const sayHello2 = $ctx.krl.Function(["name"], async function ($name$3) {
      return "hello " + await $stdlib["as"]($ctx, [
        $name$3,
        "String"
      ]) + ".";
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("module_defined:store_memo", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "memo") ? $stdlib.as($ctx, [
        $event.data.attrs["memo"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var text3 = setting["text"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("store_memo");
        $ctx.log.debug("rule selected", { "rule_name": "store_memo" });
        var text3 = $state.setting["text"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "store_memo",
            {
              "name": configured_name2,
              "memo_to_store": text3
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("store_memo", $fired);
        await $ctx.rsCtx.putEnt("memo", await $stdlib["+"]($ctx, [
          await $stdlib["+"]($ctx, [
            await $stdlib["+"]($ctx, [
              await $stdlib["+"]($ctx, [
                "[\"",
                text3
              ]),
              "\" by "
            ]),
            configured_name2
          ]),
          "]"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {
      "privateFn": privateFn2,
      "getName": getName2,
      "getInfo": getInfo2,
      "getInfoAction": getInfoAction2,
      "sayHello": sayHello2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.module-defined {\n    meta {\n        provides getInfo, getName, getInfoAction\n        shares getInfo\n        configure using\n            configured_name = \"Bob\"\n    }\n    global {\n        privateFn = function(){\n            \"privateFn = name: \" + configured_name + \" memo: \" + ent:memo;\n        }\n        getName = function(){\n            configured_name;\n        }\n        getInfo = function(){\n            {\n                \"name\": getName(),\n                \"memo\": ent:memo,\n                \"privateFn\": privateFn()\n            };\n        }\n        getInfoAction = defaction(){\n\n            send_directive(\"getInfoAction\", getInfo());\n\n            return {\"name\": getInfo()[\"name\"]};\n        }\n        sayHello = function(name){\n            <<hello #{name}.>>;\n        }\n    }\n    rule store_memo {\n        select when module_defined store_memo memo re#^(.*)$# setting(text)\n\n        send_directive(\"store_memo\", {\n            \"name\": configured_name,\n            \"memo_to_store\": text\n        });\n\n        always {\n            ent:memo := \"[\\\"\" + text + \"\\\" by \" + configured_name + \"]\"\n        }\n    }\n}\n";
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
        "getInfo": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getInfo2($ctx, query.args);
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
      "provides": {
        "getInfo": getInfo2,
        "getName": getName2,
        "getInfoAction": getInfoAction2
      },
      "consoleGlobalRefs": $consoleGlobalRefs
    };
  }
};
