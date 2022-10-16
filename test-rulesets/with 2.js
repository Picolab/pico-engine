module.exports = {
  "rid": "io.picolabs.with",
  "meta": {
    "shares": [
      "add",
      "inc",
      "foo"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "add",
          "args": [
            "a",
            "b"
          ]
        },
        {
          "name": "inc",
          "args": ["n"]
        },
        {
          "name": "foo",
          "args": ["a"]
        }
      ],
      "events": []
    };
    const add2 = $ctx.krl.Function([
      "a",
      "b"
    ], async function (a3, b3) {
      return await $stdlib["+"]($ctx, [
        a3,
        b3
      ]);
    });
    const inc2 = $ctx.krl.Function(["n"], async function (n3) {
      return await add2($ctx, {
        "0": 1,
        "b": n3
      });
    });
    const foo2 = $ctx.krl.Function(["a"], async function (a3) {
      return await add2($ctx, {
        "b": a3,
        "a": await $stdlib["*"]($ctx, [
          a3,
          2
        ])
      });
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
        "add": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await add2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "inc": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await inc2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "foo": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await foo2($ctx, query.args);
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