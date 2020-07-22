module.exports = {
  "rid": "io.picolabs.error",
  "version": "draft",
  "meta": { "shares": ["getErrors"] },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const append1 = $stdlib["append"];
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [{
          "name": "getErrors",
          "args": []
        }],
      "events": [
        {
          "domain": "system",
          "name": "error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "continue_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "continue_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "stop_on_error",
          "attrs": []
        },
        {
          "domain": "error",
          "name": "stop_on_error",
          "attrs": []
        }
      ]
    };
    const getErrors2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("error_log");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("system:error"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "error_handle" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("error_log", await append1($ctx, [
          await $ctx.rsCtx.getEnt("error_log"),
          $event.data.attrs
        ]));
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:continue_on_error"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "continue_on_errorA" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["continue_on_errorA"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "debug",
        "data": "continue_on_errorA debug",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorA",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "info",
        "data": "continue_on_errorA info",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorA",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "warn",
        "data": "continue_on_errorA warn",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorA",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
    });
    $rs.when($ctx.krl.SelectWhen.e("error:continue_on_error"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "continue_on_errorB" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["continue_on_errorB"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "debug",
        "data": "continue_on_errorB debug",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorB",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "info",
        "data": "continue_on_errorB info",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorB",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
      await $ctx.rsCtx.raiseEvent("system", "error", {
        "level": "warn",
        "data": "continue_on_errorB warn",
        "rid": $ctx.rsCtx.ruleset.rid,
        "rule_name": "continue_on_errorB",
        "genus": "user"
      }, $ctx.rsCtx.ruleset.rid);
    });
    $rs.when($ctx.krl.SelectWhen.e("error:stop_on_error"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "stop_on_errorA" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["stop_on_errorA"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      {
        $last();
        $ctx.rsCtx.clearSchedule();
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "error",
          "data": "stop_on_errorA 1",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "stop_on_errorA",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        return;
      }
      {
        $last();
        $ctx.rsCtx.clearSchedule();
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "error",
          "data": "stop_on_errorA 2 this should not fire b/c the first error stops execution",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "stop_on_errorA",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        return;
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("error:stop_on_error"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "stop_on_errorB" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["stop_on_errorB"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      {
        $last();
        $ctx.rsCtx.clearSchedule();
        await $ctx.rsCtx.raiseEvent("system", "error", {
          "level": "error",
          "data": "stop_on_errorB 3 this should not fire b/c the first error clears the schedule",
          "rid": $ctx.rsCtx.ruleset.rid,
          "rule_name": "stop_on_errorB",
          "genus": "user"
        }, $ctx.rsCtx.ruleset.rid);
        return;
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
        "getErrors": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getErrors2($ctx, query.args);
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