module.exports = {
  "rid": "io.picolabs.expressions",
  "version": "draft",
  "meta": {
    "shares": [
      "obj",
      "path1",
      "path2",
      "index1",
      "index2",
      "paramFnTest"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const cond_exp_11 = true ? 1 : 2;
    const cond_exp_21 = false ? 1 : 2;
    const obj1 = {
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
    };
    const path11 = await $stdlib["get"]($ctx, [
      obj1,
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]);
    const path21 = await $stdlib["get"]($ctx, [
      obj1,
      [
        "b",
        "c",
        5
      ]
    ]);
    const index11 = await $stdlib["get"]($ctx, [
      obj1,
      ["a"]
    ]);
    const index21 = await $stdlib["get"]($ctx, [
      await $stdlib["get"]($ctx, [
        await $stdlib["get"]($ctx, [
          obj1,
          ["b"]
        ]),
        ["c"]
      ]),
      [1]
    ]);
    const not_true1 = !true;
    const not_null1 = !void 0;
    const true_or_false1 = true || false;
    const true_and_false1 = true && false;
    const incByN1 = $ctx.krl.Function(["n"], async function (n2) {
      return $ctx.krl.Function(["a"], async function (a3) {
        return await $stdlib["+"]($ctx, [
          a3,
          n2
        ]);
      });
    });
    const paramFn1 = $ctx.krl.Function([
      "foo",
      "bar",
      "baz",
      "qux"
    ], async function (foo2 = $default, bar2 = $default, baz2 = $default, qux2 = $default) {
      if (foo2 == $default) {
        foo2 = await $ctx.krl.assertFunction(incByN1)($ctx, [3]);
      }
      if (bar2 == $default) {
        bar2 = await $ctx.krl.assertFunction(foo2)($ctx, [1]);
      }
      if (baz2 == $default) {
        baz2 = await $stdlib["+"]($ctx, [
          bar2,
          2
        ]);
      }
      if (qux2 == $default) {
        qux2 = await $stdlib["+"]($ctx, [
          baz2,
          "?"
        ]);
      }
      return [
        bar2,
        baz2,
        qux2
      ];
    });
    const paramFnTest1 = $ctx.krl.Function([], async function () {
      return [
        await $ctx.krl.assertFunction(paramFn1)($ctx, []),
        await $ctx.krl.assertFunction(paramFn1)($ctx, [
          await $ctx.krl.assertFunction(incByN1)($ctx, [100]),
          "one"
        ]),
        await $ctx.krl.assertFunction(paramFn1)($ctx, [
          void 0,
          3,
          4,
          5
        ])
      ];
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
        "obj": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return obj1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path11;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path2": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path21;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index11;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index2": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index21;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "paramFnTest": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return paramFnTest1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "obj",
                "args": []
              },
              {
                "name": "path1",
                "args": []
              },
              {
                "name": "path2",
                "args": []
              },
              {
                "name": "index1",
                "args": []
              },
              {
                "name": "index2",
                "args": []
              },
              {
                "name": "paramFnTest",
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