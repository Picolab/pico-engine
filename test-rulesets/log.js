module.exports = {
  "rid": "io.picolabs.log",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [],
      "events": [{
          "domain": "log",
          "name": "levels",
          "attrs": []
        }]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("log:levels"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("levels");
        $ctx.log.debug("rule selected", { "rule_name": "levels" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          $ctx.log.info("hello default");
          $ctx.log.error("hello error");
          $ctx.log.warn("hello warn");
          $ctx.log.info("hello info");
          $ctx.log.debug("hello debug");
        }
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