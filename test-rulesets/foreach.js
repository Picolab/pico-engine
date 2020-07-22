module.exports = {
  "rid": "io.picolabs.foreach",
  "version": "draft",
  "meta": { "name": "testing foreach" },
  "init": async function ($rsCtx, $mkCtx) {
    const $default = Symbol("default");
    const $ctx = $mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive1 = $stdlib["send_directive"];
    const range1 = $stdlib["range"];
    const split1 = $stdlib["split"];
    const doubleThis1 = $ctx.krl.Function(["arr"], async function (arr2) {
      return [
        arr2,
        arr2
      ];
    });
    const $rs = new $ctx.krl.SelectWhen.SelectWhen();
    $rs.when($ctx.krl.SelectWhen.e("foreach:basic"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs([
        1,
        2,
        3
      ]);
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
        let x2 = $foreach0_pairs[$foreach0_i][1];
        $ctx.log.debug("rule selected", { "rule_name": "basic" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction(send_directive1)($ctx, [
            "basic",
            { "x": x2 }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:map"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs({
        "a": 1,
        "b": 2,
        "c": 3
      });
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
        let v2 = $foreach0_pairs[$foreach0_i][1];
        let k2 = $foreach0_pairs[$foreach0_i][0];
        $ctx.log.debug("rule selected", { "rule_name": "map" });
        var $fired = true;
        if ($fired) {
          await $ctx.krl.assertAction(send_directive1)($ctx, [
            "map",
            {
              "k": k2,
              "v": v2
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:nested"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs([
        1,
        2,
        3
      ]);
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let x2 = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $ctx.krl.toPairs([
          "a",
          "b",
          "c"
        ]);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
          let y2 = $foreach1_pairs[$foreach1_i][1];
          $ctx.log.debug("rule selected", { "rule_name": "nested" });
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction(send_directive1)($ctx, [
              "nested",
              {
                "x": x2,
                "y": y2
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
        }
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:scope"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction(doubleThis1)($ctx, [[
          1,
          2,
          3
        ]]));
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let arr2 = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $ctx.krl.toPairs(arr2);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let foo2 = $foreach1_pairs[$foreach1_i][1];
          let $foreach2_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction(range1)($ctx, [
            0,
            foo2
          ]));
          let $foreach2_len = $foreach2_pairs.length;
          let $foreach2_i;
          for ($foreach2_i = 0; $foreach2_i < $foreach2_len; $foreach2_i++) {
            let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1 && $foreach2_i === $foreach2_len - 1;
            let bar2 = $foreach2_pairs[$foreach2_i][1];
            $ctx.log.debug("rule selected", { "rule_name": "scope" });
            const baz2 = await $stdlib["*"]($ctx, [
              foo2,
              bar2
            ]);
            var $fired = true;
            if ($fired) {
              await $ctx.krl.assertAction(send_directive1)($ctx, [
                "scope",
                {
                  "foo": foo2,
                  "bar": bar2,
                  "baz": baz2
                }
              ]);
            }
            if ($fired)
              $ctx.log.debug("fired");
            else
              $ctx.log.debug("not fired");
          }
        }
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:final"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction(split1)($ctx, [
        await $stdlib["get"]($ctx, [
          $event.data.attrs,
          "x"
        ]),
        ","
      ]));
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let x2 = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $ctx.krl.toPairs(await $ctx.krl.assertFunction(split1)($ctx, [
          await $stdlib["get"]($ctx, [
            $event.data.attrs,
            "y"
          ]),
          ","
        ]));
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
          let y2 = $foreach1_pairs[$foreach1_i][1];
          $ctx.log.debug("rule selected", { "rule_name": "final" });
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction(send_directive1)($ctx, [
              "final",
              {
                "x": x2,
                "y": y2
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
            await $ctx.rsCtx.raiseEvent("foreach", "final_raised", {
              "x": x2,
              "y": y2
            });
        }
      }
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:final_raised"), async function ($event, $state, $last) {
      $ctx.log.debug("rule selected", { "rule_name": "final_raised" });
      var $fired = true;
      if ($fired) {
        await $ctx.krl.assertAction(send_directive1)($ctx, [
          "final_raised",
          {
            "x": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "x"
            ]),
            "y": await $stdlib["get"]($ctx, [
              $event.data.attrs,
              "y"
            ])
          }
        ]);
      }
      if ($fired)
        $ctx.log.debug("fired");
      else
        $ctx.log.debug("not fired");
    });
    $rs.when($ctx.krl.SelectWhen.e("foreach:key_vs_index"), async function ($event, $state, $last) {
      let $foreach0_pairs = $ctx.krl.toPairs({
        "foo": "bar",
        "baz": "qux"
      });
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let a2 = $foreach0_pairs[$foreach0_i][1];
        let k2 = $foreach0_pairs[$foreach0_i][0];
        let $foreach1_pairs = $ctx.krl.toPairs([
          "one",
          "two",
          "three"
        ]);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
          let b2 = $foreach1_pairs[$foreach1_i][1];
          let i2 = $foreach1_pairs[$foreach1_i][0];
          $ctx.log.debug("rule selected", { "rule_name": "key_vs_index" });
          var $fired = true;
          if ($fired) {
            await $ctx.krl.assertAction(send_directive1)($ctx, [
              "key_vs_index",
              {
                "a": a2,
                "k": k2,
                "b": b2,
                "i": i2
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
        }
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
        "__testing": function () {
          return {
            "queries": [],
            "events": [
              {
                "domain": "foreach",
                "name": "basic",
                "attrs": []
              },
              {
                "domain": "foreach",
                "name": "map",
                "attrs": []
              },
              {
                "domain": "foreach",
                "name": "nested",
                "attrs": []
              },
              {
                "domain": "foreach",
                "name": "scope",
                "attrs": []
              },
              {
                "domain": "foreach",
                "name": "final",
                "attrs": [
                  "y",
                  "x"
                ]
              },
              {
                "domain": "foreach",
                "name": "final_raised",
                "attrs": [
                  "x",
                  "y"
                ]
              },
              {
                "domain": "foreach",
                "name": "key_vs_index",
                "attrs": []
              }
            ]
          };
        }
      }
    };
  }
};