module.exports = {
  "rid": "io.picolabs.foreach",
  "version": "draft",
  "meta": { "name": "testing foreach" },
  "init": async function ($rsCtx, $env) {
    const $default = Symbol("default");
    const $ctx = $env.mkCtx($rsCtx);
    const $stdlib = $ctx.module("stdlib");
    const send_directive = $stdlib["send_directive"];
    const range = $stdlib["range"];
    const split = $stdlib["split"];
    const doubleThis = $env.krl.Function(["arr"], async function (arr) {
      return [
        arr,
        arr
      ];
    });
    const $rs = new $env.SelectWhen.SelectWhen();
    $rs.when($env.SelectWhen.e("foreach:basic"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs([
        1,
        2,
        3
      ]);
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
        let x = $foreach0_pairs[$foreach0_i][1];
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(send_directive)($ctx, [
            "basic",
            { "x": x }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      }
    });
    $rs.when($env.SelectWhen.e("foreach:map"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs({
        "a": 1,
        "b": 2,
        "c": 3
      });
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let $foreach_is_final = $foreach0_i === $foreach0_len - 1;
        let v = $foreach0_pairs[$foreach0_i][1];
        let k = $foreach0_pairs[$foreach0_i][0];
        var $fired = true;
        if ($fired) {
          await $env.krl.assertAction(send_directive)($ctx, [
            "map",
            {
              "k": k,
              "v": v
            }
          ]);
        }
        if ($fired)
          $ctx.log.debug("fired");
        else
          $ctx.log.debug("not fired");
      }
    });
    $rs.when($env.SelectWhen.e("foreach:nested"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs([
        1,
        2,
        3
      ]);
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let x = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $env.krl.toPairs([
          "a",
          "b",
          "c"
        ]);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
          let y = $foreach1_pairs[$foreach1_i][1];
          var $fired = true;
          if ($fired) {
            await $env.krl.assertAction(send_directive)($ctx, [
              "nested",
              {
                "x": x,
                "y": y
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
    $rs.when($env.SelectWhen.e("foreach:scope"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs(await $env.krl.assertFunction(doubleThis)($ctx, [[
          1,
          2,
          3
        ]]));
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let arr = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $env.krl.toPairs(arr);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let foo = $foreach1_pairs[$foreach1_i][1];
          let $foreach2_pairs = $env.krl.toPairs(await $env.krl.assertFunction(range)($ctx, [
            0,
            foo
          ]));
          let $foreach2_len = $foreach2_pairs.length;
          let $foreach2_i;
          for ($foreach2_i = 0; $foreach2_i < $foreach2_len; $foreach2_i++) {
            let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1 && $foreach2_i === $foreach2_len - 1;
            let bar = $foreach2_pairs[$foreach2_i][1];
            const baz = await $stdlib["*"]($ctx, [
              foo,
              bar
            ]);
            var $fired = true;
            if ($fired) {
              await $env.krl.assertAction(send_directive)($ctx, [
                "scope",
                {
                  "foo": foo,
                  "bar": bar,
                  "baz": baz
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
    $rs.when($env.SelectWhen.e("foreach:final"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs(await $env.krl.assertFunction(split)($ctx, [
        await $stdlib["get"]($ctx, [
          $event.data.attrs,
          "x"
        ]),
        ","
      ]));
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let x = $foreach0_pairs[$foreach0_i][1];
        let $foreach1_pairs = $env.krl.toPairs(await $env.krl.assertFunction(split)($ctx, [
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
          let y = $foreach1_pairs[$foreach1_i][1];
          var $fired = true;
          if ($fired) {
            await $env.krl.assertAction(send_directive)($ctx, [
              "final",
              {
                "x": x,
                "y": y
              }
            ]);
          }
          if ($fired)
            $ctx.log.debug("fired");
          else
            $ctx.log.debug("not fired");
          if (typeof $foreach_is_final === "undefined" || $foreach_is_final)
            await $ctx.rsCtx.raiseEvent("foreach", "final_raised", {
              "x": x,
              "y": y
            });
        }
      }
    });
    $rs.when($env.SelectWhen.e("foreach:final_raised"), async function ($event, $state, $last) {
      var $fired = true;
      if ($fired) {
        await $env.krl.assertAction(send_directive)($ctx, [
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
    $rs.when($env.SelectWhen.e("foreach:key_vs_index"), async function ($event, $state, $last) {
      let $foreach0_pairs = $env.krl.toPairs({
        "foo": "bar",
        "baz": "qux"
      });
      let $foreach0_len = $foreach0_pairs.length;
      let $foreach0_i;
      for ($foreach0_i = 0; $foreach0_i < $foreach0_len; $foreach0_i++) {
        let a = $foreach0_pairs[$foreach0_i][1];
        let k = $foreach0_pairs[$foreach0_i][0];
        let $foreach1_pairs = $env.krl.toPairs([
          "one",
          "two",
          "three"
        ]);
        let $foreach1_len = $foreach1_pairs.length;
        let $foreach1_i;
        for ($foreach1_i = 0; $foreach1_i < $foreach1_len; $foreach1_i++) {
          let $foreach_is_final = $foreach0_i === $foreach0_len - 1 && $foreach1_i === $foreach1_len - 1;
          let b = $foreach1_pairs[$foreach1_i][1];
          let i = $foreach1_pairs[$foreach1_i][0];
          var $fired = true;
          if ($fired) {
            await $env.krl.assertAction(send_directive)($ctx, [
              "key_vs_index",
              {
                "a": a,
                "k": k,
                "b": b,
                "i": i
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