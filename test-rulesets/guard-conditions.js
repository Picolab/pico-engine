module.exports = {
  "rid": "io.picolabs.guard-conditions",
  "meta": { "shares": ["getB"] },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const match1 = $stdlib["match"];
    const __testing1 = {
      "queries": [{
          "name": "getB",
          "args": []
        }],
      "events": [
        {
          "domain": "foo",
          "name": "a",
          "attrs": ["b"]
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
    const getB2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("b");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("foo:a", async function ($event, $state) {
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
      var b3 = setting["b"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo");
        $ctx.log.debug("rule selected", { "rule_name": "foo" });
        var b3 = $state.setting["b"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "foo",
            { "b": b3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if (await match1($ctx, [
            b3,
            new RegExp("foo", "")
          ]))
          await $ctx.rsCtx.putEnt("b", b3);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("bar:a"), async function ($event, $state, $last) {
      try {
        let $foreach0_pairs = $ctx.krl.toPairs([
          1,
          2,
          3
        ]);
        let $foreach0_len = $foreach0_pairs.length;
        let $foreach0_i;
        for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
          let x3 = $foreach0_pairs[$foreach0_i][1];
          $ctx.setCurrentRuleName("bar");
          $ctx.log.debug("rule selected", { "rule_name": "bar" });
          var $fired = true;
          if ($fired) {
            await send_directive1($ctx, [
              "bar",
              {
                "x": x3,
                "b": await $ctx.rsCtx.getEnt("b")
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
            await $ctx.rsCtx.putEnt("b", x3);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("on_final_no_foreach:a"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("on_final_no_foreach");
        $ctx.log.debug("rule selected", { "rule_name": "on_final_no_foreach" });
        const x3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "x"
        ]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "on_final_no_foreach",
            { "x": x3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
          await $ctx.rsCtx.putEnt("b", x3);
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
        "getB": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getB2($ctx, query.args);
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