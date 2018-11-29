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
      "str_as_num": await ctx.applyFn(ctx.scope.get("as"), ctx, [
        "100.25",
        "Number"
      ]),
      "num_as_str": await ctx.applyFn(ctx.scope.get("as"), ctx, [
        1.05,
        "String"
      ]),
      "regex_as_str": await ctx.applyFn(ctx.scope.get("as"), ctx, [
        new RegExp("blah", "i"),
        "String"
      ]),
      "isnull": [
        await ctx.applyFn(ctx.scope.get("isnull"), ctx, [1]),
        await ctx.applyFn(ctx.scope.get("isnull"), ctx, [ctx.scope.get("some_string")]),
        await ctx.applyFn(ctx.scope.get("isnull"), ctx, [ctx.scope.get("nothing")])
      ],
      "typeof": [
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [1]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [ctx.scope.get("some_string")]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, ["hi"]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [[
            1,
            2
          ]]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [{ "a": 1 }]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [new RegExp("foo", "")]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [ctx.scope.get("nothing")]),
        await ctx.applyFn(ctx.scope.get("typeof"), ctx, [void 0])
      ],
      "75.chr()": await ctx.applyFn(ctx.scope.get("chr"), ctx, [75]),
      "0.range(10)": await ctx.applyFn(ctx.scope.get("range"), ctx, [
        0,
        10
      ]),
      "10.sprintf": await ctx.applyFn(ctx.scope.get("sprintf"), ctx, [
        10,
        "< %d>"
      ]),
      ".capitalize()": await ctx.applyFn(ctx.scope.get("capitalize"), ctx, ["Hello World"]),
      ".decode()": await ctx.applyFn(ctx.scope.get("decode"), ctx, ["[3, 4, 5]"]),
      ".extract": await ctx.applyFn(ctx.scope.get("extract"), ctx, [
        "This is a string",
        new RegExp("(s.+).*(.ing)", "")
      ]),
      ".lc()": await ctx.applyFn(ctx.scope.get("lc"), ctx, ["Hello World"]),
      ".match true": await ctx.applyFn(ctx.scope.get("match"), ctx, [
        "Something",
        new RegExp("^S.*g$", "")
      ]),
      ".match false": await ctx.applyFn(ctx.scope.get("match"), ctx, [
        "Someone",
        new RegExp("^S.*g$", "")
      ]),
      ".ord()": await ctx.applyFn(ctx.scope.get("ord"), ctx, ["Hello"]),
      ".replace": await ctx.applyFn(ctx.scope.get("replace"), ctx, [
        "Hello William!",
        new RegExp("will", "i"),
        "Bill"
      ]),
      ".split": await ctx.applyFn(ctx.scope.get("split"), ctx, [
        "a;b;c",
        new RegExp(";", "")
      ]),
      ".sprintf": await ctx.applyFn(ctx.scope.get("sprintf"), ctx, [
        "Jim",
        "Hello %s!"
      ]),
      ".substr(5)": await ctx.applyFn(ctx.scope.get("substr"), ctx, [
        "This is a string",
        5
      ]),
      ".substr(5, 4)": await ctx.applyFn(ctx.scope.get("substr"), ctx, [
        "This is a string",
        5,
        4
      ]),
      ".substr(5, -5)": await ctx.applyFn(ctx.scope.get("substr"), ctx, [
        "This is a string",
        5,
        await ctx.applyFn(ctx.scope.get("-"), ctx, [5])
      ]),
      ".substr(25)": await ctx.applyFn(ctx.scope.get("substr"), ctx, [
        "This is a string",
        25
      ]),
      ".uc()": await ctx.applyFn(ctx.scope.get("uc"), ctx, ["Hello World"])
    });
    ctx.scope.set("returnMapAfterKlog", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(ctx.scope.get("klog"), ctx, [
        { "a": 1 },
        "hi:"
      ]);
    }));
    ctx.scope.set("returnArrayAfterKlog", ctx.mkFunction([], async function (ctx, args) {
      return await ctx.applyFn(ctx.scope.get("klog"), ctx, [
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