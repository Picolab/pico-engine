module.exports = {
  "rid": "io.picolabs.guard-conditions",
  "version": "draft",
  "meta": { "shares": ["getB"] },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const match1 = $stdlib["match"];
    const getB1 = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("b");
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("foo:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var b2 = setting["b"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var b2 = $state.setting["b"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, [
          "foo",
          { "b": b2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if (await $env.krl.assertFunction(match1)($ctx, [
          b2,
          new RegExp("foo", "")
        ]))
        await $ctx.rsCtx.putEnt("b", b2);
    });
    $rs.when($env.SelectWhen.e("bar:a"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs([
        1,
        2,
        3
      ]);
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
        let x2 = $foreach0_pairs[$foreach0_i][1];
        $ctx.log.debug("rule selected", { "rule_name": "bar" });
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(send_directive1)($ctx, [
            "bar",
            {
              "x": x2,
              "b": await $ctx.rsCtx.getEnt("b")
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
          await $ctx.rsCtx.putEnt("b", x2);
      }
    });
    $rs.when($env.SelectWhen.e("on_final_no_foreach:a"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "on_final_no_foreach" });
      const x2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "x"
      ]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, [
          "on_final_no_foreach",
          { "x": x2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
        await $ctx.rsCtx.putEnt("b", x2);
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
        "getB": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getB1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [{
                "name": "getB",
                "args": []
              }],
            "events": [
              {
                "domain": "foo",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "bar",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "on_final_no_foreach",
                "name": "a",
                "attrs": ["x"]
              }
            ]
          };
        }
      }
    };
  }
};