module.exports = {
  "rid": "io.picolabs.operators",
  "meta": {
    "shares": [
      "results",
      "returnMapAfterKlog",
      "returnArrayAfterKlog"
    ]
  },
  "global": function (ctx) {
    ctx.scope.set("nothing", void 0);
    ctx.scope.set("some_string", "foo");
    ctx.scope.set("results", {
      "str_as_num": ctx.callKRLstdlib("as", "100.25", "Number"),
      "num_as_str": ctx.callKRLstdlib("as", 1.05, "String"),
      "regex_as_str": ctx.callKRLstdlib("as", new RegExp("blah", "i"), "String"),
      "isnull": [
        ctx.callKRLstdlib("isnull", 1),
        ctx.callKRLstdlib("isnull", ctx.scope.get("some_string")),
        ctx.callKRLstdlib("isnull", ctx.scope.get("nothing"))
      ],
      "typeof": [
        ctx.callKRLstdlib("typeof", 1),
        ctx.callKRLstdlib("typeof", ctx.scope.get("some_string")),
        ctx.callKRLstdlib("typeof", "hi"),
        ctx.callKRLstdlib("typeof", [
          1,
          2
        ]),
        ctx.callKRLstdlib("typeof", { "a": 1 }),
        ctx.callKRLstdlib("typeof", new RegExp("foo", "")),
        ctx.callKRLstdlib("typeof", ctx.scope.get("nothing")),
        ctx.callKRLstdlib("typeof", void 0)
      ],
      "75.chr()": ctx.callKRLstdlib("chr", 75),
      "0.range(10)": ctx.callKRLstdlib("range", 0, 10),
      "10.sprintf": ctx.callKRLstdlib("sprintf", 10, "< %d>"),
      ".capitalize()": ctx.callKRLstdlib("capitalize", "Hello World"),
      ".decode()": ctx.callKRLstdlib("decode", "[3, 4, 5]"),
      ".extract": ctx.callKRLstdlib("extract", "This is a string", new RegExp("(s.+).*(.ing)", "")),
      ".lc()": ctx.callKRLstdlib("lc", "Hello World"),
      ".match true": ctx.callKRLstdlib("match", "Something", new RegExp("^S.*g$", "")),
      ".match false": ctx.callKRLstdlib("match", "Someone", new RegExp("^S.*g$", "")),
      ".ord()": ctx.callKRLstdlib("ord", "Hello"),
      ".replace": ctx.callKRLstdlib("replace", "Hello William!", new RegExp("will", "i"), "Bill"),
      ".split": ctx.callKRLstdlib("split", "a;b;c", new RegExp(";", "")),
      ".sprintf": ctx.callKRLstdlib("sprintf", "Jim", "Hello %s!"),
      ".substr(5)": ctx.callKRLstdlib("substr", "This is a string", 5),
      ".substr(5, 4)": ctx.callKRLstdlib("substr", "This is a string", 5, 4),
      ".substr(5, -5)": ctx.callKRLstdlib("substr", "This is a string", 5, -5),
      ".substr(25)": ctx.callKRLstdlib("substr", "This is a string", 25),
      ".uc()": ctx.callKRLstdlib("uc", "Hello World")
    });
    ctx.scope.set("returnMapAfterKlog", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.callKRLstdlib("klog", { "a": 1 }, "hi:");
    }));
    ctx.scope.set("returnArrayAfterKlog", ctx.KRLClosure(ctx, function (ctx) {
      return ctx.callKRLstdlib("klog", [
        1,
        2
      ], "hi:");
    }));
  },
  "rules": {}
};