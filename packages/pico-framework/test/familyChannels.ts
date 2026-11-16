/**
 * Family channel inheritance and ctx.newChannel behavior.
 */

import test from "ava";
import { PicoEvent } from "../src/PicoEvent";
import { PicoQuery } from "../src/PicoQuery";
import { testPicoFramework } from "./helpers/testPicoFramework";

test("ctx.newChannel", async function (t) {
  const { pf, rsReg } = await testPicoFramework([
    { rid: "foo", init: () => ({ query: { b() {} } }) },
  ]);

  const pico = pf.rootPico;
  const eciToChild = await pico.newPico({
    rulesets: [{ rs: rsReg.get("foo") }],
  });
  const subPico = pf.getPico(eciToChild);

  function mkEv(eci: string): PicoEvent {
    return { eci, domain: "a", name: "b", data: { attrs: {} }, time: 0 };
  }
  function mkQr(eci: string): PicoQuery {
    return { eci, rid: "foo", name: "b", args: {} };
  }

  let err = await t.throwsAsync(pf.event(mkEv(eciToChild)));
  t.is(
    err + "",
    "Error: This is a family channel and only the owner can use it."
  );
  err = await t.throwsAsync(pf.event(mkEv(eciToChild), subPico.id));
  t.is(
    err + "",
    "Error: This is a family channel and only the owner can use it."
  );
  await t.notThrowsAsync(pf.event(mkEv(eciToChild), pico.id));

  err = await t.throwsAsync(pf.query(mkQr(eciToChild)));
  t.is(
    err + "",
    "Error: This is a family channel and only the owner can use it."
  );
  err = await t.throwsAsync(pf.query(mkQr(eciToChild), subPico.id));
  t.is(
    err + "",
    "Error: This is a family channel and only the owner can use it."
  );
  await t.notThrowsAsync(pf.query(mkQr(eciToChild), pico.id));
});
