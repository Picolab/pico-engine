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
    const $delete$ = $stdlib["delete"];
    const set = $stdlib["set"];
    const decode = $stdlib["decode"];
    const url = $stdlib["url"];
    const send_directive = $stdlib["send_directive"];
    const getResp = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("resp");
    });
    const getLastPostEvent = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("last_post_event");
    });
    const fmtResp = $env.krl.Function(["r"], async function (r) {
      return await $env.krl.assertFunction($delete$)($ctx, [
        await $env.krl.assertFunction($delete$)($ctx, [
          await $env.krl.assertFunction($delete$)($ctx, [
            await $env.krl.assertFunction($delete$)($ctx, [
              await $env.krl.assertFunction(set)($ctx, [
                r,
                "content",
                await $env.krl.assertFunction(decode)($ctx, [await $stdlib["get"]($ctx, [
                    r,
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
    const doPost = $env.krl.Action([
      "base_url",
      "to",
      "msg"
    ], async function (base_url, to, msg) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": await $stdlib["+"]($ctx, [
            url,
            "/msg.json"
          ]),
          "from": {
            "To": to,
            "Msg": msg
          }
        });
      }
    });
    const fnGet = $env.krl.Function([
      "url",
      "qs"
    ], async function (url, qs) {
      return await $env.krl.assertFunction($ctx.module("http")["get"])($ctx, {
        "0": url,
        "qs": qs
      });
    });
    const fnPost = $env.krl.Function([
      "url",
      "json"
    ], async function (url, json) {
      return await $env.krl.assertFunction($ctx.module("http")["post"])($ctx, {
        "0": url,
        "json": json
      });
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("http_test:get"), async function ($event, $state, $last) {
      const url = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp = await $env.krl.assertAction($ctx.module("http")["get"])($ctx, {
          "0": url,
          "qs": { "foo": "bar" },
          "headers": { "baz": "quix" }
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("resp", await $env.krl.assertFunction(fmtResp)($ctx, [resp]));
      }
    });
    $rs.when($env.SelectWhen.e("http_test:post"), async function ($event, $state, $last) {
      const url = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp = await $env.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url,
          "json": {
            "foo": "bar",
            "baz": doPost
          }
        });
        await $env.krl.assertAction(send_directive)($ctx, [
          "resp.content.body",
          await $env.krl.assertFunction(decode)($ctx, [await $stdlib["get"]($ctx, [
              await $env.krl.assertFunction(decode)($ctx, [await $stdlib["get"]($ctx, [
                  resp,
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
    $rs.when($env.SelectWhen.e("http_test:post_action"), async function ($event, $state, $last) {
      const url = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(doPost)($ctx, [
          url,
          "bob",
          "foobar"
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("http_test:post_setting"), async function ($event, $state, $last) {
      const url = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        var resp = await $env.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url,
          "qs": { "foo": "bar" },
          "form": { "baz": "qux" }
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("resp", await $env.krl.assertFunction(fmtResp)($ctx, [resp]));
      }
    });
    $rs.when($env.SelectWhen.e("http_test:autoraise"), async function ($event, $state, $last) {
      const url = await $stdlib["get"]($ctx, [
        $event.data.attrs,
        "url"
      ]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction($ctx.module("http")["post"])($ctx, {
          "0": url,
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
    $rs.when($env.SelectWhen.e("http:post"), async function ($event, $state, $last) {
      const resp = await $env.krl.assertFunction(fmtResp)($ctx, [$event.data.attrs]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "http_post_event_handler",
          { "attrs": resp }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("last_post_event", resp);
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
        "getResp": function ($args) {
          return getResp($ctx, $args);
        },
        "getLastPostEvent": function ($args) {
          return getLastPostEvent($ctx, $args);
        },
        "fnGet": function ($args) {
          return fnGet($ctx, $args);
        },
        "fnPost": function ($args) {
          return fnPost($ctx, $args);
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