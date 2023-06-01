module.exports = {
  "rid": "io.picolabs.js-module",
  "meta": { "shares": ["qFn"] },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
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
    const qFn2 = $ctx.krl.Function(["a"], async function (a3) {
      return await $ctx.krl.assertFunction($ctx.module("myJsModule")["fun0"])($ctx, {
        "0": a3,
        "b": 2
      });
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("js_module:action"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("action");
        $ctx.log.debug("rule selected", { "rule_name": "action" });
        var $fired = true;
        if ($fired) {
          var val3 = await $ctx.krl.assertAction($ctx.module("myJsModule")["act"])($ctx, {
            "0": 100,
            "b": 30
          });
          await send_directive1($ctx, [
            "resp",
            { "val": val3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
        "qFn": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await qFn2($ctx, query.args);
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