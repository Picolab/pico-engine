/**
 * Testing tab history and saved requests (U9) on io.picolabs.pico-engine-ui.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

async function uiEvent(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  eci: string,
  name: string,
  attrs: Record<string, unknown>
) {
  return pe.pf.eventQuery(
    { eci, domain: "engine_ui", name, data: { attrs }, time: 0 },
    { eci, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} }
  );
}

test("testing history and saved requests persist on the pico", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);
  const uiEci = ui!.id;

  const rid = "io.picolabs.wrangler";
  const historyEntry = {
    id: "hist-1",
    time: "2026-10-22T12:00:00.000Z",
    kind: "query",
    rid,
    label: "myself",
    queryName: "myself",
    ok: true,
    payload: {},
  };

  await uiEvent(pe, uiEci, "testing_history_record", {
    rid,
    entry: historyEntry,
  });

  let history = await pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "testingHistory",
    args: { rid },
  });
  t.is((history as unknown[]).length, 1);
  t.is((history as { id: string }[])[0].id, "hist-1");

  const savedEntry = {
    id: "save-1",
    name: "Check myself",
    savedAt: "2026-10-22T12:01:00.000Z",
    kind: "query",
    rid,
    label: "myself",
    queryName: "myself",
    payload: {},
  };

  await uiEvent(pe, uiEci, "testing_saved_upsert", {
    rid,
    entry: savedEntry,
  });

  let saved = await pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "testingSaved",
    args: { rid },
  });
  t.is((saved as unknown[]).length, 1);
  t.is((saved as { name: string }[])[0].name, "Check myself");

  await uiEvent(pe, uiEci, "testing_saved_delete", {
    rid,
    id: "save-1",
  });

  saved = await pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "testingSaved",
    args: { rid },
  });
  t.is((saved as unknown[]).length, 0);

  await uiEvent(pe, uiEci, "testing_history_clear", { rid });
  history = await pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "testingHistory",
    args: { rid },
  });
  t.is((history as unknown[]).length, 0);

  await pe.pf.db.close();
});
