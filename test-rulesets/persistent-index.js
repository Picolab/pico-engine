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
    const getFoo = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("foo");
    });
    const getFooKey = $env.krl.Function(["key"], async function (key) {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("foo"),
        key
      ]);
    });
    const getBaz = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("baz");
    });
    const getMaplist = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("maplist");
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("pindex:setfoo"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("foo", $event.data.attrs);
    });
    $rs.when($env.SelectWhen.e("pindex:putfoo"), async function ($event, $state, $last) {
      const key = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "key"
      ]);
      const value = await $stdlib["get"]($ctx, [
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
        key,
        value
      ]));
    });
    $rs.when($env.SelectWhen.e("pindex:delfoo"), async function ($event, $state, $last) {
      const key = await $stdlib["get"]($ctx, [
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
        key
      ]));
    });
    $rs.when($env.SelectWhen.e("pindex:nukefoo"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.delEnt("foo");
    });
    $rs.when($env.SelectWhen.e("pindex:putbaz"), async function ($event, $state, $last) {
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
    $rs.when($env.SelectWhen.e("pindex:setmaplist"), async function ($event, $state, $last) {
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
    $rs.when($env.SelectWhen.e("pindex:putmaplist"), async function ($event, $state, $last) {
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
            return getFoo($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getFooKey": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getFooKey($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getBaz": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getBaz($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getMaplist": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getMaplist($ctx, query.args);
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