/**
 * @component: reusable view markup served as components/<Name>.xmlui but not
 * a page. Exercised with demos/xmlui/com.example.thermostat.krl, which uses
 * its own ReadingHistory component and io.picolabs.xmlui's PicoSettings,
 * PicoThemeField, and PicoTheme.
 */

import test from "ava";
import fetch from "cross-fetch";
import {
  installDemoRulesets,
  installXmluiRuleset,
} from "./helpers/xmluiViewHarness";
import { startTestEngine } from "./helpers/startTestEngine";
import { queryForComponentFile } from "../src/xmluiRuntime";

const RID = "com.example.thermostat";

async function startThermostat() {
  const started = await startTestEngine();
  const root = started.pe.pf.rootPicos()[0]!;
  await installXmluiRuleset(started.pe, root);
  await installDemoRulesets(started.pe, root, ["com.example.thermostat.krl"]);
  await started.signal("wrangler", "ruleset_installed", { rids: [RID] });
  const channels = async (tags: string[]) =>
    (await started.pe.pf.query({
      eci: started.eci,
      rid: "io.picolabs.wrangler",
      name: "channels",
      args: { tags },
    })) as Array<{ id: string; queryPolicy: { allow: Array<{ rid: string; name: string }> } }>;
  return { ...started, channels };
}

test("@component appears on rulesetSchema with its component name", async (t) => {
  const { pe, eci } = await startThermostat();
  const schema = (await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: RID },
  })) as { queries: Array<{ name: string; view?: unknown; component?: unknown }> };
  const history = schema.queries.find((q) => q.name === "readingHistory");
  t.deepEqual(history?.component, { name: "ReadingHistory" });
  t.is(history?.view, undefined);

  const xmlui = (await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: "io.picolabs.xmlui" },
  })) as { queries: Array<{ name: string; component?: { name: string } }> };
  t.deepEqual(
    xmlui.queries.filter((q) => q.component).map((q) => q.component!.name),
    ["PicoTheme", "PicoSettings", "PicoThemeField", "PicoAccessTokenField"]
  );
  await pe.pf.db.close();
});

test("components are served on the app channel but are not pages", async (t) => {
  const { pe, channels } = await startThermostat();
  const viewer = await channels(["thermostat", "viewer"]);
  const eci = viewer[viewer.length - 1]!.id;
  const base = `${pe.base_url}/ui/${eci}/${RID}`;

  const allow = viewer[viewer.length - 1]!.queryPolicy.allow;
  t.true(allow.some((r) => r.rid === RID && r.name === "readingHistory"));
  t.true(allow.some((r) => r.rid === "io.picolabs.xmlui" && r.name === "picoSettings"));

  const main = await (await fetch(`${base}/Main.xmlui`)).text();
  t.true(main.includes("<Dashboard />"));
  t.false(main.includes("ReadingHistory"));
  t.false(main.includes("PicoSettings"));

  const own = await fetch(`${base}/components/ReadingHistory.xmlui`);
  t.is(own.status, 200);
  t.true((await own.text()).includes('<Component name="ReadingHistory">'));

  for (const name of ["PicoSettings", "PicoThemeField", "PicoTheme"]) {
    const shared = await fetch(`${base}/components/${name}.xmlui`);
    t.is(shared.status, 200, name);
    t.true((await shared.text()).includes(`<Component name="${name}"`), name);
  }

  const builtin = await fetch(`${base}/components/Table.xmlui`);
  t.is(builtin.status, 404);
  await pe.pf.db.close();
});

test("a channel that does not allow a component cannot load it", async (t) => {
  const { pe, signal, channels } = await startThermostat();
  await signal("wrangler", "new_channel_request", {
    tags: ["thermostat", "old"],
    eventPolicy: { allow: [], deny: [] },
    queryPolicy: {
      allow: [
        { rid: RID, name: "dashboard" },
        { rid: "io.picolabs.xmlui", name: "file" },
      ],
      deny: [],
    },
  });
  const old = await channels(["thermostat", "old"]);
  const eci = old[old.length - 1]!.id;
  const base = `${pe.base_url}/ui/${eci}/${RID}`;
  t.is((await fetch(`${base}/components/ReadingHistory.xmlui`)).status, 404);
  t.is((await fetch(`${base}/components/PicoSettings.xmlui`)).status, 404);

  // A flush or install with a schema change raises this.
  await signal("wrangler", "schema_updated", {});
  const updated = await channels(["thermostat", "old"]);
  const allow = updated[updated.length - 1]!.queryPolicy.allow;
  t.true(allow.some((r) => r.rid === RID && r.name === "dashboard"));
  t.true(allow.some((r) => r.rid === RID && r.name === "readingHistory"));
  t.true(allow.some((r) => r.rid === "io.picolabs.xmlui" && r.name === "picoTheme"));
  t.is((await fetch(`${base}/components/ReadingHistory.xmlui`)).status, 200);
  t.is((await fetch(`${base}/components/PicoSettings.xmlui`)).status, 200);
  t.false(
    allow.some((r) => r.rid === "com.example.hello"),
    "only rulesets the channel already allowed"
  );
  await pe.pf.db.close();
});

test("component file resolution order and conflicts", (t) => {
  const q = (rid: string, name: string, kind: "view" | "component") =>
    kind === "view" ? { rid, name, view: { title: name } } : { rid, name, component: { name } };
  const app = "com.example.app";

  t.deepEqual(
    queryForComponentFile(
      [q("io.picolabs.xmlui", "picoTheme", "component"), q(app, "picoTheme", "component")],
      app,
      "PicoTheme"
    ),
    { rid: app, name: "picoTheme" },
    "the app ruleset wins"
  );
  t.deepEqual(
    queryForComponentFile(
      [q("com.example.kit", "picoTheme", "component"), q("io.picolabs.xmlui", "picoTheme", "component")],
      app,
      "PicoTheme"
    ),
    { rid: "io.picolabs.xmlui", name: "picoTheme" },
    "io.picolabs.xmlui before other rulesets"
  );
  t.deepEqual(
    queryForComponentFile([q("com.example.kit", "gauge", "component")], app, "Gauge"),
    { rid: "com.example.kit", name: "gauge" },
    "one other ruleset"
  );
  t.is(
    queryForComponentFile(
      [q("com.example.kit", "gauge", "component"), q("com.example.other", "gauge", "component")],
      app,
      "Gauge"
    ),
    null,
    "two other rulesets conflict"
  );
  t.is(
    queryForComponentFile([q("com.example.kit", "page", "view")], app, "Page"),
    null,
    "built-in name"
  );
  t.is(
    queryForComponentFile([q("com.example.kit", "report", "view")], app, "Report"),
    null,
    "another ruleset's view is not a component"
  );
});
