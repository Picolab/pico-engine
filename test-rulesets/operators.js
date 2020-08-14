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
            return results2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnMapAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnMapAfterKlog2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnArrayAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnArrayAfterKlog2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        }
      }
    };
  }
};