import test from "ava";
import { startTestEngine } from "../helpers/startTestEngine";
import krl from "../../src/krl";

test("scope.krl", async t => {
  let directives: any[] = [];

  const { pe, eci } = await startTestEngine(["scope.krl"], {
    modules: {
      custom: {
        send_directive: krl.function(["name", "options"], (name, options) => {
          directives.push({ name, options });
        })
      }
    },
    useEventInputTime: true
  });

  async function signal(domainName: string, attrs: any = {}, time: number = 0) {
    const [domain, name] = domainName.split(":");
    directives = [];
    await pe.pf.eventWait({
      eci,
      domain,
      name,
      data: { attrs },
      time
    });
    return directives;
  }

  function query(name: string, args: any = {}) {
    return pe.pf.query({
      eci,
      rid: "io.picolabs.scope",
      name,
      args
    });
  }

  // Testing how setting() variables work on `or`
  t.deepEqual(await signal("scope:eventOr0", { name: "000" }), [
    {
      name: "eventOr",
      options: { name0: "000", name1: void 0 }
    }
  ]);
  t.deepEqual(await signal("scope:eventOr1", { name: "111" }), [
    {
      name: "eventOr",
      options: { name0: void 0, name1: "111" }
    }
  ]);
  t.deepEqual(await signal("scope:eventOr0", {}), [
    {
      name: "eventOr",
      options: { name0: "", name1: void 0 }
    }
  ]);
  t.deepEqual(await signal("scope:eventOr1", { name: "?" }), [
    {
      name: "eventOr",
      options: { name0: void 0, name1: "?" }
    }
  ]);

  // setting() variables should be persisted until the rule fires
  t.deepEqual(await signal("scope:eventAnd0", { name: "000" }), []);
  t.deepEqual(await signal("scope:eventAnd1", { name: "111" }), [
    { name: "eventAnd", options: { name0: "000", name1: "111" } }
  ]);

  // setting() variables should be persisted until the rule fires or time runs out
  t.deepEqual(
    await signal("scope:eventWithin1", { name: "111" }, 10000000000000),
    []
  );
  t.deepEqual(
    await signal("scope:eventWithin2", { name: "222" }, 10000000000007),
    [{ name: "eventWithin", options: { name1: "111", name2: "222" } }]
  );
  // now let too much time pass for it to remember 111
  t.deepEqual(
    await signal("scope:eventWithin1", { name: "111" }, 10000000000000),
    []
  );
  t.deepEqual(await signal("scope:eventWithin0", {}, 10000000007000), []);
  t.deepEqual(
    await signal("scope:eventWithin2", { name: "222" }, 10000000007007),
    [
      {
        name: "eventWithin",
        options: {
          name1: void 0,
          name2: "222"
        }
      }
    ]
  );
  t.deepEqual(
    await signal("scope:eventWithin1", { name: "aaa" }, 10000000007008),
    []
  );
  t.deepEqual(await signal("scope:eventWithin3", {}, 10000000007009), [
    { name: "eventWithin", options: { name1: "aaa", name2: void 0 } }
  ]);

  // Testing the scope of the prelude block
  t.deepEqual(await signal("scope:prelude", { name: "Bill" }), [
    {
      name: "say",
      options: {
        name: "Bill",
        p0: "prelude 0",
        p1: "prelude 1",
        g0: "global 0"
      }
    }
  ]);
  t.deepEqual(await query("getVals"), {
    name: "Bill",
    p0: "prelude 0",
    p1: "prelude 1"
  });
  t.is(await query("g0"), "global 0");
  t.is(await query("add", { a: 10, b: 2 }), 12);
  t.is(await query("sum", { arr: [1, 2, 3, 4, 5] }), 15);
  t.deepEqual(await signal("scope:functions"), [
    {
      name: "say",
      options: {
        add_one_two: 3,
        inc5_3: 8,
        g0: "overrided g0!"
      }
    }
  ]);
  t.deepEqual(await query("mapped"), [2, 3, 4]);
});
