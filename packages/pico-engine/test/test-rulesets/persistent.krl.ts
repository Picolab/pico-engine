import test from "ava";
import {
  allowAllChannelConf,
  startTestEngine
} from "../helpers/startTestEngine";
import { toTestKrlURL } from "../helpers/toTestKrlURL";

test("persistent.krl", async t => {
  const { pe, mkSignal } = await startTestEngine(["persistent.krl"], {
    useEventInputTime: true
  });
  async function mkPico() {
    const rs = await pe.rsRegistry.load(toTestKrlURL("persistent.krl"));

    const familyEci = await pe.pf.rootPico.newPico({
      rulesets: [{ rs: rs.ruleset }]
    });
    const pico = pe.pf.getPico(familyEci);
    const chann = await pico.newChannel(allowAllChannelConf);
    return {
      eci: chann.id,
      picoId: pico.id
    };
  }
  // Create 2 picos with the same ruleset
  const { eci: eciA, picoId: picoIdA } = await mkPico();
  const { eci: eciB, picoId: picoIdB } = await mkPico();

  const signalA = mkSignal(eciA);
  const signalB = mkSignal(eciB);
  function queryA(name: string, args: any = {}) {
    return pe.pf.query({
      eci: eciA,
      rid: "io.picolabs.persistent",
      name,
      args
    });
  }
  function queryB(name: string, args: any = {}) {
    return pe.pf.query({
      eci: eciB,
      rid: "io.picolabs.persistent",
      name,
      args
    });
  }

  t.deepEqual(
    await queryA("getName"),
    null,
    "if not set, the var should return null"
  );

  /////////////////////////////////////////////////////////////////////////////
  // store different names on each pico
  t.deepEqual(await signalA("store", "name", { name: "Alf" }), [
    { name: "store_name", options: { name: "Alf" } }
  ]);
  t.deepEqual(await signalB("store", "name", { name: "Bob" }), [
    { name: "store_name", options: { name: "Bob" } }
  ]);
  // pico's should have their respective names
  t.is(await queryA("getName"), "Alf");
  t.is(await queryB("getName"), "Bob");

  /////////////////////////////////////////////////////////////////////////////
  // query paths
  t.deepEqual(
    await signalA("store", "user_firstname", { firstname: "Leonard" }),
    [{ name: "store_user_firstname", options: { name: "Leonard" } }]
  );
  t.deepEqual(await queryA("getUser"), {
    firstname: "Leonard",
    lastname: "McCoy"
  });
  t.deepEqual(await queryA("getUserFirstname"), "Leonard");

  /////////////////////////////////////////////////////////////////////////////
  // clear vars
  function dumpEnts(picoId: string) {
    return new Promise((resolve, reject) => {
      const list: any = [];
      const s = pe.pf.db.createReadStream({
        gte: ["entvar", picoId, "io.picolabs.persistent"],
        lte: ["entvar", picoId, "io.picolabs.persistent", undefined]
      });
      s.on("error", err => reject(err));
      s.on("end", () => resolve(list));
      s.on("data", function(data) {
        list.push([data.key.slice(3), data.value]);
      });
    });
  }
  t.deepEqual(await dumpEnts(picoIdA), [
    [["name"], "Alf"],
    [["user"], { lastname: "McCoy", firstname: "Leonard" }]
  ]);
  t.deepEqual(await dumpEnts(picoIdB), [[["name"], "Bob"]]);

  t.deepEqual(await signalA("store", "clear_user"), [
    { name: "clear_user", options: {} }
  ]);

  t.deepEqual(await dumpEnts(picoIdA), [[["name"], "Alf"]]);
  t.deepEqual(await dumpEnts(picoIdB), [[["name"], "Bob"]]);
});
