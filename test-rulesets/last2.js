module.exports = {
  "rid": "io.picolabs.last2",
  "meta": { "name": "This second ruleset tests that `last` only stops the current ruleset" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "last",
          "name": "all",
          "attrs": []
        }]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("last:all"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["last2 foo"]);
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