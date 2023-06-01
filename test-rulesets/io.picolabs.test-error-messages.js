module.exports = {
  "rid": "io.picolabs.test-error-messages",
  "meta": {
    "description": "\nThis is a ruleset that will compile, but does things\nthe wrong way to test how they are handled at runtime\n        ",
    "shares": [
      "hello",
      "null_val",
      "infiniteRecursion"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "hello",
          "args": ["obj"]
        },
        {
          "name": "null_val",
          "args": []
        },
        {
          "name": "infiniteRecursion",
          "args": []
        }
      ],
      "events": []
    };
    const hello2 = $ctx.krl.Function(["obj"], async function (obj3) {
      return await $stdlib["+"]($ctx, [
        "Hello ",
        obj3
      ]);
    });
    const null_val2 = void 0;
    const infiniteRecursion2 = $ctx.krl.Function([], async function () {
      return await $ctx.krl.assertFunction(infiniteRecursion2)($ctx, []);
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
        "hello": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await hello2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "null_val": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return null_val2;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "infiniteRecursion": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await infiniteRecursion2($ctx, query.args);
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