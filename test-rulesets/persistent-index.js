module.exports = {
  "rid": "io.picolabs.persistent-index",
  "version": "draft",
  "meta": {
    "shares": [
      "getFoo",
      "getFooKey",
      "getBaz",
      "getMaplist"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const getFoo1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("foo");
    });
    const getFooKey1 = $ctx.krl.Function(["key"], async function (key2) {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("foo"),
        key2
      ]);
    });
    const getBaz1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("baz");
    });
    const getMaplist1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("maplist");
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("pindex:setfoo"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "setfoo" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("foo", $event.data.attrs);
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putfoo"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "putfoo" });
      const key2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "key"
      ]);
      const value2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "value"
      ]);
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("foo", await $stdlib.set($ctx, [
        await $ctx.rsCtx.getEnt("foo"),
        key2,
        value2
      ]));
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:delfoo"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "delfoo" });
      const key2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "key"
      ]);
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("foo", await $stdlib.delete($ctx, [
        await $ctx.rsCtx.getEnt("foo"),
        key2
      ]));
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:nukefoo"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "nukefoo" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.delEnt("foo");
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putbaz"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "putbaz" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("baz", await $stdlib.set($ctx, [
        await $ctx.rsCtx.getEnt("baz"),
        [
          "one",
          "two"
        ],
        "three"
      ]));
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:setmaplist"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "setmaplist" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("maplist", [
        { "id": "one" },
        { "id": "two" },
        { "id": "three" }
      ]);
    });
    $rs.when($ctx.krl.SelectWhen.e("pindex:putmaplist"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "putmaplist" });
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("maplist", await $stdlib.set($ctx, [
        await $ctx.rsCtx.getEnt("maplist"),
        [
          1,
          "other"
        ],
        "thing"
      ]));
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
        "getFoo": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getFoo1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getFooKey": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getFooKey1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getBaz": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getBaz1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getMaplist": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getMaplist1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "getFoo",
                "args": []
              },
              {
                "name": "getFooKey",
                "args": ["key"]
              },
              {
                "name": "getBaz",
                "args": []
              },
              {
                "name": "getMaplist",
                "args": []
              }
            ],
            "events": [
              {
                "domain": "pindex",
                "name": "setfoo",
                "attrs": []
              },
              {
                "domain": "pindex",
                "name": "putfoo",
                "attrs": [
                  "key",
                  "value"
                ]
              },
              {
                "domain": "pindex",
                "name": "delfoo",
                "attrs": ["key"]
              },
              {
                "domain": "pindex",
                "name": "nukefoo",
                "attrs": []
              },
              {
                "domain": "pindex",
                "name": "putbaz",
                "attrs": []
              },
              {
                "domain": "pindex",
                "name": "setmaplist",
                "attrs": []
              },
              {
                "domain": "pindex",
                "name": "putmaplist",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};