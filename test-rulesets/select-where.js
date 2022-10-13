module.exports = {
  "rid": "io.picolabs.select_where",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": []
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("*", async function ($event, $state) {
      return {
        "match": true,
        "state": $state
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("all");
        $ctx.log.debug("rule selected", { "rule_name": "all" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "all",
            {
              "domain": $ctx.module("event")["domain"]($ctx),
              "name": $ctx.module("event")["name"]($ctx),
              "attrs": $ctx.module("event")["attrs"]($ctx)
            }
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
      try {
        $ctx.setCurrentRuleName("set_watcher");
        $ctx.log.debug("rule selected", { "rule_name": "set_watcher" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("watcher", await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "domain"
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
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
      try {
        $ctx.setCurrentRuleName("watcher");
        $ctx.log.debug("rule selected", { "rule_name": "watcher" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["watcher matched!"]);
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
        "__testing": function () {
          return __testing1;
        }
      }
    };
  }
};