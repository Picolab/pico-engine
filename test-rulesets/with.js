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
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const add = $env.krl.Function([
      "a",
      "b"
    ], async function (a, b) {
      return await $stdlib["+"]($ctx, [
        a,
        b
      ]);
    });
    const inc = $env.krl.Function(["n"], async function (n) {
      return await $env.krl.assertFunction(add)($ctx, {
        "0": 1,
        "b": n
      });
    });
    const foo = $env.krl.Function(["a"], async function (a) {
      return await $env.krl.assertFunction(add)($ctx, {
        "b": a,
        "a": await $stdlib["*"]($ctx, [
          a,
          2
        ])
      });
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
        "add": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return add($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "inc": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return inc($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "foo": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return foo($ctx, query.args);
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