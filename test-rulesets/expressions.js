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
    const cond_exp_1 = true ? 1 : 2;
    const cond_exp_2 = false ? 1 : 2;
    const obj = {
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
    const path1 = await $stdlib["get"]($ctx, [
      obj,
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]);
    const path2 = await $stdlib["get"]($ctx, [
      obj,
      [
        "b",
        "c",
        5
      ]
    ]);
    const index1 = await $stdlib["get"]($ctx, [
      obj,
      ["a"]
    ]);
    const index2 = await $stdlib["get"]($ctx, [
      await $stdlib["get"]($ctx, [
        await $stdlib["get"]($ctx, [
          obj,
          ["b"]
        ]),
        ["c"]
      ]),
      [1]
    ]);
    const not_true = !true;
    const not_null = !void 0;
    const true_or_false = true || false;
    const true_and_false = true && false;
    const incByN = $env.krl.Function(["n"], async function (n) {
      return $env.krl.Function(["a"], async function (a) {
        return await $stdlib["+"]($ctx, [
          a,
          n
        ]);
      });
    });
    const paramFn = $env.krl.Function([
      "foo",
      "bar",
      "baz",
      "qux"
    ], async function (foo = $default, bar = $default, baz = $default, qux = $default) {
      if (foo == $default) {
        foo = await $env.krl.assertFunction(incByN)($ctx, [3]);
      }
      if (bar == $default) {
        bar = await $env.krl.assertFunction(foo)($ctx, [1]);
      }
      if (baz == $default) {
        baz = await $stdlib["+"]($ctx, [
          bar,
          2
        ]);
      }
      if (qux == $default) {
        qux = await $stdlib["+"]($ctx, [
          baz,
          "?"
        ]);
      }
      return [
        bar,
        baz,
        qux
      ];
    });
    const paramFnTest = $env.krl.Function([], async function () {
      return [
        await $env.krl.assertFunction(paramFn)($ctx, []),
        await $env.krl.assertFunction(paramFn)($ctx, [
          await $env.krl.assertFunction(incByN)($ctx, [100]),
          "one"
        ]),
        await $env.krl.assertFunction(paramFn)($ctx, [
          void 0,
          3,
          4,
          5
        ])
      ];
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
        "obj": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return obj;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path2": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index1": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index2": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "paramFnTest": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return paramFnTest($ctx, query.args);
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