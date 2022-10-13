module.exports = {
  "rid": "io.picolabs.hello_world",
  "meta": {
    "version": "0.0.0",
    "name": "Hello World",
    "description": "\nA first ruleset for the Quickstart\n    ",
    "author": "Phil Windley",
    "shares": [
      "hello",
      "said"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const __testing1 = {
      "queries": [
        {
          "name": "hello",
          "args": ["name"]
        },
        {
          "name": "said",
          "args": []
        }
      ],
      "events": [{
          "domain": "say",
          "name": "hello",
          "attrs": ["name"]
        }]
    };
    const hello2 = $ctx.krl.Function(["name"], async function ($name$3 = "default") {
      const msg3 = await $stdlib["+"]($ctx, [
        "Hello ",
        $name$3
      ]);
      return msg3;
    });
    const said2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("said");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("say:hello"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("say_hello");
        $ctx.log.debug("rule selected", { "rule_name": "say_hello" });
        var $fired = true;
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        await $ctx.rsCtx.putEnt("said", await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "name"
        ]));
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
        "hello": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await hello2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "said": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await said2($ctx, query.args);
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