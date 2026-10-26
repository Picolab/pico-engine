module.exports = {
  "rid": "io.picolabs.module-used",
  "meta": {
    "use": [
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_dflt"
      },
      {
        "kind": "module",
        "rid": "io.picolabs.module-defined",
        "alias": "my_module_conf",
        "with": ["configured_name"]
      }
    ],
    "shares": [
      "now",
      "getEntVal",
      "dfltName"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [
        {
          "name": "now",
          "args": []
        },
        {
          "name": "getEntVal",
          "args": []
        },
        {
          "name": "dfltName",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "module_used",
          "name": "dflt_name",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "conf_name",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "dflt_info",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "conf_info",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "dflt_getInfoAction",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "conf_getInfoAction",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "sayHelloWithOperator",
          "attrs": []
        },
        {
          "domain": "module_used",
          "name": "uninstall",
          "attrs": []
        }
      ]
    };
    await $ctx.useModule("io.picolabs.module-defined", "my_module_dflt");
    await $ctx.useModule("io.picolabs.module-defined", "my_module_conf", { "configured_name": "Jim" });
    const now2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction($ctx.module("time")["now"])($ctx, []);
    });
    const getEntVal2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("val");
    });
    const dfltName2 = await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []);
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_name"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("dflt_name");
        $ctx.log.debug("rule selected", { "rule_name": "dflt_name" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "dflt_name",
            { "name": await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getName"])($ctx, []) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("dflt_name", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_name"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("conf_name");
        $ctx.log.debug("rule selected", { "rule_name": "conf_name" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "conf_name",
            { "name": await $ctx.krl.assertFunction($ctx.module("my_module_conf")["getName"])($ctx, []) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("conf_name", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_info"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("dflt_info");
        $ctx.log.debug("rule selected", { "rule_name": "dflt_info" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "dflt_info",
            { "info": await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["getInfo"])($ctx, []) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("dflt_info", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_info"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("conf_info");
        $ctx.log.debug("rule selected", { "rule_name": "conf_info" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "conf_info",
            { "info": await $ctx.krl.assertFunction($ctx.module("my_module_conf")["getInfo"])($ctx, []) }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("conf_info", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:dflt_getInfoAction"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("dflt_getInfoAction");
        $ctx.log.debug("rule selected", { "rule_name": "dflt_getInfoAction" });
        var $fired = true;
        if ($fired) {
          var info3 = await $ctx.krl.assertAction($ctx.module("my_module_dflt")["getInfoAction"])($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("dflt_getInfoAction", $fired);
        await $ctx.rsCtx.putEnt("val", info3);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:conf_getInfoAction"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("conf_getInfoAction");
        $ctx.log.debug("rule selected", { "rule_name": "conf_getInfoAction" });
        var $fired = true;
        if ($fired) {
          var info3 = await $ctx.krl.assertAction($ctx.module("my_module_conf")["getInfoAction"])($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("conf_getInfoAction", $fired);
        await $ctx.rsCtx.putEnt("val", info3);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:sayHelloWithOperator"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("sayHelloWithOperator");
        $ctx.log.debug("rule selected", { "rule_name": "sayHelloWithOperator" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [await $ctx.krl.assertFunction($ctx.module("my_module_dflt")["sayHello"])($ctx, ["bob"])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("sayHelloWithOperator", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("module_used:uninstall"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("uninstall");
        $ctx.log.debug("rule selected", { "rule_name": "uninstall" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("ctx")["uninstall"])($ctx, ["io.picolabs.module-defined"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("uninstall", $fired);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {
      "now": now2,
      "getEntVal": getEntVal2,
      "dfltName": dfltName2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.module-used {\n    meta {\n        use module io.picolabs.module-defined\n            alias my_module_dflt\n\n        use module io.picolabs.module-defined\n            alias my_module_conf\n            with\n                configured_name = \"Jim\"\n\n        shares now, getEntVal, dfltName\n    }\n    global {\n        now = function(){\n            time:now();\n        }\n        getEntVal = function(){\n            ent:val;\n        }\n        dfltName = my_module_dflt:getName()\n    }\n    rule dflt_name {\n        select when module_used dflt_name\n\n        send_directive(\"dflt_name\", {\"name\": my_module_dflt:getName()});\n    }\n    rule conf_name {\n        select when module_used conf_name\n\n        send_directive(\"conf_name\", {\"name\": my_module_conf:getName()});\n    }\n    rule dflt_info {\n        select when module_used dflt_info\n\n        send_directive(\"dflt_info\", {\"info\": my_module_dflt:getInfo()});\n    }\n    rule conf_info {\n        select when module_used conf_info\n\n        send_directive(\"conf_info\", {\"info\": my_module_conf:getInfo()});\n    }\n    rule dflt_getInfoAction {\n        select when module_used dflt_getInfoAction\n\n        my_module_dflt:getInfoAction() setting(info);\n\n        always {\n            ent:val := info\n        }\n    }\n    rule conf_getInfoAction {\n        select when module_used conf_getInfoAction\n\n        my_module_conf:getInfoAction() setting(info);\n\n        always {\n            ent:val := info\n        }\n    }\n    rule sayHelloWithOperator {\n        select when module_used sayHelloWithOperator\n\n        send_directive(\"bob\".my_module_dflt:sayHello());\n    }\n    rule uninstall {\n        select when module_used uninstall\n\n        ctx:uninstall(\"io.picolabs.module-defined\");\n    }\n}\n";
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
        "now": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await now2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getEntVal": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getEntVal2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "dfltName": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return dfltName2;
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
