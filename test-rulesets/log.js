module.exports = {
  "rid": "io.picolabs.log",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("log:levels"), async function ($event, $state, $last) {
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
            "events": [{
                "domain": "log",
                "name": "levels",
                "attrs": []
              }]
          };
        }
      }
    };
  }
};