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
      "str_as_num": ctx.krl.stdlib["as"]("100.25", "Number"),
      "num_as_str": ctx.krl.stdlib["as"](1.05, "String"),
      "regex_as_str": ctx.krl.stdlib["as"](new RegExp("blah", "i"), "String"),
      "isnull": [
        ctx.krl.stdlib["isnull"](1),
        ctx.krl.stdlib["isnull"](ctx.scope.get("some_string")),
        ctx.krl.stdlib["isnull"](ctx.scope.get("nothing"))
      ],
      "typeof": [
        ctx.krl.stdlib["typeof"](1),
        ctx.krl.stdlib["typeof"](ctx.scope.get("some_string")),
        ctx.krl.stdlib["typeof"]("hi"),
        ctx.krl.stdlib["typeof"]([
          1,
          2
        ]),
        ctx.krl.stdlib["typeof"]({ "a": 1 }),
        ctx.krl.stdlib["typeof"](new RegExp("foo", "")),
        ctx.krl.stdlib["typeof"](ctx.scope.get("nothing")),
        ctx.krl.stdlib["typeof"](void 0)
      ],
      "75.chr()": ctx.krl.stdlib["chr"](75),
      "0.range(10)": ctx.krl.stdlib["range"](0, 10),
      "10.sprintf": ctx.krl.stdlib["sprintf"](10, "< %d>"),
      ".capitalize()": ctx.krl.stdlib["capitalize"]("Hello World"),
      ".decode()": ctx.krl.stdlib["decode"]("[3, 4, 5]"),
      ".extract": ctx.krl.stdlib["extract"]("This is a string", new RegExp("(s.+).*(.ing)", "")),
      ".lc()": ctx.krl.stdlib["lc"]("Hello World"),
      ".match true": ctx.krl.stdlib["match"]("Something", new RegExp("^S.*g$", "")),
      ".match false": ctx.krl.stdlib["match"]("Someone", new RegExp("^S.*g$", "")),
      ".ord()": ctx.krl.stdlib["ord"]("Hello"),
      ".replace": ctx.krl.stdlib["replace"]("Hello William!", new RegExp("will", "i"), "Bill"),
      ".split": ctx.krl.stdlib["split"]("a;b;c", new RegExp(";", "")),
      ".sprintf": ctx.krl.stdlib["sprintf"]("Jim", "Hello %s!"),
      ".substr(5)": ctx.krl.stdlib["substr"]("This is a string", 5),
      ".substr(5, 4)": ctx.krl.stdlib["substr"]("This is a string", 5, 4),
      ".substr(5, -5)": ctx.krl.stdlib["substr"]("This is a string", 5, -5),
      ".substr(25)": ctx.krl.stdlib["substr"]("This is a string", 25),
      ".uc()": ctx.krl.stdlib["uc"]("Hello World")
    });
    ctx.scope.set("returnMapAfterKlog", ctx.krl.Closure(ctx, function (ctx) {
      return ctx.krl.stdlib["klog"]({ "a": 1 }, "hi:");
    }));
    ctx.scope.set("returnArrayAfterKlog", ctx.krl.Closure(ctx, function (ctx) {
      return ctx.krl.stdlib["klog"]([
        1,
        2
      ], "hi:");
    }));
  },
  "rules": {}
};