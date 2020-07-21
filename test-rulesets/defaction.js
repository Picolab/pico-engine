module.exports = {
  "rid": "io.picolabs.defaction",
  "version": "draft",
  "meta": {
    "shares": [
      "getSettingVal",
      "add"
    ]
  },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const noop1 = $stdlib["noop"];
    const add1 = $env.krl.Function([
      "a",
      "b"
    ], async function (a2, b2) {
      return {
        "type": "directive",
        "name": "add",
        "options": {
          "resp": await $stdlib["+"]($ctx, [
            a2,
            b2
          ])
        }
      };
    });
    const foo1 = $env.krl.Action(["a"], async function (a2) {
      const b2 = 2;
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)(this, [
          "foo",
          {
            "a": a2,
            "b": await $stdlib["+"]($ctx, [
              b2,
              3
            ])
          }
        ]);
      }
    });
    const bar1 = $env.krl.Action([
      "one",
      "two",
      "three"
    ], async function (one2, two2 = $default, three2 = "3 by default") {
      if (two2 == $default) {
        two2 = await $stdlib["get"]($ctx, [
          await $env.krl.assertFunction(add1)($ctx, [
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
        var dir2 = await $env.krl.assertAction(send_directive1)(this, [
          "bar",
          {
            "a": one2,
            "b": two2,
            "c": three2
          }
        ]);
      }
      return dir2;
    });
    const getSettingVal1 = $env.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("setting_val");
    });
    const chooser1 = $env.krl.Action(["val"], async function (val2) {
      var $fired = true;
      if ($fired) {
        switch (val2) {
        case "asdf":
          await $env.krl.assertAction(foo1)(this, [val2]);
          break;
        case "fdsa":
          await $env.krl.assertAction(bar1)(this, [
            val2,
            "ok",
            "done"
          ]);
          break;
        }
      }
    });
    const ifAnotB1 = $env.krl.Action([
      "a",
      "b"
    ], async function (a2, b2) {
      var $fired = a2 && !b2;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)(this, ["yes a"]);
        await $env.krl.assertAction(send_directive1)(this, ["not b"]);
      }
    });
    const echoAction1 = $env.krl.Action([
      "a",
      "b",
      "c"
    ], async function (a2, b2, c2) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(noop1)(this, []);
      }
      return [
        a2,
        b2,
        c2
      ];
    });
    const complexAction1 = $env.krl.Action([
      "a",
      "b"
    ], async function (a2, b2) {
      const c2 = 100;
      const d2 = await $stdlib["+"]($ctx, [
        c2,
        b2
      ]);
      var $fired = await $stdlib[">"]($ctx, [
        c2,
        0
      ]);
      if ($fired) {
        var dir2 = await $env.krl.assertAction(send_directive1)(this, [
          await $stdlib["+"]($ctx, [
            "wat:",
            a2
          ]),
          { "b": b2 }
        ]);
      }
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["get"]($ctx, [
            dir2,
            ["name"]
          ]),
          " "
        ]),
        d2
      ]);
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("defa:foo"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "foo" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(foo1)($ctx, ["bar"]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:bar"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "bar" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(bar1)($ctx, {
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
    $rs.when($env.SelectWhen.e("defa:bar_setting"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "bar_setting" });
      var $fired = true;
      if ($fired) {
        var val2 = await $env.krl.assertAction(bar1)($ctx, {
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
        await $ctx.rsCtx.putEnt("setting_val", val2);
      }
    });
    $rs.when($env.SelectWhen.e("defa:chooser"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "chooser" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(chooser1)($ctx, [await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "val"
          ])]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:ifAnotB"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "ifAnotB" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(ifAnotB1)($ctx, [
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
    $rs.when($env.SelectWhen.e("defa:add"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "add" });
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(add1)($ctx, [
          1,
          2
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($env.SelectWhen.e("defa:returns"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "returns" });
      var $fired = true;
      if ($fired) {
        var abc2 = await $env.krl.assertAction(echoAction1)($ctx, [
          "where",
          "in",
          "the"
        ]);
        var d2 = await $env.krl.assertAction(complexAction1)($ctx, [
          await $stdlib["+"]($ctx, [
            await $stdlib["+"]($ctx, [
              await $stdlib["get"]($ctx, [
                abc2,
                [0]
              ]),
              await $stdlib["get"]($ctx, [
                abc2,
                [1]
              ])
            ]),
            await $stdlib["get"]($ctx, [
              abc2,
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
            abc2,
            [0]
          ]),
          await $stdlib["get"]($ctx, [
            abc2,
            [1]
          ]),
          await $stdlib["get"]($ctx, [
            abc2,
            [2]
          ]),
          d2
        ]);
      }
    });
    $rs.when($env.SelectWhen.e("defa:scope"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "scope" });
      const something2 = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(noop1)(this, []);
        }
        return "did something!";
      });
      const send_directive2 = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          var foo3 = await $env.krl.assertAction(noop1)(this, []);
        }
        return await $stdlib["+"]($ctx, [
          "send wat? noop returned: ",
          foo3
        ]);
      });
      const echoAction2 = $env.krl.Action([], async function () {
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(noop1)(this, []);
        }
        return [
          "aint",
          "no",
          "echo"
        ];
      });
      var $fired = true;
      if ($fired) {
        var abc2 = await $env.krl.assertAction(echoAction2)($ctx, [
          "where",
          "in",
          "the"
        ]);
        var d2 = await $env.krl.assertAction(something2)($ctx, []);
        var e2 = await $env.krl.assertAction(send_directive2)($ctx, []);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
      if ($fired) {
        await $ctx.rsCtx.putEnt("setting_val", [
          await $stdlib["get"]($ctx, [
            abc2,
            [0]
          ]),
          await $stdlib["get"]($ctx, [
            abc2,
            [1]
          ]),
          await $stdlib["get"]($ctx, [
            abc2,
            [2]
          ]),
          d2,
          e2
        ]);
      }
    });
    $rs.when($env.SelectWhen.e("defa:trying_to_use_action_as_fn"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "trying_to_use_action_as_fn" });
      const val2 = await $env.krl.assertFunction(foo1)($ctx, [100]);
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive1)($ctx, [
          "trying_to_use_action_as_fn",
          { "val": val2 }
        ]);
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
        "getSettingVal": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return getSettingVal1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "add": function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return add1($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
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