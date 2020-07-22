module.exports = {
  "rid": "io.picolabs.chevron",
  "version": "draft",
  "meta": {
    "description": "\nHello Chevrons!\n        ",
    "shares": ["d"]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const a1 = 1;
    const b1 = 2;
    const c1 = "<h1>some<b>html</b></h1>";
    const d1 = "\n            hi " + await $stdlib["as"]($ctx, [
      a1,
      "String"
    ]) + " + " + await $stdlib["as"]($ctx, [
      b1,
      "String"
    ]) + " = " + await $stdlib["as"]($ctx, [
      await $stdlib["+"]($ctx, [
        1,
        2
      ]),
      "String"
    ]) + "\n            " + await $stdlib["as"]($ctx, [
      c1,
      "String"
    ]) + "\n        ";
    const e1 = "static";
    const f1 = "";
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
        "d": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return d1;
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [{
                "name": "d",
                "args": []
              }],
            "events": []
          };
        }
      }
    };
  }
};