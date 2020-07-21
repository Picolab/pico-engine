module.exports = {
  "rid": "io.picolabs.test-error-messages",
  "version": "draft",
  "meta": {
    "description": "\nThis is a ruleset that will compile, but does things\nthe wrong way to test how they are handled at runtime\n        ",
    "shares": [
      "hello",
      "null_val",
      "somethingNotDefined",
      "infiniteRecursion"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const hello1 = $env.krl.Function(["obj"], async function (obj2) {
      return await $stdlib["+"]($ctx, [
        "Hello ",
        obj2
      ]);
    });
    const null_val1 = void 0;
    const infiniteRecursion1 = $env.krl.Function([], async function () {
      return await $env.krl.assertFunction(infiniteRecursion1)($ctx, []);
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
        "hello": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return hello1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "null_val": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return null_val1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "somethingNotDefined": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return somethingNotDefined1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "infiniteRecursion": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return infiniteRecursion1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
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
                "name": "somethingNotDefined",
                "args": []
              },
              {
                "name": "infiniteRecursion",
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