module.exports = {
  "rid": "io.picolabs.within",
  "version": "draft",
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.within(5 * 60000, $env.SelectWhen.before($env.SelectWhen.e("foo:a"), $env.SelectWhen.e("foo:b")), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["foo"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.within(await $stdlib["+"]($ctx, [
      1,
      3
    ]) * 1000, $env.SelectWhen.before($env.SelectWhen.e("bar:a"), $env.SelectWhen.e("bar:b")), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "bar" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["bar"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.within(1 * 31536000000, $env.SelectWhen.or($env.SelectWhen.e("baz:a"), $env.SelectWhen.and($env.SelectWhen.e("baz:b"), $env.SelectWhen.e("baz:c"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "baz" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["baz"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.within(2 * 1000, $env.SelectWhen.repeat(3, $env.SelectWhen.e("qux:a", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("c", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "b") ? $stdlib.as($ctx, [
        $event.data.attrs["b"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    })), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "qux" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["qux"]);
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
            "events": [
              {
                "domain": "foo",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "foo",
                "name": "b",
                "attrs": []
              },
              {
                "domain": "bar",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "bar",
                "name": "b",
                "attrs": []
              },
              {
                "domain": "baz",
                "name": "a",
                "attrs": []
              },
              {
                "domain": "baz",
                "name": "b",
                "attrs": []
              },
              {
                "domain": "baz",
                "name": "c",
                "attrs": []
              },
              {
                "domain": "qux",
                "name": "a",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};