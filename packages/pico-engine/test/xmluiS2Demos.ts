/**
 * S2: schema-driven file(), app channels, demo rulesets.
 */

import test from "ava";
import fetch from "cross-fetch";
import {
  installDemoRulesets,
  installXmluiRuleset,
  startXmluiViewEngine,
} from "./helpers/xmluiViewHarness";
import { startTestEngine } from "./helpers/startTestEngine";

test("guestbook app channel launcher lists only Guestbook", async (t) => {
  const { pe, eci: rootEci, signal } = await startTestEngine();
  const root = pe.pf.rootPicos()[0]!;
  await installXmluiRuleset(pe, root);
  await installDemoRulesets(pe, root, [
    "com.example.hello.krl",
    "com.example.guestbook.krl",
  ]);
  await signal("wrangler", "ruleset_installed", {
    rids: ["com.example.guestbook"],
  });

  const channels = await pe.pf.query({
    eci: rootEci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: ["guestbook", "app"] },
  });
  t.true(channels.length >= 1);
  const appEci = channels[channels.length - 1]!.id;

  const launcher = await fetch(`${pe.base_url}/ui/${appEci}/`);
  t.is(launcher.status, 200);
  const html = await launcher.text();
  t.true(html.includes("/ui/" + appEci + "/com.example.guestbook\""));
  t.false(html.includes("com.example.hello"));

  const main = await fetch(
    `${pe.base_url}/ui/${appEci}/com.example.guestbook/Main.xmlui`
  );
  t.is(main.status, 200);
  t.true((await main.text()).includes("<Book />"));

  await pe.pf.db.close();
});

test("thermostat viewer channel hides Settings view", async (t) => {
  const { pe, eci: rootEci, signal } = await startTestEngine();
  const root = pe.pf.rootPicos()[0]!;
  await installXmluiRuleset(pe, root);
  await installDemoRulesets(pe, root, ["com.example.thermostat.krl"]);
  await signal("wrangler", "ruleset_installed", {
    rids: ["com.example.thermostat"],
  });

  const rsSchema = (await pe.pf.query({
    eci: rootEci,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: "com.example.thermostat" },
  })) as {
    operations?: Array<{ rule: string; examples?: unknown[] }>;
  };
  t.truthy(rsSchema?.operations?.length);
  const recordOp = rsSchema!.operations!.find((o) => o.rule === "record_reading");
  t.true((recordOp?.examples?.length ?? 0) >= 1);

  const viewer = await pe.pf.query({
    eci: rootEci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: ["thermostat", "viewer"] },
  });
  t.true(viewer.length >= 1);
  const viewerEci = viewer[viewer.length - 1]!.id;

  const main = await fetch(
    `${pe.base_url}/ui/${viewerEci}/com.example.thermostat/Main.xmlui`
  );
  const mainXml = await main.text();
  t.is(main.status, 200);
  t.true(mainXml.includes("<Dashboard />"));
  t.false(mainXml.includes("Settings"));
  t.false(mainXml.includes("<Settings />"));

  const settingsComponent = await fetch(
    `${pe.base_url}/ui/${viewerEci}/com.example.thermostat/components/Settings.xmlui`
  );
  t.not(settingsComponent.status, 200);

  const admin = await pe.pf.query({
    eci: rootEci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: ["thermostat", "admin"] },
  });
  const adminEci = admin[admin.length - 1]!.id;
  const adminMain = await fetch(
    `${pe.base_url}/ui/${adminEci}/com.example.thermostat/Main.xmlui`
  );
  t.true((await adminMain.text()).includes("<Settings />"));

  await pe.pf.db.close();
});

test("contacts Main.xmlui lists only non-parametric nav", async (t) => {
  const { pe, eci } = await startXmluiViewEngine(["com.example.contacts.krl"]);

  const main = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.contacts/Main.xmlui`
  );
  const text = await main.text();
  t.is(main.status, 200);
  t.true(text.includes("Contacts"));
  t.regex(
    text,
    /<App name="Contacts" layout="vertical-sticky">/
  );
  t.false(text.includes('NavLink label="Contact"'));
  t.true(text.includes('fallbackPath="/list"'));
  t.true(text.includes('<Page url="/list">'));
  t.true(text.includes("<ContactsPage />"));

  const list = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.contacts/components/ContactsPage.xmlui`
  );
  const listXml = await list.text();
  t.is(list.status, 200);
  t.regex(
    listXml,
    new RegExp(`/sky/query/${eci}/com\\.example\\.contacts/contacts`)
  );
  t.true(listXml.includes("No contacts"));
  t.true(listXml.includes("<Form "));
  t.false(listXml.includes("/sky/query/null/"));

  const listRoute = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.contacts/list`
  );
  const listHtml = await listRoute.text();
  t.is(listRoute.status, 200);
  t.true(listHtml.includes("pico-view-boot.js"));
  t.true(listHtml.includes("window.__PICO_VIEW_ECI"));

  const appRoot = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.contacts/`
  );
  const rootHtml = await appRoot.text();
  t.is(appRoot.status, 200);
  t.true(rootHtml.includes('window.__XMLUI_FALLBACK_PATH="/list"'));

  await pe.pf.db.close();
});
