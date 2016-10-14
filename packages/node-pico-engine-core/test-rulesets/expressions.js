module.exports = {
  "rid": "io.picolabs.expressions",
  "meta": {
    "shares": [
      "obj",
      "path1",
      "path2",
      "index1",
      "index2"
    ]
  },
  "global": function (ctx) {
    ctx.scope.set("cond_exp_1", true ? 1 : 2);
    ctx.scope.set("cond_exp_2", false ? 1 : 2);
    ctx.scope.set("obj", {
      "a": 1,
      "b": {
        "c": [
          2,
          3,
          4,
          { "d": { "e": 5 } },
          6,
          7
        ]
      }
    });
    ctx.callKRLstdlib("set", ctx.scope.get("obj"), [
      "b",
      "c",
      3,
      "d",
      "e"
    ], "changed 5");
    ctx.callKRLstdlib("set", ctx.scope.get("obj"), ["a"], "changed 1");
    ctx.scope.set("path1", ctx.callKRLstdlib("get", ctx.scope.get("obj"), [
      "b",
      "c",
      3,
      "d"
    ]));
    ctx.scope.set("path2", ctx.callKRLstdlib("get", ctx.scope.get("obj"), [
      "b",
      "c",
      5
    ]));
    ctx.scope.set("index1", ctx.callKRLstdlib("get", ctx.scope.get("obj"), ["a"]));
    ctx.scope.set("index2", ctx.callKRLstdlib("get", ctx.callKRLstdlib("get", ctx.callKRLstdlib("get", ctx.scope.get("obj"), ["b"]), ["c"]), [1]));
    ctx.scope.set("not_true", !true);
    ctx.scope.set("not_null", !void 0);
    ctx.scope.set("true_or_false", true || false);
    ctx.scope.set("true_and_false", true && false);
  },
  "rules": {}
};