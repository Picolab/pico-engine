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
    const a = 1;
    const b = 2;
    const c = "<h1>some<b>html</b></h1>";
    const d = "\n            hi " + await $stdlib["as"]($ctx, [
      a,
      "String"
    ]) + " + " + await $stdlib["as"]($ctx, [
      b,
      "String"
    ]) + " = " + await $stdlib["as"]($ctx, [
      await $stdlib["+"]($ctx, [
        1,
        2
      ]),
      "String"
    ]) + "\n            " + await $stdlib["as"]($ctx, [
      c,
      "String"
    ]) + "\n        ";
    const e = "static";
    const f = "";
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
        "d": function ($args) {
          return d;
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