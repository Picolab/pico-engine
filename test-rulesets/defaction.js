module.exports = {
  "rid": "io.picolabs.defaction",
  "meta": {
    "shares": [
      "getSettingVal",
      "add"
    ]
  },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const noop1 = $stdlib["noop"];
    const __testing1 = {
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
          "name": "returns",
          "attrs": []
        },
        {
          "domain": "defa",
          "name": "scope",
          "attrs": []
        }
      ]
    };
    const add2 = $ctx.krl.Function([
      "a",
      "b"
    ], async function (a3, b3) {
      return {
        "type": "directive",
        "name": "add",
        "options": {
          "resp": await $stdlib["+"]($ctx, [
            a3,
            b3
          ])
        }
      };
    });
    const foo2 = $ctx.krl.Action(["a"], async function (a3) {
      const b3 = 2;
      var $fired = true;
      if ($fired) {
        await send_directive1(this, [
          "foo",
          {
            "a": a3,
            "b": await $stdlib["+"]($ctx, [
              b3,
              3
            ])
          }
        ]);
      }
    });
    const bar2 = $ctx.krl.Action([
      "one",
      "two",
      "three"
    ], async function (one3, two3 = $default, three3 = "3 by default") {
      if (two3 == $default) {
        two3 = await $stdlib["get"]($ctx, [
          await $ctx.krl.assertFunction(add2)($ctx, [
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
        var dir3 = await send_directive1(this, [
          "bar",
          {
            "a": one3,
            "b": two3,
            "c": three3
          }
        ]);
      }
      return dir3;
    });
    const getSettingVal2 = $ctx.krl.Function([], async function () {
      return await $ctx.rsCtx.getEnt("setting_val");
    });
    const chooser2 = $ctx.krl.Action(["val"], async function (val3) {
      var $fired = true;
      if ($fired) {
        switch (val3) {
        case "asdf":
          await foo2(this, [val3]);
          break;
        case "fdsa":
          await bar2(this, [
            val3,
            "ok",
            "done"
          ]);
          break;
        }
      }
    });
    const ifAnotB2 = $ctx.krl.Action([
      "a",
      "b"
    ], async function (a3, b3) {
      var $fired = a3 && !b3;
      if ($fired) {
        await send_directive1(this, ["yes a"]);
        await send_directive1(this, ["not b"]);
      }
    });
    const echoAction2 = $ctx.krl.Action([
      "a",
      "b",
      "c"
    ], async function (a3, b3, c3) {
      var $fired = true;
      if ($fired) {
        await noop1(this, []);
      }
      return [
        a3,
        b3,
        c3
      ];
    });
    const complexAction2 = $ctx.krl.Action([
      "a",
      "b"
    ], async function (a3, b3) {
      const c3 = 100;
      const d3 = await $stdlib["+"]($ctx, [
        c3,
        b3
      ]);
      var $fired = await $stdlib[">"]($ctx, [
        c3,
        0
      ]);
      if ($fired) {
        var dir3 = await send_directive1(this, [
          await $stdlib["+"]($ctx, [
            "wat:",
            a3
          ]),
          { "b": b3 }
        ]);
      }
      return await $stdlib["+"]($ctx, [
        await $stdlib["+"]($ctx, [
          await $stdlib["get"]($ctx, [
            dir3,
            ["name"]
          ]),
          " "
        ]),
        d3
      ]);
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("defa:foo"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("foo");
        $ctx.log.debug("rule selected", { "rule_name": "foo" });
        var $fired = true;
        if ($fired) {
          await foo2($ctx, ["bar"]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("defa:bar"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("bar");
        $ctx.log.debug("rule selected", { "rule_name": "bar" });
        var $fired = true;
        if ($fired) {
          await bar2($ctx, {
            "0": "baz",
            "two": "qux",
            "three": "quux"
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
    $rs.when($ctx.krl.SelectWhen.e("defa:bar_setting"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("bar_setting");
        $ctx.log.debug("rule selected", { "rule_name": "bar_setting" });
        var $fired = true;
        if ($fired) {
          var val3 = await bar2($ctx, {
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
          await $ctx.rsCtx.putEnt("setting_val", val3);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("defa:chooser"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("chooser");
        $ctx.log.debug("rule selected", { "rule_name": "chooser" });
        var $fired = true;
        if ($fired) {
          await chooser2($ctx, [await $stdlib["get"]($ctx, [
              $ctx.module("event")["attrs"]($ctx),
              "val"
            ])]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("defa:ifAnotB"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("ifAnotB");
        $ctx.log.debug("rule selected", { "rule_name": "ifAnotB" });
        var $fired = true;
        if ($fired) {
          await ifAnotB2($ctx, [
            await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
                "a"
              ]),
              "true"
            ]),
            await $stdlib["=="]($ctx, [
              await $stdlib["get"]($ctx, [
                $ctx.module("event")["attrs"]($ctx),
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
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("defa:returns"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("returns");
        $ctx.log.debug("rule selected", { "rule_name": "returns" });
        var $fired = true;
        if ($fired) {
          var abc3 = await echoAction2($ctx, [
            "where",
            "in",
            "the"
          ]);
          var d3 = await complexAction2($ctx, [
            await $stdlib["+"]($ctx, [
              await $stdlib["+"]($ctx, [
                await $stdlib["get"]($ctx, [
                  abc3,
                  [0]
                ]),
                await $stdlib["get"]($ctx, [
                  abc3,
                  [1]
                ])
              ]),
              await $stdlib["get"]($ctx, [
                abc3,
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
              abc3,
              [0]
            ]),
            await $stdlib["get"]($ctx, [
              abc3,
              [1]
            ]),
            await $stdlib["get"]($ctx, [
              abc3,
              [2]
            ]),
            d3
          ]);
        }
      } finally {
        $ctx.setCurrentRuleName(null);
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("defa:scope"), async function ($event, $state, $last) {
      try {
        $ctx.setCurrentRuleName("scope");
        $ctx.log.debug("rule selected", { "rule_name": "scope" });
        const something3 = $ctx.krl.Action([], async function () {
          var $fired = true;
          if ($fired) {
            await noop1(this, []);
          }
          return "did something!";
        });
        const send_directive3 = $ctx.krl.Action([], async function () {
          var $fired = true;
          if ($fired) {
            var foo4 = await noop1(this, []);
          }
          return await $stdlib["+"]($ctx, [
            "send wat? noop returned: ",
            foo4
          ]);
        });
        const echoAction3 = $ctx.krl.Action([], async function () {
          var $fired = true;
          if ($fired) {
            await noop1(this, []);
          }
          return [
            "aint",
            "no",
            "echo"
          ];
        });
        var $fired = true;
        if ($fired) {
          var abc3 = await echoAction3($ctx, [
            "where",
            "in",
            "the"
          ]);
          var d3 = await something3($ctx, []);
          var e3 = await send_directive3($ctx, []);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
        if ($fired) {
          await $ctx.rsCtx.putEnt("setting_val", [
            await $stdlib["get"]($ctx, [
              abc3,
              [0]
            ]),
            await $stdlib["get"]($ctx, [
              abc3,
              [1]
            ]),
            await $stdlib["get"]($ctx, [
              abc3,
              [2]
            ]),
            d3,
            e3
          ]);
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
        "getSettingVal": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await getSettingVal2($ctx, query.args);
          } finally {
            $ctx.setQuery(null);
          }
        },
        "add": async function (query, qid) {
          $ctx.setQuery(Object.assign({}, query, { "qid": qid }));
          try {
            return await add2($ctx, query.args);
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