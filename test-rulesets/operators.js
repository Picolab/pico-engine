module.exports = {
  "rid": "io.picolabs.operators",
  "meta": {
    "shares": [
      "results",
      "returnMapAfterKlog",
      "returnArrayAfterKlog"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const as1 = $stdlib["as"];
    const isnull1 = $stdlib["isnull"];
    const $typeof$1 = $stdlib["typeof"];
    const chr1 = $stdlib["chr"];
    const range1 = $stdlib["range"];
    const sprintf1 = $stdlib["sprintf"];
    const capitalize1 = $stdlib["capitalize"];
    const decode1 = $stdlib["decode"];
    const extract1 = $stdlib["extract"];
    const lc1 = $stdlib["lc"];
    const match1 = $stdlib["match"];
    const ord1 = $stdlib["ord"];
    const replace1 = $stdlib["replace"];
    const split1 = $stdlib["split"];
    const substr1 = $stdlib["substr"];
    const uc1 = $stdlib["uc"];
    const klog1 = $stdlib["klog"];
    const __testing1 = {
      "queries": [
        {
          "name": "results",
          "args": []
        },
        {
          "name": "returnMapAfterKlog",
          "args": []
        },
        {
          "name": "returnArrayAfterKlog",
          "args": []
        }
      ],
      "events": []
    };
    const nothing2 = void 0;
    const some_string2 = "foo";
    const results2 = {
      "str_as_num": await as1($ctx, [
        "100.25",
        "Number"
      ]),
      "num_as_str": await as1($ctx, [
        1.05,
        "String"
      ]),
      "regex_as_str": await as1($ctx, [
        new RegExp("blah", "i"),
        "String"
      ]),
      "isnull": [
        await isnull1($ctx, [1]),
        await isnull1($ctx, [some_string2]),
        await isnull1($ctx, [nothing2])
      ],
      "typeof": [
        await $typeof$1($ctx, [1]),
        await $typeof$1($ctx, [some_string2]),
        await $typeof$1($ctx, ["hi"]),
        await $typeof$1($ctx, [[
            1,
            2
          ]]),
        await $typeof$1($ctx, [{ "a": 1 }]),
        await $typeof$1($ctx, [new RegExp("foo", "")]),
        await $typeof$1($ctx, [nothing2]),
        await $typeof$1($ctx, [void 0])
      ],
      "75.chr()": await chr1($ctx, [75]),
      "0.range(10)": await range1($ctx, [
        0,
        10
      ]),
      "10.sprintf": await sprintf1($ctx, [
        10,
        "< %d>"
      ]),
      ".capitalize()": await capitalize1($ctx, ["Hello World"]),
      ".decode()": await decode1($ctx, ["[3, 4, 5]"]),
      ".extract": await extract1($ctx, [
        "This is a string",
        new RegExp("(s.+).*(.ing)", "")
      ]),
      ".lc()": await lc1($ctx, ["Hello World"]),
      ".match true": await match1($ctx, [
        "Something",
        new RegExp("^S.*g$", "")
      ]),
      ".match false": await match1($ctx, [
        "Someone",
        new RegExp("^S.*g$", "")
      ]),
      ".ord()": await ord1($ctx, ["Hello"]),
      ".replace": await replace1($ctx, [
        "Hello William!",
        new RegExp("will", "i"),
        "Bill"
      ]),
      ".split": await split1($ctx, [
        "a;b;c",
        new RegExp(";", "")
      ]),
      ".sprintf": await sprintf1($ctx, [
        "Jim",
        "Hello %s!"
      ]),
      ".substr(5)": await substr1($ctx, [
        "This is a string",
        5
      ]),
      ".substr(5, 4)": await substr1($ctx, [
        "This is a string",
        5,
        4
      ]),
      ".substr(5, -5)": await substr1($ctx, [
        "This is a string",
        5,
        await $stdlib["-"]($ctx, [5])
      ]),
      ".substr(25)": await substr1($ctx, [
        "This is a string",
        25
      ]),
      ".uc()": await uc1($ctx, ["Hello World"])
    };
    const returnMapAfterKlog2 = $ctx.krl.Function([], async function () {
      return await klog1($ctx, [
        { "a": 1 },
        "hi:"
      ]);
    });
    const returnArrayAfterKlog2 = $ctx.krl.Function([], async function () {
      return await klog1($ctx, [
        [
          1,
          2
        ],
        "hi:"
      ]);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    const $consoleGlobalRefs = {
      "nothing": nothing2,
      "some_string": some_string2,
      "results": results2,
      "returnMapAfterKlog": returnMapAfterKlog2,
      "returnArrayAfterKlog": returnArrayAfterKlog2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.operators {\n    meta {\n        shares results, returnMapAfterKlog, returnArrayAfterKlog\n    }\n    global {\n        nothing = null\n        some_string = \"foo\"\n        results = {\n            \"str_as_num\": \"100.25\".as(\"Number\"),\n            \"num_as_str\": 1.05.as(\"String\"),\n            \"regex_as_str\": re#blah#i.as(\"String\"),\n            \"isnull\": [\n                1.isnull(),\n                some_string.isnull(),\n                nothing.isnull()\n            ],\n            \"typeof\": [\n                1.typeof(),\n                some_string.typeof(),\n                \"hi\".typeof(),\n                [1, 2].typeof(),\n                {\"a\": 1}.typeof(),\n                re#foo#.typeof(),\n                nothing.typeof(),\n                null.typeof()\n            ],\n            \"75.chr()\": 75.chr(),\n            \"0.range(10)\": 0.range(10),\n            \"10.sprintf\": 10.sprintf(\"< %d>\"),\n            \".capitalize()\": \"Hello World\".capitalize(),\n            \".decode()\": \"[3, 4, 5]\".decode(),\n            \".extract\": \"This is a string\".extract(re#(s.+).*(.ing)#),\n            \".lc()\": \"Hello World\".lc(),\n            \".match true\": \"Something\".match(re#^S.*g$#),\n            \".match false\": \"Someone\".match(re#^S.*g$#),\n            \".ord()\": \"Hello\".ord(),\n            \".replace\": \"Hello William!\".replace(re#will#i, \"Bill\"),\n            \".split\": \"a;b;c\".split(re#;#),\n            \".sprintf\": \"Jim\".sprintf(\"Hello %s!\"),\n            \".substr(5)\": \"This is a string\".substr(5),\n            \".substr(5, 4)\": \"This is a string\".substr(5, 4),\n            \".substr(5, -5)\": \"This is a string\".substr(5, -5),\n            \".substr(25)\": \"This is a string\".substr(25),\n            \".uc()\": \"Hello World\".uc()\n        }\n        returnMapAfterKlog = function(){\n            {\"a\": 1}.klog(\"hi:\");\n        }\n        returnArrayAfterKlog = function(){\n            [1, 2].klog(\"hi:\");\n        }\n    }\n\n}\n";
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
        "results": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return results2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnMapAfterKlog": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await returnMapAfterKlog2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnArrayAfterKlog": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await returnArrayAfterKlog2($ctx, query.args);
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
