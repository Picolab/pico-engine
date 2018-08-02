module.exports = {
  "rid": "io.picolabs.operators",
  "meta": {
    "shares": [
      "results",
      "returnMapAfterKlog",
      "returnArrayAfterKlog"
    ]
  },
  "global": async function (ctx) {
    ctx.scope.set("nothing", void 0);
    ctx.scope.set("some_string", "foo");
    ctx.scope.set("results", {
      "str_as_num": await ctx.callKRLstdlib("as", [
        "100.25",
        "Number"
      ]),
      "num_as_str": await ctx.callKRLstdlib("as", [
        1.05,
        "String"
      ]),
      "regex_as_str": await ctx.callKRLstdlib("as", [
        new RegExp("blah", "i"),
        "String"
      ]),
      "isnull": [
        await ctx.callKRLstdlib("isnull", [1]),
        await ctx.callKRLstdlib("isnull", [ctx.scope.get("some_string")]),
        await ctx.callKRLstdlib("isnull", [ctx.scope.get("nothing")])
      ],
      "typeof": [
        await ctx.callKRLstdlib("typeof", [1]),
        await ctx.callKRLstdlib("typeof", [ctx.scope.get("some_string")]),
        await ctx.callKRLstdlib("typeof", ["hi"]),
        await ctx.callKRLstdlib("typeof", [[
            1,
            2
          ]]),
        await ctx.callKRLstdlib("typeof", [{ "a": 1 }]),
        await ctx.callKRLstdlib("typeof", [new RegExp("foo", "")]),
        await ctx.callKRLstdlib("typeof", [ctx.scope.get("nothing")]),
        await ctx.callKRLstdlib("typeof", [void 0])
      ],
      "75.chr()": await ctx.callKRLstdlib("chr", [75]),
      "0.range(10)": await ctx.callKRLstdlib("range", [
        0,
        10
      ]),
      "10.sprintf": await ctx.callKRLstdlib("sprintf", [
        10,
        "< %d>"
      ]),
      ".capitalize()": await ctx.callKRLstdlib("capitalize", ["Hello World"]),
      ".decode()": await ctx.callKRLstdlib("decode", ["[3, 4, 5]"]),
      ".extract": await ctx.callKRLstdlib("extract", [
        "This is a string",
        new RegExp("(s.+).*(.ing)", "")
      ]),
      ".lc()": await ctx.callKRLstdlib("lc", ["Hello World"]),
      ".match true": await ctx.callKRLstdlib("match", [
        "Something",
        new RegExp("^S.*g$", "")
      ]),
      ".match false": await ctx.callKRLstdlib("match", [
        "Someone",
        new RegExp("^S.*g$", "")
      ]),
      ".ord()": await ctx.callKRLstdlib("ord", ["Hello"]),
      ".replace": await ctx.callKRLstdlib("replace", [
        "Hello William!",
        new RegExp("will", "i"),
        "Bill"
      ]),
      ".split": await ctx.callKRLstdlib("split", [
        "a;b;c",
        new RegExp(";", "")
      ]),
      ".sprintf": await ctx.callKRLstdlib("sprintf", [
        "Jim",
        "Hello %s!"
      ]),
      ".substr(5)": await ctx.callKRLstdlib("substr", [
        "This is a string",
        5
      ]),
      ".substr(5, 4)": await ctx.callKRLstdlib("substr", [
        "This is a string",
        5,
        4
      ]),
      ".substr(5, -5)": await ctx.callKRLstdlib("substr", [
        "This is a string",
        5,
        await ctx.callKRLstdlib("-", [5])
      ]),
      ".substr(25)": await ctx.callKRLstdlib("substr", [
        "This is a string",
        25
      ]),
      ".uc()": await ctx.callKRLstdlib("uc", ["Hello World"])
    });
    ctx.scope.set("returnMapAfterKlog", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.callKRLstdlib("klog", [
        { "a": 1 },
        "hi:"
      ]);
    }));
    ctx.scope.set("returnArrayAfterKlog", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.callKRLstdlib("klog", [
        [
          1,
          2
        ],
        "hi:"
      ]);
    }));
  },
  "rules": {}
};