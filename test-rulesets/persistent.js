module.exports = {
  "rid": "io.picolabs.persistent",
  "meta": {
    "shares": [
      "getName",
      "getUser",
      "getUserFirstname"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
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
          "attrs": ["name"]
        },
        {
          "domain": "store",
          "name": "user_firstname",
          "attrs": ["firstname"]
        },
        {
          "domain": "store",
          "name": "clear_user",
          "attrs": []
        }
      ]
    };
    const getName2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("name");
    });
    const getUser2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("user");
    });
    const getUserFirstname2 = $ctx.krl.Function([], async function () {
      return await $stdlib.get($ctx, [
        await $ctx.rsCtx.getEnt("user"),
        ["firstname"]
      ]);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("store:name", async function ($event, $state) {
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
      var my_name3 = setting["my_name"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("store_my_name");
        $ctx.log.debug("rule selected", { "rule_name": "store_my_name" });
        var my_name3 = $state.setting["my_name"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "store_name",
            { "name": my_name3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("store_my_name", $fired);
        await $ctx.rsCtx.putEnt("name", my_name3);
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("store:user_firstname", async function ($event, $state) {
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
      var firstname3 = setting["firstname"] = matches[0];
      return {
        "match": true,
        "state": Object.assign({}, $state, { "setting": Object.assign({}, $state.setting || {}, setting) })
      };
    }), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("store_user_firstname");
        $ctx.log.debug("rule selected", { "rule_name": "store_user_firstname" });
        var firstname3 = $state.setting["firstname"];
        this.rule.state = Object.assign({}, $state, { "setting": {} });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "store_user_firstname",
            { "name": firstname3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("store_user_firstname", $fired);
        await $ctx.rsCtx.putEnt("user", { "lastname": "McCoy" });
        await $ctx.rsCtx.putEnt("user", await $stdlib.set($ctx, [
          await $ctx.rsCtx.getEnt("user"),
          ["firstname"],
          firstname3
        ]));
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("store:clear_user"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("clear_user");
        $ctx.log.debug("rule selected", { "rule_name": "clear_user" });
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, ["clear_user"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        $ctx.recordRuleOutcome("clear_user", $fired);
        await $ctx.rsCtx.delEnt("user");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    const $consoleGlobalRefs = {
      "getName": getName2,
      "getUser": getUser2,
      "getUserFirstname": getUserFirstname2
    };
    const $rulesetKrlSource = "ruleset io.picolabs.persistent {\n    meta {\n        shares getName, getUser, getUserFirstname\n    }\n    global {\n        getName = function(){\n            ent:name;\n        }\n        getUser = function(){\n            ent:user;\n        }\n        getUserFirstname = function(){\n            ent:user{[\"firstname\"]};\n        }\n    }\n    rule store_my_name {\n        select when store name name re#^(.*)$# setting(my_name)\n\n        send_directive(\"store_name\", {\"name\": my_name});\n\n        always {\n            ent:name := my_name\n        }\n    }\n    rule store_user_firstname {\n        select when store user_firstname firstname re#^(.*)$# setting(firstname)\n\n        send_directive(\"store_user_firstname\", {\"name\": firstname});\n\n        always {\n            ent:user := {\"lastname\": \"McCoy\"};\n            ent:user{[\"firstname\"]} := firstname\n        }\n    }\n    rule clear_user {\n        select when store clear_user\n\n        send_directive(\"clear_user\");\n\n        always {\n            clear ent:user\n        }\n    }\n}\n";
    const $compileEvalExpression = $ctx["compileEvalExpression"];
    const $consoleEvalCache = new Map();
    const $runConsoleEval = async expr => {
      let runner = $consoleEvalCache.get(expr);
      if (!runner) {
        runner = $compileEvalExpression(expr, { rulesetKrl: $rulesetKrlSource }).run;
        $consoleEvalCache.set(expr, runner);
      }
      return await runner($ctx, $consoleGlobalRefs);
    };
    return {
      "event": async function (event, eid) {
        $ctx.setEvent(Object.assign({}, event, { "eid": eid }));
        try {
          await $rs.send(event);
        } finally {
          $ctx.setEvent(null);
        }
        return {
          "directives": $ctx.drainDirectives(),
          "ruleOutcomes": $ctx.drainRuleOutcomes()
        };
      },
      "query": {
        "getName": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getName2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getUser": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getUser2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getUserFirstname": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getUserFirstname2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return __testing1;
        },
        "__consoleEval": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await $runConsoleEval(query["args"]["expr"]);
          } finally {
            $ctx.setQuery(null);
          }
        }
      },
      "consoleGlobalRefs": $consoleGlobalRefs
    };
  }
};
