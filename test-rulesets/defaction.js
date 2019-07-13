module.exports = {
  "rid": "io.picolabs.defaction",
  "version": "draft",
  "meta": {
    "shares": [
      "getSettingVal",
      "add",
      "echoAction"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const noop = $stdlib["noop"];
    const send_directive = $ctx.module("custom")["send_directive"];
    const add = $env.krl.Function([
      "a",
      "b"
    ], async function (a, b) {
      return {
        "type": "directive",
        "name": "add",
        "options": {
          "resp": await $stdlib["+"]($ctx, [
            a,
            b
          ])
        }
      };
    });
    const foo = $env.krl.Action(["a"], async function (a) {
      const b = 2;
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "foo",
          {
            "a": a,
            "b": await $stdlib["+"]($ctx, [
              b,
              3
            ])
          }
        ]);
      }
    });
    const bar = $env.krl.Action([
      "one",
      "two",
      "three"
    ], async function (one, two = $default, three = "3 by default") {
      if (two == $default) {
        two = await $stdlib["get"]($ctx, [
          await $env.krl.assertFunction(add)($ctx, [
            1,
            1
          ]),
          [
            "options",
            "resp"
          ]
        ]);
      }
      var $fired = true;
      if ($fired) {
        var dir = await $env.krl.assertAction(send_directive)($ctx, [
          "bar",
          {
            "a": one,
            "b": two,
            "c": three
          }
        ]);
      }
      return dir;
    });
    const getSettingVal = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("setting_val");
    });
    const chooser = $env.krl.Action(["val"], async function (val) {
      var $fired = true;
      if ($fired) {
        switch (val) {
        case "asdf":
          await $env.krl.assertAction(foo)($ctx, [val]);
          break;
        case "fdsa":
          await $env.krl.assertAction(bar)($ctx, [
            val,
            "ok",
            "done"
          ]);
          break;
        }
      }
    });
    const ifAnotB = $env.krl.Action([
      "a",
      "b"
    ], async function (a, b) {
      var $fired = a && !b;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, ["yes a"]);
        await $env.krl.assertAction(send_directive)($ctx, ["not b"]);
      }
    });
    const echoAction = $env.krl.Action([
      "a",
      "b",
      "c"
    ], async function (a, b, c) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(noop)($ctx, []);
      }
      return [
        a,
        b,
        c
      ];
    });
    const complexAction = $env.krl.Action([
      "a",
      "b"
    ], async function (a, b) {
      const c = 100;
      const d = await $stdlib["+"]($ctx, [
        c,
        b
      ]);
      var $fired = await $stdlib[">"]($ctx, [
        c,
        0
      ]);
      if ($fired) {
        var dir = await $env.krl.assertAction(send_directive)($ctx, [
          await $stdlib["+"]($ctx, [
            "wat:",
            a
          ]),
          { "b": b }
        ]);
      }
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["get"]($ctx, [
            dir,
            ["name"]
          ]),
          " "
        ]),
        d
      ]);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("defa:foo"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(foo)($ctx, ["bar"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:bar"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(bar)($ctx, {
          "0": "baz",
          "two": "qux",
          "three": "quux"
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:bar_setting"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        var val = await $env.krl.assertAction(bar)($ctx, {
          "0": "baz",
          "two": "qux",
          "three": "quux"
        });
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("setting_val", val);
      }
    });
    $rs.when($env.SelectWhen.e("defa:chooser"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(chooser)($ctx, [await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "val"
          ])]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:ifAnotB"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(ifAnotB)($ctx, [
          await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "a"
            ]),
            "true"
          ]),
          await $stdlib["=="]($ctx, [
            await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "b"
            ]),
            "true"
          ])
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:add"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(add)($ctx, [
          1,
          2
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:returns"), async function ($event, $state) {
      var $fired = true;
      if ($fired) {
        var abc = await $env.krl.assertAction(echoAction)($ctx, [
          "where",
          "in",
          "the"
        ]);
        var d = await $env.krl.assertAction(complexAction)($ctx, [
          await $stdlib["+"]($ctx, [
            await $stdlib["+"]($ctx, [
              await $stdlib["get"]($ctx, [
                abc,
                [0]
              ]),
              await $stdlib["get"]($ctx, [
                abc,
                [1]
              ])
            ]),
            await $stdlib["get"]($ctx, [
              abc,
              [2]
            ])
          ]),
          333
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("setting_val", [
          await $stdlib["get"]($ctx, [
            abc,
            [0]
          ]),
          await $stdlib["get"]($ctx, [
            abc,
            [1]
          ]),
          await $stdlib["get"]($ctx, [
            abc,
            [2]
          ]),
          d
        ]);
      }
    });
    $rs.when($env.SelectWhen.e("defa:scope"), async function ($event, $state) {
      const something = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(noop)($ctx, []);
        }
        return "did something!";
      });
      const send_directive = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          var foo = await $env.krl.assertAction(noop)($ctx, []);
        }
        return await $stdlib["+"]($ctx, [
          "send wat? noop returned: ",
          foo
        ]);
      });
      const echoAction = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(noop)($ctx, []);
        }
        return [
          "aint",
          "no",
          "echo"
        ];
      });
      var $fired = true;
      if ($fired) {
        var abc = await $env.krl.assertAction(echoAction)($ctx, [
          "where",
          "in",
          "the"
        ]);
        var d = await $env.krl.assertAction(something)($ctx, []);
        var e = await $env.krl.assertAction(send_directive)($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("setting_val", [
          await $stdlib["get"]($ctx, [
            abc,
            [0]
          ]),
          await $stdlib["get"]($ctx, [
            abc,
            [1]
          ]),
          await $stdlib["get"]($ctx, [
            abc,
            [2]
          ]),
          d,
          e
        ]);
      }
    });
    $rs.when($env.SelectWhen.e("defa:trying_to_use_action_as_fn"), async function ($event, $state) {
      const val = await $env.krl.assertFunction(foo)($ctx, [100]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
          "trying_to_use_action_as_fn",
          { "val": val }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    return {
      "event": async function (event) {
        await $rs.send(event);
      },
      "query": {
        "getSettingVal": function ($args) {
          return getSettingVal($ctx, $args);
        },
        "add": function ($args) {
          return add($ctx, $args);
        },
        "echoAction": function ($args) {
          return echoAction;
        },
        "__testing": function () {
          return {
            "queries": [
              {
                "name": "getSettingVal",
                "args": []
              },
              {
                "name": "add",
                "args": [
                  "a",
                  "b"
                ]
              },
              {
                "name": "echoAction",
                "args": []
              }
            ],
            "events": [
              {
                "domain": "defa",
                "name": "foo",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "bar",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "bar_setting",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "chooser",
                "attrs": ["val"]
              },
              {
                "domain": "defa",
                "name": "ifAnotB",
                "attrs": [
                  "a",
                  "b"
                ]
              },
              {
                "domain": "defa",
                "name": "add",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "returns",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "scope",
                "attrs": []
              },
              {
                "domain": "defa",
                "name": "trying_to_use_action_as_fn",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};