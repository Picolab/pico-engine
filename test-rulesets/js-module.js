module.exports = {
  "rid": "io.picolabs.js-module",
  "version": "draft",
  "meta": { "shares": ["qFn"] },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const qFn = $env.krl.Function(["a"], async function (a) {
      return await $env.krl.assertFunction($ctx.module("myJsModule")["fun0"])($ctx, {
        "0": a,
        "b": 2
      });
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("js_module:action"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        var val = await $env.krl.assertAction($ctx.module("myJsModule")["act"])($ctx, {
          "0": 100,
          "b": 30
        });
        await $env.krl.assertAction(send_directive)($ctx, [
          "resp",
          { "val": val }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
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
        "qFn": function ($args) {
          return qFn($ctx, $args);
        },
        "__testing": function () {
          return {
            "queries": [{
                "name": "qFn",
                "args": ["a"]
              }],
            "events": [{
                "domain": "js_module",
                "name": "action",
                "attrs": []
              }]
          };
        }
      }
    };
  }
};