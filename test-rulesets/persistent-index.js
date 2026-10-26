module.exports = {
  "rid": "io.picolabs.persistent-index",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey",
      "getBaz",
      "getMaplist"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "getFoo",
          "args": []
        },
        {
          "name": "getFooKey",
          "args": ["key"]
        },
        {
          "name": "getBaz",
          "args": []
        },
        {
          "name": "getMaplist",
          "args": []
        }
      ],
      "events": [
        {
          "domain": "pindex",
          "name": "setfoo",
          "attrs": []
        },
        {
          "domain": "pindex",
          "name": "putfoo",
          "attrs": [
            "key",
            "value"
          ]
        },
        {
          "domain": "pindex",
          "name": "delfoo",
          "attrs": ["key"]
        },
        {
          "domain": "pindex",
          "name": "nukefoo",
          "attrs": []
        },
        {
          "domain": "pindex",
          "name": "putbaz",
          "attrs": []
        },
        {
          "domain": "pindex",
          "name": "setmaplist",
          "attrs": []
        },
        {
          "domain": "pindex",
          "name": "putmaplist",
          "attrs": []
        }
      ]
    };
    const getFoo2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("foo");
    });
    const getFooKey2 = $ctx.krl.Function(["key"], async function (key3) {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("foo"),
        key3
      ]);
    });
    const getBaz2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("baz");
    });
    const getMaplist2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("maplist");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("pindex:setfoo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("setfoo");
        $ctx.log.debug("rule selected", { "rule_name": "setfoo" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("setfoo", $fired);
        await $ctx.rsCtx.putEnt("foo", $ctx.module("event")["attrs"]($ctx));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putfoo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("putfoo");
        $ctx.log.debug("rule selected", { "rule_name": "putfoo" });
        const key3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "key"
        ]);
        const value3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "value"
        ]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("putfoo", $fired);
        await $ctx.rsCtx.putEnt("foo", await $stdlib.set($ctx, [
          await $ctx.rsCtx.getEnt("foo"),
          key3,
          value3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:delfoo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("delfoo");
        $ctx.log.debug("rule selected", { "rule_name": "delfoo" });
        const key3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "key"
        ]);
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("delfoo", $fired);
        await $ctx.rsCtx.putEnt("foo", await $stdlib.delete($ctx, [
          await $ctx.rsCtx.getEnt("foo"),
          key3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:nukefoo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("nukefoo");
        $ctx.log.debug("rule selected", { "rule_name": "nukefoo" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("nukefoo", $fired);
        await $ctx.rsCtx.delEnt("foo");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putbaz"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("putbaz");
        $ctx.log.debug("rule selected", { "rule_name": "putbaz" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("putbaz", $fired);
        await $ctx.rsCtx.putEnt("baz", await $stdlib.set($ctx, [
          await $ctx.rsCtx.getEnt("baz"),
          [
            "one",
            "two"
          ],
          "three"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:setmaplist"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("setmaplist");
        $ctx.log.debug("rule selected", { "rule_name": "setmaplist" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("setmaplist", $fired);
        await $ctx.rsCtx.putEnt("maplist", [
          { "id": "one" },
          { "id": "two" },
          { "id": "three" }
        ]);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putmaplist"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("putmaplist");
        $ctx.log.debug("rule selected", { "rule_name": "putmaplist" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("putmaplist", $fired);
        await $ctx.rsCtx.putEnt("maplist", await $stdlib.set($ctx, [
          await $ctx.rsCtx.getEnt("maplist"),
          [
            1,
            "other"
          ],
          "thing"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {
      "getFoo": getFoo2,
      "getFooKey": getFooKey2,
      "getBaz": getBaz2,
      "getMaplist": getMaplist2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.persistent-index {\n    meta {\n        shares getFoo, getFooKey, getBaz, getMaplist\n    }\n    global {\n        getFoo = function(){\n            ent:foo;\n        }\n        getFooKey = function(key){\n            ent:foo{key};\n        }\n        getBaz = function(){\n            ent:baz;\n        }\n        getMaplist = function(){\n            ent:maplist;\n        }\n    }\n    rule setfoo {\n        select when pindex setfoo\n        always {\n            ent:foo := event:attrs\n        }\n    }\n    rule putfoo {\n        select when pindex putfoo\n\n        pre {\n            key = event:attrs{\"key\"}\n            value = event:attrs{\"value\"}\n        }\n        always {\n            ent:foo{key} := value\n        }\n    }\n    rule delfoo {\n        select when pindex delfoo\n\n        pre {\n            key = event:attrs{\"key\"}\n        }\n        always {\n            clear ent:foo{key}\n        }\n    }\n    rule nukefoo {\n        select when pindex nukefoo\n        always {\n            clear ent:foo\n        }\n    }\n    rule putbaz {\n        select when pindex putbaz\n        always {\n            ent:baz{[\"one\", \"two\"]} := \"three\"\n        }\n    }\n    rule setmaplist {\n        select when pindex setmaplist\n        always {\n            ent:maplist := [{\"id\": \"one\"}, {\"id\": \"two\"}, {\"id\": \"three\"}]\n        }\n    }\n    rule putmaplist {\n        select when pindex putmaplist\n        always {\n            ent:maplist{[1, \"other\"]} := \"thing\"\n        }\n    }\n}\n";
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
        "getFoo": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getFoo2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getFooKey": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getFooKey2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getBaz": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getBaz2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getMaplist": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getMaplist2($ctx, query.args);
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
