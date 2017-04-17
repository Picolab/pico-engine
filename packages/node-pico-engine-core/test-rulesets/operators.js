module.exports = {
  "rid": "io.picolabs.operators",
  "meta": {
    "shares": [
      "results",
      "returnMapAfterKlog",
      "returnArrayAfterKlog"
    ]
  },
  "global": function* (ctx) {
    ctx.scope.set("nothing", void 0);
    ctx.scope.set("some_string", "foo");
    ctx.scope.set("results", {
      "str_as_num": yield ctx.callKRLstdlib("as", "100.25", "Number"),
      "num_as_str": yield ctx.callKRLstdlib("as", 1.05, "String"),
      "regex_as_str": yield ctx.callKRLstdlib("as", new RegExp("blah", "i"), "String"),
      "isnull": [
        yield ctx.callKRLstdlib("isnull", 1),
        yield ctx.callKRLstdlib("isnull", ctx.scope.get("some_string")),
        yield ctx.callKRLstdlib("isnull", ctx.scope.get("nothing"))
      ],
      "typeof": [
        yield ctx.callKRLstdlib("typeof", 1),
        yield ctx.callKRLstdlib("typeof", ctx.scope.get("some_string")),
        yield ctx.callKRLstdlib("typeof", "hi"),
        yield ctx.callKRLstdlib("typeof", [
          1,
          2
        ]),
        yield ctx.callKRLstdlib("typeof", { "a": 1 }),
        yield ctx.callKRLstdlib("typeof", new RegExp("foo", "")),
        yield ctx.callKRLstdlib("typeof", ctx.scope.get("nothing")),
        yield ctx.callKRLstdlib("typeof", void 0)
      ],
      "75.chr()": yield ctx.callKRLstdlib("chr", 75),
      "0.range(10)": yield ctx.callKRLstdlib("range", 0, 10),
      "10.sprintf": yield ctx.callKRLstdlib("sprintf", 10, "< %d>"),
      ".capitalize()": yield ctx.callKRLstdlib("capitalize", "Hello World"),
      ".decode()": yield ctx.callKRLstdlib("decode", "[3, 4, 5]"),
      ".extract": yield ctx.callKRLstdlib("extract", "This is a string", new RegExp("(s.+).*(.ing)", "")),
      ".lc()": yield ctx.callKRLstdlib("lc", "Hello World"),
      ".match true": yield ctx.callKRLstdlib("match", "Something", new RegExp("^S.*g$", "")),
      ".match false": yield ctx.callKRLstdlib("match", "Someone", new RegExp("^S.*g$", "")),
      ".ord()": yield ctx.callKRLstdlib("ord", "Hello"),
      ".replace": yield ctx.callKRLstdlib("replace", "Hello William!", new RegExp("will", "i"), "Bill"),
      ".split": yield ctx.callKRLstdlib("split", "a;b;c", new RegExp(";", "")),
      ".sprintf": yield ctx.callKRLstdlib("sprintf", "Jim", "Hello %s!"),
      ".substr(5)": yield ctx.callKRLstdlib("substr", "This is a string", 5),
      ".substr(5, 4)": yield ctx.callKRLstdlib("substr", "This is a string", 5, 4),
      ".substr(5, -5)": yield ctx.callKRLstdlib("substr", "This is a string", 5, yield ctx.callKRLstdlib("-", 5)),
      ".substr(25)": yield ctx.callKRLstdlib("substr", "This is a string", 25),
      ".uc()": yield ctx.callKRLstdlib("uc", "Hello World")
    });
    ctx.scope.set("returnMapAfterKlog", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.callKRLstdlib("klog", { "a": 1 }, "hi:");
    }));
    ctx.scope.set("returnArrayAfterKlog", ctx.KRLClosure(function* (ctx, getArg) {
      return yield ctx.callKRLstdlib("klog", [
        1,
        2
      ], "hi:");
    }));
  },
  "rules": {}
};