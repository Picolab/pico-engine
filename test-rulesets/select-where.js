module.exports = {
  "rid": "io.picolabs.select_where",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "all" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "all",
          {
            "domain": $ctx.module("event")["domain"]($ctx),
            "name": $ctx.module("event")["name"]($ctx),
            "attrs": $event.data.attrs
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": await $stdlib["=="]($ctx, [
          $ctx.module("event")["domain"]($ctx),
          "set"
        ]) && await $stdlib["=="]($ctx, [
          $ctx.module("event")["name"]($ctx),
          "watcher"
        ]),
        "state": $state
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "set_watcher" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("watcher", await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "domain"
      ]));
    });
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": await $stdlib["=="]($ctx, [
          $ctx.module("event")["domain"]($ctx),
          await $ctx.rsCtx.getEnt("watcher")
        ]),
        "state": $state
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "watcher" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, ["watcher matched!"]);
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
          return {
            "queries": [],
            "events": []
          };
        }
      }
    };
  }
};