module.exports = {
  "rid": "io.picolabs.http",
  "meta": {
    "shares": [
      "getResp",
      "getLastPostEvent",
      "fnGet",
      "fnPost"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const $delete$1 = $stdlib["delete"];
    const set1 = $stdlib["set"];
    const decode1 = $stdlib["decode"];
    const send_directive1 = $stdlib["send_directive"];
    const __testing1 = {
      "queries": [
        {
          "name": "getResp",
          "args": []
        },
        {
          "name": "getLastPostEvent",
          "args": []
        },
        {
          "name": "fnGet",
          "args": [
            "url",
            "qs"
          ]
        },
        {
          "name": "fnPost",
          "args": [
            "url",
            "json"
          ]
        }
      ],
      "events": [
        {
          "domain": "http_test",
          "name": "get",
          "attrs": ["url"]
        },
        {
          "domain": "http_test",
          "name": "post",
          "attrs": ["url"]
        },
        {
          "domain": "http_test",
          "name": "post_action",
          "attrs": ["url"]
        },
        {
          "domain": "http_test",
          "name": "post_setting",
          "attrs": ["url"]
        },
        {
          "domain": "http_test",
          "name": "autoraise",
          "attrs": ["url"]
        },
        {
          "domain": "http",
          "name": "post",
          "attrs": []
        }
      ]
    };
    const getResp2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("resp");
    });
    const getLastPostEvent2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("last_post_event");
    });
    const fmtResp2 = $ctx.krl.Function(["r"], async function (r3) {
      return await $delete$1($ctx, [
        await $delete$1($ctx, [
          await $delete$1($ctx, [
            await $delete$1($ctx, [
              await set1($ctx, [
                r3,
                "content",
                await decode1($ctx, [await $stdlib["get"]($ctx, [
                    r3,
                    ["content"]
                  ])])
              ]),
              ["content_length"]
            ]),
            [
              "headers",
              "content-length"
            ]
          ]),
          [
            "headers",
            "date"
          ]
        ]),
        [
          "content",
          "headers",
          "content-length"
        ]
      ]);
    });
    const doPost2 = $ctx.krl.Action([
      "base_url",
      "to",
      "msg"
    ], async function (base_url3, to3, msg3) {
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("http")["post"])(this, {
          "0": await $stdlib["+"]($ctx, [
            base_url3,
            "/msg.json"
          ]),
          "from": {
            "To": to3,
            "Msg": msg3
          }
        });
      }
    });
    const fnGet2 = $ctx.krl.Function([
      "url",
      "qs"
    ], async function (url3, qs3) {
      return await $ctx.krl.assertFunction($ctx.module("http")["get"])($ctx, {
        "0": url3,
        "qs": qs3
      });
    });
    const fnPost2 = $ctx.krl.Function([
      "url",
      "json"
    ], async function (url3, json3) {
      return await $ctx.krl.assertFunction($ctx.module("http")["post"])($ctx, {
        "0": url3,
        "json": json3
      });
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("http_test:get"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_get");
        $ctx.log.debug("rule selected", { "rule_name": "http_get" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          var resp3 = await $ctx.krl.assertAction($ctx.module("http")["get"])($ctx, {
            "0": url3,
            "qs": { "foo": "bar" },
            "headers": { "baz": "quix" }
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("resp", await fmtResp2($ctx, [resp3]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_post");
        $ctx.log.debug("rule selected", { "rule_name": "http_post" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          var resp3 = await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
            "0": url3,
            "json": {
              "foo": "bar",
              "baz": doPost2
            }
          });
          await send_directive1($ctx, [
            "resp.content.body",
            await decode1($ctx, [await $stdlib["get"]($ctx, [
                await decode1($ctx, [await $stdlib["get"]($ctx, [
                    resp3,
                    ["content"]
                  ])]),
                ["body"]
              ])])
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post_action"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_post_action");
        $ctx.log.debug("rule selected", { "rule_name": "http_post_action" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          await doPost2($ctx, [
            url3,
            "bob",
            "foobar"
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post_setting"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_post_setting");
        $ctx.log.debug("rule selected", { "rule_name": "http_post_setting" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          var resp3 = await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
            "0": url3,
            "qs": { "foo": "bar" },
            "form": { "baz": "qux" }
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("resp", await fmtResp2($ctx, [resp3]));
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:autoraise"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_autorase");
        $ctx.log.debug("rule selected", { "rule_name": "http_autorase" });
        const url3 = await $stdlib["get"]($ctx, [
          $ctx.module("event")["attrs"]($ctx),
          "url"
        ]);
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
            "0": url3,
            "qs": { "foo": "bar" },
            "form": { "baz": "qux" },
            "autoraise": "foobar"
          });
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http:post"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("http_post_event_handler");
        $ctx.log.debug("rule selected", { "rule_name": "http_post_event_handler" });
        const resp3 = await fmtResp2($ctx, [$ctx.module("event")["attrs"]($ctx)]);
        var $fired = true;
        if ($fired) {
          await send_directive1($ctx, [
            "http_post_event_handler",
            { "attrs": resp3 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("last_post_event", resp3);
        }
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
        "getResp": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getResp2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getLastPostEvent": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getLastPostEvent2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "fnGet": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await fnGet2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "fnPost": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await fnPost2($ctx, query.args);
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