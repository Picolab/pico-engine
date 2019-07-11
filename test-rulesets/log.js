module.exports = {
  "rid": "io.picolabs.log",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const match = $stdlib.match;
    const split = $stdlib.split;
    const reduce = $stdlib.reduce;
    const range = $stdlib.range;
    const map = $stdlib.map;
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("log:levels"), async function ($event, $state) {
      var fired = true;
      if (fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if (fired) {
        $ctx.log.info("hello default");
        $ctx.log.error("hello error");
        $ctx.log.warn("hello warn");
        $ctx.log.info("hello info");
        $ctx.log.debug("hello debug");
      }
    });
    return {
      "event": async function (event) {
        await $rs.send(event);
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