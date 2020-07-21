module.exports = {
  "rid": "io.picolabs.persistent",
  "version": "draft",
  "meta": {
    "shares": [
      "getName",
      "getUser",
      "getUserFirstname"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const getName1 = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("name");
    });
    const getUser1 = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("user");
    });
    const getUserFirstname1 = $env.krl.Function([], async function () {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("user"),
        ["firstname"]
      ]);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("store:name", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "name") ? $stdlib.as($ctx, [
        $event.data.attrs["name"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var my_name2 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "store_my_name" });
      var my_name2 = $state.setting["my_name"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, [
          "store_name",
          { "name": my_name2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("name", my_name2);
    });
    $rs.when($env.SelectWhen.e("store:user_firstname", async function ($event, $state) {
      var matches = [];
      var setting = {};
      var m;
      var j;
      m = new RegExp("^(.*)$", "").exec(Object.prototype.hasOwnProperty.call($event.data.attrs, "firstname") ? $stdlib.as($ctx, [
        $event.data.attrs["firstname"],
        "String"
      ]) : "");
      if (!m)
        return { "match": false };
      for (j = 1; j < m.length; j++)
        matches.push(m[j]);
      var firstname2 = setting["firstname"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "store_user_firstname" });
      var firstname2 = $state.setting["firstname"];
      this.rule.state = Object.assign({}, $state, { "setting": {} });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, [
          "store_user_firstname",
          { "name": firstname2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.putEnt("user", { "lastname": "McCoy" });
      await $ctx.rsCtx.putEnt("user", await $stdlib.set($ctx, [
        await $ctx.rsCtx.getEnt("user"),
        ["firstname"],
        firstname2
      ]));
    });
    $rs.when($env.SelectWhen.e("store:clear_user"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "clear_user" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, ["clear_user"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      await $ctx.rsCtx.delEnt("user");
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
        "getName": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getName1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getUser": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getUser1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getUserFirstname": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getUserFirstname1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "getName",
                "args": []
              },
              {
                "name": "getUser",
                "args": []
              },
              {
                "name": "getUserFirstname",
                "args": []
              }
            ],
            "events": [
              {
                "domain": "store",
                "name": "name",
                "attrs": []
              },
              {
                "domain": "store",
                "name": "user_firstname",
                "attrs": []
              },
              {
                "domain": "store",
                "name": "clear_user",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};