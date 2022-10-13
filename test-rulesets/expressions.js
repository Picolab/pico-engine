module.exports = {
  "rid": "io.picolabs.expressions",
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
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
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
    const cond_exp_12 = true ? 1 : 2;
    const cond_exp_22 = false ? 1 : 2;
    const obj2 = {
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
    const path12 = await $stdlib["get"]($ctx, [
      obj2,
      [
        "b",
        "c",
        3,
        "d"
      ]
    ]);
    const path22 = await $stdlib["get"]($ctx, [
      obj2,
      [
        "b",
        "c",
        5
      ]
    ]);
    const index12 = await $stdlib["get"]($ctx, [
      obj2,
      ["a"]
    ]);
    const index22 = await $stdlib["get"]($ctx, [
      await $stdlib["get"]($ctx, [
        await $stdlib["get"]($ctx, [
          obj2,
          ["b"]
        ]),
        ["c"]
      ]),
      [1]
    ]);
    const not_true2 = !true;
    const not_null2 = !void 0;
    const true_or_false2 = true || false;
    const true_and_false2 = true && false;
    const incByN2 = $ctx.krl.Function(["n"], async function (n3) {
      return $ctx.krl.Function(["a"], async function (a4) {
        return await $stdlib["+"]($ctx, [
          a4,
          n3
        ]);
      });
    });
    const paramFn2 = $ctx.krl.Function([
      "foo",
      "bar",
      "baz",
      "qux"
    ], async function (foo3 = $default, bar3 = $default, baz3 = $default, qux3 = $default) {
      if (foo3 == $default) {
        foo3 = await incByN2($ctx, [3]);
      }
      if (bar3 == $default) {
        bar3 = await $ctx.krl.assertFunction(foo3)($ctx, [1]);
      }
      if (baz3 == $default) {
        baz3 = await $stdlib["+"]($ctx, [
          bar3,
          2
        ]);
      }
      if (qux3 == $default) {
        qux3 = await $stdlib["+"]($ctx, [
          baz3,
          "?"
        ]);
      }
      return [
        bar3,
        baz3,
        qux3
      ];
    });
    const paramFnTest2 = $ctx.krl.Function([], async function () {
      return [
        await paramFn2($ctx, []),
        await paramFn2($ctx, [
          await incByN2($ctx, [100]),
          "one"
        ]),
        await paramFn2($ctx, [
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
        "obj": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return obj2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path1": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path12;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "path2": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return path22;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index1": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index12;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "index2": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return index22;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "paramFnTest": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await paramFnTest2($ctx, query.args);
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