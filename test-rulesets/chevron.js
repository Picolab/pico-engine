module.exports = {
  "rid": "io.picolabs.chevron",
  "meta": {
    "description": "\nHello Chevrons!\n        ",
    "shares": ["d"]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [{
          "name": "d",
          "args": []
        }],
      "events": []
    };
    const a2 = 1;
    const b2 = 2;
    const c2 = "<h1>some<b>html</b></h1>";
    const d2 = "\n            hi " + await $stdlib["as"]($ctx, [
      a2,
      "String"
    ]) + " + " + await $stdlib["as"]($ctx, [
      b2,
      "String"
    ]) + " = " + await $stdlib["as"]($ctx, [
      await $stdlib["+"]($ctx, [
        1,
        2
      ]),
      "String"
    ]) + "\n            " + await $stdlib["as"]($ctx, [
      c2,
      "String"
    ]) + "\n        ";
    const e2 = "static";
    const f2 = "";
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    const $consoleGlobalRefs = {
      "a": a2,
      "b": b2,
      "c": c2,
      "d": d2,
      "e": e2,
      "f": f2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.chevron {\n    meta {\n        description <<\nHello Chevrons!\n        >>\n\n        shares d\n    }\n    global {\n        a = 1\n        b = 2\n        c = \"<h1>some<b>html</b></h1>\"\n        d = <<\n            hi #{a} + #{b} = #{1 + 2}\n            #{c}\n        >>\n        e = <<static>>\n        f = <<>>\n    }\n\n}\n";
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
        "d": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return d2;
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
