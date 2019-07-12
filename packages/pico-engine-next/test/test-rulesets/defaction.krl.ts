import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";
import * as krl from "../../src/krl";

test("defaction.krl", async t => {
  let directives: any[] = [];

  const { pe, eci } = await startTestEngine(["defaction.krl"], {
    modules: {
      custom: {
        send_directive: krl.Action(["name", "options"], (name, options) => {
          const directive = { name, options };
          directives.push(directive);
          return directive;
        })
      }
    }
  });

  async function signal(domain: string, name: string, attrs: any = {}) {
    directives = [];
    await pe.pf.eventWait({
      eci,
      domain,
      name,
      data: { attrs },
      time: 0
    });
    return directives;
  }

  function query(name: string, args: any = {}) {
    return pe.pf.query({
      eci,
      rid: "io.picolabs.defaction",
      name,
      args
    });
  }

  t.deepEqual(await signal("defa", "foo", {}), [
    { name: "foo", options: { a: "bar", b: 5 } }
  ]);

  t.deepEqual(await signal("defa", "bar", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } }
  ]);

  t.deepEqual(await query("getSettingVal"), null);

  t.deepEqual(await signal("defa", "bar_setting", {}), [
    { name: "bar", options: { a: "baz", b: "qux", c: "quux" } }
  ]);

  t.deepEqual(await query("getSettingVal"), {
    name: "bar",
    options: { a: "baz", b: "qux", c: "quux" }
  });

  t.deepEqual(await signal("defa", "chooser", { val: "asdf" }), [
    { name: "foo", options: { a: "asdf", b: 5 } }
  ]);

  t.deepEqual(await signal("defa", "chooser", { val: "fdsa" }), [
    { name: "bar", options: { a: "fdsa", b: "ok", c: "done" } }
  ]);

  t.deepEqual(await signal("defa", "chooser", {}), []);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "false" }), [
    { name: "yes a", options: undefined },
    { name: "not b", options: undefined }
  ]);

  t.deepEqual(await signal("defa", "ifAnotB", { a: "true", b: "true" }), []);

  t.deepEqual(
    await query("add", { a: 1, b: 2 }), // try and fake an action
    { type: "directive", name: "add", options: { resp: 3 } }
  );

  // try {
  //   await signal("defa", "add");
  //   t.fail();
  // } catch (err) {
  //   t.is(err + "", "TypeError: [Function] is not an action");
  // }

  t.deepEqual(await signal("defa", "returns"), [
    { name: "wat:whereinthe", options: { b: 333 } }
  ]);
  t.deepEqual(await query("getSettingVal"), [
    "where",
    "in",
    "the",
    "wat:whereinthe 433"
  ]);

  // t.deepEqual(await signal("defa", "scope"), []);
});

/*
      query('getSettingVal'),
      ['aint', 'no', 'echo', null, 'send wat? noop returned: null']
    ],
    function (next) {
      pe.emitter.once('error', function (err, info) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        t.is(info.eci, 'id1')
      })
      signal('defa', 'trying_to_use_action_as_fn')(function (err) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        next()
      })
    },
    function (next) {
      pe.emitter.once('error', function (err, info) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        t.is(info.eci, 'id1')
      })
      query('echoAction')(function (err) {
        t.is(err + '', 'Error: actions can only be called in the rule action block')
        next()
      })
    }
  ])
})
*/
