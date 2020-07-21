module.exports = {
  "rid": "io.picolabs.operators",
  "version": "draft",
  "meta": {
    "shares": [
      "results",
      "returnMapAfterKlog",
      "returnArrayAfterKlog"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
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
    const nothing1 = void 0;
    const some_string1 = "foo";
    const results1 = {
      "str_as_num": await $env.krl.assertFunction(as1)($ctx, [
        "100.25",
        "Number"
      ]),
      "num_as_str": await $env.krl.assertFunction(as1)($ctx, [
        1.05,
        "String"
      ]),
      "regex_as_str": await $env.krl.assertFunction(as1)($ctx, [
        new RegExp("blah", "i"),
        "String"
      ]),
      "isnull": [
        await $env.krl.assertFunction(isnull1)($ctx, [1]),
        await $env.krl.assertFunction(isnull1)($ctx, [some_string1]),
        await $env.krl.assertFunction(isnull1)($ctx, [nothing1])
      ],
      "typeof": [
        await $env.krl.assertFunction($typeof$1)($ctx, [1]),
        await $env.krl.assertFunction($typeof$1)($ctx, [some_string1]),
        await $env.krl.assertFunction($typeof$1)($ctx, ["hi"]),
        await $env.krl.assertFunction($typeof$1)($ctx, [[
            1,
            2
          ]]),
        await $env.krl.assertFunction($typeof$1)($ctx, [{ "a": 1 }]),
        await $env.krl.assertFunction($typeof$1)($ctx, [new RegExp("foo", "")]),
        await $env.krl.assertFunction($typeof$1)($ctx, [nothing1]),
        await $env.krl.assertFunction($typeof$1)($ctx, [void 0])
      ],
      "75.chr()": await $env.krl.assertFunction(chr1)($ctx, [75]),
      "0.range(10)": await $env.krl.assertFunction(range1)($ctx, [
        0,
        10
      ]),
      "10.sprintf": await $env.krl.assertFunction(sprintf1)($ctx, [
        10,
        "< %d>"
      ]),
      ".capitalize()": await $env.krl.assertFunction(capitalize1)($ctx, ["Hello World"]),
      ".decode()": await $env.krl.assertFunction(decode1)($ctx, ["[3, 4, 5]"]),
      ".extract": await $env.krl.assertFunction(extract1)($ctx, [
        "This is a string",
        new RegExp("(s.+).*(.ing)", "")
      ]),
      ".lc()": await $env.krl.assertFunction(lc1)($ctx, ["Hello World"]),
      ".match true": await $env.krl.assertFunction(match1)($ctx, [
        "Something",
        new RegExp("^S.*g$", "")
      ]),
      ".match false": await $env.krl.assertFunction(match1)($ctx, [
        "Someone",
        new RegExp("^S.*g$", "")
      ]),
      ".ord()": await $env.krl.assertFunction(ord1)($ctx, ["Hello"]),
      ".replace": await $env.krl.assertFunction(replace1)($ctx, [
        "Hello William!",
        new RegExp("will", "i"),
        "Bill"
      ]),
      ".split": await $env.krl.assertFunction(split1)($ctx, [
        "a;b;c",
        new RegExp(";", "")
      ]),
      ".sprintf": await $env.krl.assertFunction(sprintf1)($ctx, [
        "Jim",
        "Hello %s!"
      ]),
      ".substr(5)": await $env.krl.assertFunction(substr1)($ctx, [
        "This is a string",
        5
      ]),
      ".substr(5, 4)": await $env.krl.assertFunction(substr1)($ctx, [
        "This is a string",
        5,
        4
      ]),
      ".substr(5, -5)": await $env.krl.assertFunction(substr1)($ctx, [
        "This is a string",
        5,
        await $stdlib["-"]($ctx, [5])
      ]),
      ".substr(25)": await $env.krl.assertFunction(substr1)($ctx, [
        "This is a string",
        25
      ]),
      ".uc()": await $env.krl.assertFunction(uc1)($ctx, ["Hello World"])
    };
    const returnMapAfterKlog1 = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction(klog1)($ctx, [
        { "a": 1 },
        "hi:"
      ]);
    });
    const returnArrayAfterKlog1 = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction(klog1)($ctx, [
        [
          1,
          2
        ],
        "hi:"
      ]);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return $ctx.drainDirectives();
      },
      "query": {
        "results": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return results1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnMapAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnMapAfterKlog1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnArrayAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnArrayAfterKlog1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
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
        }
      }
    };
  }
};