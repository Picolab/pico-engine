module.exports = {
  "rid": "io.picolabs.select_where",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
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
    $rs.when($env.SelectWhen.e("*", async function ($event, $state) {
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
    $rs.when($env.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": await $stdlib["=="]($ctx, [
          $ctx.module("event")["domain"]($ctx),
          await $ctx.rsCtx.getEnt("watcher")
        ]),
        "state": $state
      };
    }), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["watcher matched!"]);
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