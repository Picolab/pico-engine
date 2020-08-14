module.exports = {
  "rid": "io.picolabs.within",
  "version": "draft",
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
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
          "attrs": ["b"]
        }
      ]
    };
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.within(5 * 60000, $ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("foo:a"), $ctx.krl.SelectWhen.e("foo:b")), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["foo"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.within(await $stdlib["+"]($ctx, [
      1,
      3
    ]) * 1000, $ctx.krl.SelectWhen.before($ctx.krl.SelectWhen.e("bar:a"), $ctx.krl.SelectWhen.e("bar:b")), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "bar" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["bar"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.within(1 * 31536000000, $ctx.krl.SelectWhen.or($ctx.krl.SelectWhen.e("baz:a"), $ctx.krl.SelectWhen.and($ctx.krl.SelectWhen.e("baz:b"), $ctx.krl.SelectWhen.e("baz:c"))), function ($event, $state) {
      return Object.assign({}, $state, { "setting": {} });
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "baz" });
      var $fired = true;
      if ($fired) {
        await send_directive1($ctx, ["baz"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.within(2 * 1000, $ctx.krl.SelectWhen.repeat(3, $ctx.krl.SelectWhen.e("qux:a", async function ($event, $state) {
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
        await send_directive1($ctx, ["qux"]);
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