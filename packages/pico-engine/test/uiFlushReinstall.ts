/**
 * engine_ui flush reinstalls the flushed ruleset's source without raising
 * wrangler:ruleset_installed. That event is only for a rid new to the pico.
 */

import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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

test("engine_ui flush does not raise ruleset_installed for an installed ruleset", async (t) => {
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
  t.is(await installs(), 1, "flush does not raise ruleset_installed");

  // Flushing a ruleset that isn't installed on this pico doesn't install it.
  const otherUrl = toTestKrlURL("chevron.krl");
  const afterOtherFlush = await uiEvent(pe, ui!.id, "flush", { url: otherUrl });
  t.false(
    (afterOtherFlush.rulesets || []).some((r: any) => r.url === otherUrl),
    "a flush alone doesn't install",
  );
  t.is(await installs(), 1, "unrelated flush doesn't install the test ruleset");

  await pe.pf.db.close();
});

// The flush rule validates (loads) the url, flushes, then reinstalls. load()
// is memoized for 100ms; if a flush did not clear it, the reinstall would put
// the pre-flush ruleset back and the pico would run one flush behind.
test("engine_ui flush runs the new source right away", async (t) => {
  const rid = "io.picolabs.test.flush_version";
  const src = (v: string) =>
    `ruleset ${rid} {\n  meta { shares version }\n  global { version = function() { "${v}" } }\n}\n`;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "flush-version-"));
  const file = path.join(dir, rid + ".krl");
  fs.writeFileSync(file, src("A"));
  const url = "file://" + file;

  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);
  await uiEvent(pe, ui!.id, "new_channel", {
    id: "flush-version-test",
    tags: ["test"],
    eventPolicy: { allow: [], deny: [] },
    queryPolicy: { allow: [{ rid, name: "version" }], deny: [] },
  });
  const version = () =>
    pe.pf.query({ eci: "flush-version-test", rid, name: "version", args: {} });

  await uiEvent(pe, ui!.id, "install", { url });
  t.is(await version(), "A");

  fs.writeFileSync(file, src("B"));
  await uiEvent(pe, ui!.id, "flush", { url });
  t.is(await version(), "B");

  fs.writeFileSync(file, src("C"));
  await uiEvent(pe, ui!.id, "flush", { url });
  t.is(await version(), "C");

  await pe.pf.db.close();
});
