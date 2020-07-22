module.exports = {
  "rid": "io.picolabs.with",
  "version": "draft",
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
    const add1 = $ctx.krl.Function([
      "a",
      "b"
    ], async function (a2, b2) {
      return await $stdlib["+"]($ctx, [
        a2,
        b2
      ]);
    });
    const inc1 = $ctx.krl.Function(["n"], async function (n2) {
      return await $ctx.krl.assertFunction(add1)($ctx, {
        "0": 1,
        "b": n2
      });
    });
    const foo1 = $ctx.krl.Function(["a"], async function (a2) {
      return await $ctx.krl.assertFunction(add1)($ctx, {
        "b": a2,
        "a": await $stdlib["*"]($ctx, [
          a2,
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
        "add": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return add1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "inc": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return inc1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "foo": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return foo1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
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
        }
      }
    };
  }
};