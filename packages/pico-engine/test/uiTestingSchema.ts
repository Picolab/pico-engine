/**
 * UI channel can reach wrangler schema queries (Testing tab).
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";

test("UI channel may query wrangler picoSchema and rulesetSchema", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);

  const url = toTestKrlURL("io.picolabs.test.schema_ui.krl");
  await pe.pf.eventQuery(
    {
      eci: ui!.id,
      domain: "engine_ui",
      name: "install",
      data: { attrs: { url } },
      time: 0,
    },
    { eci: ui!.id, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} }
  );

  const picoSchema = await pe.pf.query({
    eci: ui!.id,
    rid: "io.picolabs.wrangler",
    name: "picoSchema",
    args: {},
  });
  t.truthy(picoSchema);
  t.is(typeof (picoSchema as { events?: unknown[] }).events, "object");

  const rsSchema = await pe.pf.query({
    eci: ui!.id,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: "io.picolabs.test.schema_ui" },
  });
  t.truthy(rsSchema);
  t.is(
    (rsSchema as { operations?: unknown[] }).operations?.length,
    1
  );

  await pe.pf.db.close();
});
