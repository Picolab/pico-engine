import test from "ava";
import { remapChildUiEcisEnt, remapEcisDeep } from "../src/eciRemap";

test("remapEcisDeep replaces matching strings in nested structures", (t) => {
  const map = { oldEci: "newEci", oldPico: "newPico" };
  const input = {
    schedule: { job1: { event: { eci: "oldEci" } } },
    subs: [{ Rx: "oldEci", Tx: "peer-outside" }],
    parent_eci: "oldPico",
  };
  t.deepEqual(remapEcisDeep(input, map), {
    schedule: { job1: { event: { eci: "newEci" } } },
    subs: [{ Rx: "newEci", Tx: "peer-outside" }],
    parent_eci: "newPico",
  });
});

test("remapEcisDeep leaves unmatched strings and non-strings unchanged", (t) => {
  t.is(remapEcisDeep("oldEci-prefix", { oldEci: "new" }), "oldEci-prefix");
  t.is(remapEcisDeep(42, { oldEci: "new" }), 42);
  t.is(remapEcisDeep(null, { oldEci: "new" }), null);
  t.deepEqual(remapEcisDeep(["keep", "oldEci"], { oldEci: "new" }), [
    "keep",
    "new",
  ]);
});

test("remapEcisDeep with empty map is a no-op", (t) => {
  const input = { eci: "same", nested: [{ Tx: "peer" }] };
  t.deepEqual(remapEcisDeep(input, {}), input);
});

test("remapChildUiEcisEnt remaps family ECI keys and ui ECI values", (t) => {
  const map = { oldFamily: "newFamily", oldUi: "newUi" };
  t.deepEqual(
    remapChildUiEcisEnt({ oldFamily: "oldUi", otherFamily: "keepUi" }, map),
    { newFamily: "newUi", otherFamily: "keepUi" }
  );
});
