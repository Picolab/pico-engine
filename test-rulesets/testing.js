module.exports = {
  "rid": "io.picolabs.testing",
  "version": "draft",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "say",
          "name": "hello",
          "attrs": ["name"]
        }]
    };
    const __testing2 = {
      "queries": [{ "name": "joke" }],
      "event": await $stdlib["get"]($ctx, [
        __testing1,
        ["events"]
      ])
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("say:hello"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "say_hello" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("said", await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "name"
      ]));
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
        "__testing": function () {
          return __testing2;
        }
      }
    };
  }
};