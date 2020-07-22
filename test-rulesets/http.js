module.exports = {
  "rid": "io.picolabs.http",
  "version": "draft",
  "meta": {
    "shares": [
      "getResp",
      "getLastPostEvent",
      "fnGet",
      "fnPost"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const $delete$1 = $stdlib["delete"];
    const set1 = $stdlib["set"];
    const decode1 = $stdlib["decode"];
    const url1 = $stdlib["url"];
    const send_directive1 = $stdlib["send_directive"];
    const getResp1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("resp");
    });
    const getLastPostEvent1 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("last_post_event");
    });
    const fmtResp1 = $ctx.krl.Function(["r"], async function (r2) {
      return await $ctx.krl.assertFunction($delete$1)($ctx, [
        await $ctx.krl.assertFunction($delete$1)($ctx, [
          await $ctx.krl.assertFunction($delete$1)($ctx, [
            await $ctx.krl.assertFunction($delete$1)($ctx, [
              await $ctx.krl.assertFunction(set1)($ctx, [
                r2,
                "content",
                await $ctx.krl.assertFunction(decode1)($ctx, [await $stdlib["get"]($ctx, [
                    r2,
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
    const doPost1 = $ctx.krl.Action([
      "base_url",
      "to",
      "msg"
    ], async function (base_url2, to2, msg2) {
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("http")["post"])(this, {
          "0": await $stdlib["+"]($ctx, [
            url1,
            "/msg.json"
          ]),
          "from": {
            "To": to2,
            "Msg": msg2
          }
        });
      }
    });
    const fnGet1 = $ctx.krl.Function([
      "url",
      "qs"
    ], async function (url2, qs2) {
      return await $ctx.krl.assertFunction($ctx.module("http")["get"])($ctx, {
        "0": url2,
        "qs": qs2
      });
    });
    const fnPost1 = $ctx.krl.Function([
      "url",
      "json"
    ], async function (url2, json2) {
      return await $ctx.krl.assertFunction($ctx.module("http")["post"])($ctx, {
        "0": url2,
        "json": json2
      });
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("http_test:get"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_get" });
      const url2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp2 = await $ctx.krl.assertAction($ctx.module("http")["get"])($ctx, {
          "0": url2,
          "qs": { "foo": "bar" },
          "headers": { "baz": "quix" }
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("resp", await $ctx.krl.assertFunction(fmtResp1)($ctx, [resp2]));
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_post" });
      const url2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp2 = await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url2,
          "json": {
            "foo": "bar",
            "baz": doPost1
          }
        });
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "resp.content.body",
          await $ctx.krl.assertFunction(decode1)($ctx, [await $stdlib["get"]($ctx, [
              await $ctx.krl.assertFunction(decode1)($ctx, [await $stdlib["get"]($ctx, [
                  resp2,
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
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post_action"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_post_action" });
      const url2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(doPost1)($ctx, [
          url2,
          "bob",
          "foobar"
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:post_setting"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_post_setting" });
      const url2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp2 = await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url2,
          "qs": { "foo": "bar" },
          "form": { "baz": "qux" }
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("resp", await $ctx.krl.assertFunction(fmtResp1)($ctx, [resp2]));
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("http_test:autoraise"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_autorase" });
      const url2 = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url2,
          "qs": { "foo": "bar" },
          "form": { "baz": "qux" },
          "autoraise": "foobar"
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("http:post"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "http_post_event_handler" });
      const resp2 = await $ctx.krl.assertFunction(fmtResp1)($ctx, [$event.data.attrs]);
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "http_post_event_handler",
          { "attrs": resp2 }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("last_post_event", resp2);
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
        "getResp": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getResp1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "getLastPostEvent": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getLastPostEvent1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "fnGet": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return fnGet1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "fnPost": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return fnPost1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "__testing": function () {
          return {
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
        }
      }
    };
  }
};