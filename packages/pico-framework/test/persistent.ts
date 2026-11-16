/**
 * Pico persistence: save and reload across engine restart.
 */

import test from "ava";
import { PicoFramework } from "../src";
import { dbRange } from "../src/dbRange";
import { jsonDumpPico } from "./helpers/inspect";
import { rulesetRegistry } from "./helpers/rulesetRegistry";
import { mkdb } from "./helpers/mkdb";

test("persistent", async function (t) {
  // re-use the db on each restart
  const db = mkdb();

  let nextId = 0;
  function genID() {
    return `id${nextId++}`;
  }

  const rsReg = rulesetRegistry();
  ["one", "two", "three"].forEach((rid) => {
    rsReg.add({
      rid,
      init: () => ({}),
    });
  });

  async function restart(): Promise<PicoFramework> {
    const pf = new PicoFramework({
      db: db,
      rulesetLoader: rsReg.loader,
      genID,
    });
    await pf.start();
    return pf;
  }

  let pf = await restart();

  let pico = pf.rootPico;
  let pico0 = pf.getPico(await pico.newPico());
  let pico00 = pf.getPico(await pico0.newPico());
  let pico000 = pf.getPico(await pico00.newPico());
  let pico1 = pf.getPico(await pico.newPico());
  let pico10 = pf.getPico(await pico1.newPico());
  let pico11 = pf.getPico(await pico1.newPico());

  await pico.install(rsReg.get("one"), { one: "two" });
  await pico0.install(rsReg.get("two"), { some: { thing: 22 } });
  await pico00.install(rsReg.get("three"), { aaa: 1 });
  await pico00.install(rsReg.get("two"));
  await pico000.install(rsReg.get("two"));
  await pico1.install(rsReg.get("two"), { some: { thing: 22 } });
  await pico10.install(rsReg.get("three"));

  let chann = await pico11.newChannel({ tags: ["one", "two"] });
  await pico11.putChannel(chann.id, { tags: ["changed", "it"] });

  let dumpBefore = await jsonDumpPico(pf, pf.rootPico);

  pf = await restart();

  let dumpAfter = await jsonDumpPico(pf, pf.rootPico);
  t.deepEqual(dumpBefore, dumpAfter);

  t.is(pf.numberOfPicos(), 7);

  pico = pf.rootPico;
  await pico.uninstall("one");
  for (const eci of pico.children) {
    await pico.delPico(eci);
  }

  t.is(pf.numberOfPicos(), 1);

  t.deepEqual(await jsonDumpPico(pf, pf.rootPico), {
    id: "id0",
    parent: null,
    children: [],
    channels: [
      {
        id: "id0",
        familyChannelPicoID: "id0",
        tags: ["system", "self"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
        mcpPolicy: { allow: [], deny: [] },
      },
    ],
    rulesets: [],
    childrenPicos: [],
  });

  pf = await restart();

  t.deepEqual(await jsonDumpPico(pf, pf.rootPico), {
    id: "id0",
    parent: null,
    children: [],
    channels: [
      {
        id: "id0",
        familyChannelPicoID: "id0",
        tags: ["system", "self"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
        mcpPolicy: { allow: [], deny: [] },
      },
    ],
    rulesets: [],
    childrenPicos: [],
  });

  const dbKeys = await dbRange(pf.db, {}, function (data) {
    return data.key.join("|");
  });
  t.deepEqual(dbKeys, ["pico|id0", "root-pico"]);
});
