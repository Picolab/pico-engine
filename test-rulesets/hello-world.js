module.exports = {
  "rid": "io.picolabs.hello_world",
  "meta": {
    "version": "0.0.0",
    "name": "Hello World",
    "description": "\nA first ruleset for the Quickstart\n    ",
    "author": "Phil Windley",
    "shares": [
      "hello",
      "said"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "hello",
          "args": ["name"]
        },
        {
          "name": "said",
          "args": []
        }
      ],
      "events": [{
          "domain": "say",
          "name": "hello",
          "attrs": ["name"]
        }]
    };
    const hello2 = $ctx.krl.Function(["name"], async function ($name$3 = "default") {
      const msg3 = await $stdlib["+"]($ctx, [
        "Hello ",
        $name$3
      ]);
      return msg3;
    });
    const said2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("said");
    });
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
    const $consoleGlobalRefs = {
      "hello": hello2,
      "said": said2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.hello_world {\n    meta {\n        version \"0.0.0\"\n        name \"Hello World\"\n        description <<\nA first ruleset for the Quickstart\n    >>\n\n        author \"Phil Windley\"\n        shares hello, said\n    }\n    global {\n        hello = function(\n            name = \"default\",\n        ){\n            msg = \"Hello \" + name;\n            msg;\n        }\n        said = function(){\n            ent:said;\n        }\n    }\n    rule say_hello {\n        select when say hello\n        always {\n            ent:said := event:attrs{\"name\"}\n        }\n    }\n}\n";
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
        "hello": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await hello2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "said": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await said2($ctx, query.args);
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
