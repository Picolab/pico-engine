/**
 * Multi-root mesh: boot, auto-create, isolation, and independent child trees.
 */

import test from "ava";
import { PicoFramework, Ruleset } from "../src";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

// A ruleset that stores a value in per-instance (i.e. per-pico) closure state.
// Since `init` runs once per pico, the closure gives us natural state isolation
// to prove that separate roots don't share state.
const boxRuleset: Ruleset = {
  rid: "rid.box",
  init() {
    let val: any = null;
    return {
      event(event) {
        if (`${event.domain}:${event.name}` === "box:set") {
          val = event.data ? event.data.attrs.val : null;
        }
      },
      query: {
        val: () => val,
      },
    };
  },
};

test("boots with zero roots when autoCreateRootPico is false", async (t) => {
  const rsReg = rulesetRegistry();
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rsReg.loader,
    autoCreateRootPico: false,
  });
  await pf.start();

  t.is(pf.numberOfPicos(), 0);
  t.deepEqual(pf.rootPicos(), []);

  const err = t.throws(() => pf.rootPico);
  t.regex(err + "", /No primary root pico/);
});

test("auto-creates a single root by default (back-compat)", async (t) => {
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rulesetRegistry().loader,
  });
  await pf.start();

  t.is(pf.numberOfPicos(), 1);
  t.is(pf.rootPicos().length, 1);
  t.is(pf.rootPico.parent, null);
});

test("createRootPico creates independent, routable, isolated roots", async (t) => {
  const rsReg = rulesetRegistry();
  rsReg.add(boxRuleset);
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rsReg.loader,
    autoCreateRootPico: false,
  });
  await pf.start();

  const rootA = await pf.createRootPico({
    rulesets: [{ rs: rsReg.get("rid.box") }],
  });
  const rootB = await pf.createRootPico({
    rulesets: [{ rs: rsReg.get("rid.box") }],
  });

  t.is(pf.numberOfPicos(), 2);
  t.is(pf.rootPicos().length, 2);
  t.is(rootA.parent, null, "root A has no parent");
  t.is(rootB.parent, null, "root B has no parent");
  t.not(rootA.id, rootB.id, "roots are distinct picos");

  const eciA = (await rootA.newChannel()).id;
  const eciB = (await rootB.newChannel()).id;

  // Each root's channel routes to its own pico (proves flat lookup works).
  await pf.eventWait({
    eci: eciA,
    domain: "box",
    name: "set",
    data: { attrs: { val: "A" } },
    time: 0,
  });
  await pf.eventWait({
    eci: eciB,
    domain: "box",
    name: "set",
    data: { attrs: { val: "B" } },
    time: 0,
  });

  // State is isolated per root.
  t.is(await pf.query({ eci: eciA, rid: "rid.box", name: "val", args: {} }), "A");
  t.is(await pf.query({ eci: eciB, rid: "rid.box", name: "val", args: {} }), "B");
});

test("each root has its own independent child tree", async (t) => {
  const pf = new PicoFramework({
    db: mkdb(),
    rulesetLoader: rulesetRegistry().loader,
    autoCreateRootPico: false,
  });
  await pf.start();

  const rootA = await pf.createRootPico();
  const rootB = await pf.createRootPico();

  await rootA.newPico();
  await rootA.newPico();
  await rootB.newPico();

  t.is(rootA.children.length, 2);
  t.is(rootB.children.length, 1);
  // 2 roots + 3 children
  t.is(pf.numberOfPicos(), 5);
  // children are not roots
  t.is(pf.rootPicos().length, 2);
});

test("roots persist across restart; first stays the primary", async (t) => {
  const db = mkdb();

  const pf1 = new PicoFramework({
    db,
    rulesetLoader: rulesetRegistry().loader,
    autoCreateRootPico: false,
  });
  await pf1.start();
  const a = await pf1.createRootPico();
  const b = await pf1.createRootPico();

  const pf2 = new PicoFramework({
    db,
    rulesetLoader: rulesetRegistry().loader,
    autoCreateRootPico: false,
  });
  await pf2.start();

  t.is(pf2.numberOfPicos(), 2);
  t.deepEqual(
    pf2
      .rootPicos()
      .map((p) => p.id)
      .sort(),
    [a.id, b.id].sort(),
  );
  // The first root created is recorded as the back-compat primary.
  t.is(pf2.rootPico.id, a.id);
});

test("existing primary root loads even with autoCreateRootPico:false (migration)", async (t) => {
  const db = mkdb();

  // Old engine: default behavior auto-creates a root + persists ["root-pico"].
  const pf1 = new PicoFramework({
    db,
    rulesetLoader: rulesetRegistry().loader,
  });
  await pf1.start();
  const rootId = pf1.rootPico.id;

  // New engine boot with zero-root policy still adopts the existing root.
  const pf2 = new PicoFramework({
    db,
    rulesetLoader: rulesetRegistry().loader,
    autoCreateRootPico: false,
  });
  await pf2.start();

  t.is(pf2.numberOfPicos(), 1);
  t.is(pf2.rootPico.id, rootId);
});
