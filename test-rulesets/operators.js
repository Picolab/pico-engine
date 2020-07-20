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
    const as = $stdlib["as"];
    const isnull = $stdlib["isnull"];
    const $typeof$ = $stdlib["typeof"];
    const chr = $stdlib["chr"];
    const range = $stdlib["range"];
    const sprintf = $stdlib["sprintf"];
    const capitalize = $stdlib["capitalize"];
    const decode = $stdlib["decode"];
    const extract = $stdlib["extract"];
    const lc = $stdlib["lc"];
    const match = $stdlib["match"];
    const ord = $stdlib["ord"];
    const replace = $stdlib["replace"];
    const split = $stdlib["split"];
    const substr = $stdlib["substr"];
    const uc = $stdlib["uc"];
    const klog = $stdlib["klog"];
    const nothing = void 0;
    const some_string = "foo";
    const results = {
      "str_as_num": await $env.krl.assertFunction(as)($ctx, [
        "100.25",
        "Number"
      ]),
      "num_as_str": await $env.krl.assertFunction(as)($ctx, [
        1.05,
        "String"
      ]),
      "regex_as_str": await $env.krl.assertFunction(as)($ctx, [
        new RegExp("blah", "i"),
        "String"
      ]),
      "isnull": [
        await $env.krl.assertFunction(isnull)($ctx, [1]),
        await $env.krl.assertFunction(isnull)($ctx, [some_string]),
        await $env.krl.assertFunction(isnull)($ctx, [nothing])
      ],
      "typeof": [
        await $env.krl.assertFunction($typeof$)($ctx, [1]),
        await $env.krl.assertFunction($typeof$)($ctx, [some_string]),
        await $env.krl.assertFunction($typeof$)($ctx, ["hi"]),
        await $env.krl.assertFunction($typeof$)($ctx, [[
            1,
            2
          ]]),
        await $env.krl.assertFunction($typeof$)($ctx, [{ "a": 1 }]),
        await $env.krl.assertFunction($typeof$)($ctx, [new RegExp("foo", "")]),
        await $env.krl.assertFunction($typeof$)($ctx, [nothing]),
        await $env.krl.assertFunction($typeof$)($ctx, [void 0])
      ],
      "75.chr()": await $env.krl.assertFunction(chr)($ctx, [75]),
      "0.range(10)": await $env.krl.assertFunction(range)($ctx, [
        0,
        10
      ]),
      "10.sprintf": await $env.krl.assertFunction(sprintf)($ctx, [
        10,
        "< %d>"
      ]),
      ".capitalize()": await $env.krl.assertFunction(capitalize)($ctx, ["Hello World"]),
      ".decode()": await $env.krl.assertFunction(decode)($ctx, ["[3, 4, 5]"]),
      ".extract": await $env.krl.assertFunction(extract)($ctx, [
        "This is a string",
        new RegExp("(s.+).*(.ing)", "")
      ]),
      ".lc()": await $env.krl.assertFunction(lc)($ctx, ["Hello World"]),
      ".match true": await $env.krl.assertFunction(match)($ctx, [
        "Something",
        new RegExp("^S.*g$", "")
      ]),
      ".match false": await $env.krl.assertFunction(match)($ctx, [
        "Someone",
        new RegExp("^S.*g$", "")
      ]),
      ".ord()": await $env.krl.assertFunction(ord)($ctx, ["Hello"]),
      ".replace": await $env.krl.assertFunction(replace)($ctx, [
        "Hello William!",
        new RegExp("will", "i"),
        "Bill"
      ]),
      ".split": await $env.krl.assertFunction(split)($ctx, [
        "a;b;c",
        new RegExp(";", "")
      ]),
      ".sprintf": await $env.krl.assertFunction(sprintf)($ctx, [
        "Jim",
        "Hello %s!"
      ]),
      ".substr(5)": await $env.krl.assertFunction(substr)($ctx, [
        "This is a string",
        5
      ]),
      ".substr(5, 4)": await $env.krl.assertFunction(substr)($ctx, [
        "This is a string",
        5,
        4
      ]),
      ".substr(5, -5)": await $env.krl.assertFunction(substr)($ctx, [
        "This is a string",
        5,
        await $stdlib["-"]($ctx, [5])
      ]),
      ".substr(25)": await $env.krl.assertFunction(substr)($ctx, [
        "This is a string",
        25
      ]),
      ".uc()": await $env.krl.assertFunction(uc)($ctx, ["Hello World"])
    };
    const returnMapAfterKlog = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction(klog)($ctx, [
        { "a": 1 },
        "hi:"
      ]);
    });
    const returnArrayAfterKlog = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction(klog)($ctx, [
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
            return results;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnMapAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnMapAfterKlog($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "returnArrayAfterKlog": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return returnArrayAfterKlog($ctx, query.args);
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