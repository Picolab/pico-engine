/**
 * engine_ui flush reinstalls the flushed ruleset on the pico
 * (io.picolabs.pico-engine-ui reinstall_after_flush).
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";

const RID = "io.picolabs.test.flush_reinstall";

async function uiEvent(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  eci: string,
  name: string,
  attrs: Record<string, unknown>,
) {
  return pe.pf.eventQuery(
    { eci, domain: "engine_ui", name, data: { attrs }, time: 0 },
    { eci, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} },
  );
}

test("engine_ui flush reinstalls an installed ruleset, including dotted rids", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);
  const url = toTestKrlURL(RID + ".krl");

  // The UI channel's policy (rightly) doesn't allow arbitrary rulesets' queries,
  // and family channels are owner-only; make a channel that allows this one.
  const counterEci = "flush-reinstall-test";
  await uiEvent(pe, ui!.id, "new_channel", {
    id: counterEci,
    tags: ["test"],
    eventPolicy: { allow: [], deny: [] },
    queryPolicy: { allow: [{ rid: RID, name: "installs" }], deny: [] },
  });
  const installs = () =>
    pe.pf.query({ eci: counterEci, rid: RID, name: "installs", args: {} });

  const afterInstall = await uiEvent(pe, ui!.id, "install", { url });
  const installed = (afterInstall.rulesets || []).find((r: any) => r.rid === RID);
  t.truthy(installed, "test ruleset installed");
  t.is(await installs(), 1);

  // Flush with the url exactly as the UI sends it: from pico(){"rulesets"}.
  await uiEvent(pe, ui!.id, "flush", { url: installed.url });
  t.is(await installs(), 2, "flush reinstalled the ruleset");

  // Flushing a ruleset that isn't installed on this pico doesn't install it.
  const otherUrl = toTestKrlURL("chevron.krl");
  const afterOtherFlush = await uiEvent(pe, ui!.id, "flush", { url: otherUrl });
  t.false(
    (afterOtherFlush.rulesets || []).some((r: any) => r.url === otherUrl),
    "a flush alone doesn't install",
  );
  t.is(await installs(), 2, "unrelated flush doesn't reinstall the test ruleset");

  await pe.pf.db.close();
});
