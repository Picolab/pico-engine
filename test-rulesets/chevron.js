module.exports = {
  "rid": "io.picolabs.chevron",
  "meta": {
    "description": "\nHello Chevrons!\n        ",
    "shares": ["d"]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [{
          "name": "d",
          "args": []
        }],
      "events": []
    };
    const a2 = 1;
    const b2 = 2;
    const c2 = "<h1>some<b>html</b></h1>";
    const d2 = "\n            hi " + await $stdlib["as"]($ctx, [
      a2,
      "String"
    ]) + " + " + await $stdlib["as"]($ctx, [
      b2,
      "String"
    ]) + " = " + await $stdlib["as"]($ctx, [
      await $stdlib["+"]($ctx, [
        1,
        2
      ]),
      "String"
    ]) + "\n            " + await $stdlib["as"]($ctx, [
      c2,
      "String"
    ]) + "\n        ";
    const e2 = "static";
    const f2 = "";
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
        "d": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return d2;
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