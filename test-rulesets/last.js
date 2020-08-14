module.exports = {
  "rid": "io.picolabs.last",
  "meta": { "name": "testing postlude `last` statement" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": [
        {
          "domain": "last",
          "name": "all",
          "attrs": ["stop"]
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": ["stop"]
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": []
        },
        {
          "domain": "last",
          "name": "all",
          "attrs": []
        }
      ]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["foo"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        if (await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "stop"
            ]),
            "foo"
          ]))
          return $last();
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "bar" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["bar"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        if (await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "stop"
            ]),
            "bar"
          ]))
          return $last();
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "baz" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["baz"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        return $last();
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "qux" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["qux"]);
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
        "__testing": function () {
          return __testing1;
        }
      }
    };
  }
};