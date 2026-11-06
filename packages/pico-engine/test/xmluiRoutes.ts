/**
 * /ui/ route errors and edge cases.
 */

import test from "ava";
import fetch from "cross-fetch";
import { startTestEngine } from "./helpers/startTestEngine";
import {
  installXmluiRuleset,
  startXmluiViewEngine,
} from "./helpers/xmluiViewHarness";

test("GET /ui without io.picolabs.xmlui does not serve view shell", async (t) => {
  const { pe, eci } = await startTestEngine();
  const res = await fetch(`${pe.base_url}/ui/${eci}/com.example.hello/`);
  const html = await res.text();
  t.false(html.includes("pico-view-boot.js"));
  t.false(html.includes("<base href=\"/ui/" + eci + "/com.example.hello/\""));
  await pe.pf.db.close();
});

test("GET /ui returns 404 for unknown app ruleset id", async (t) => {
  const { pe, eci } = await startXmluiViewEngine([]);
  const res = await fetch(`${pe.base_url}/ui/${eci}/com.example.nope/Main.xmlui`);
  t.is(res.status, 404);
  t.is(await res.text(), "Not found");
  await pe.pf.db.close();
});

test("GET /ui component without demo ruleset does not return view markup", async (t) => {
  const { pe, eci } = await startTestEngine();
  const root = pe.pf.rootPicos()[0];
  await installXmluiRuleset(pe, root);
  const res = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.hello/components/Hello.xmlui`
  );
  const markup = await res.text();
  t.false(markup.includes("<H1>Hello</H1>"));
  await pe.pf.db.close();
});

test("GET /ui app root with or without trailing slash serves shell", async (t) => {
  const { pe, eci } = await startXmluiViewEngine([]);
  for (const path of [
    `/ui/${eci}/com.example.hello`,
    `/ui/${eci}/com.example.hello/`,
  ]) {
    const res = await fetch(`${pe.base_url}${path}`);
    t.is(res.status, 200, path);
    t.true((await res.text()).includes("pico-view-boot.js"), path);
  }
  await pe.pf.db.close();
});

test("GET /ui with unknown channel ECI fails", async (t) => {
  const { pe, eci } = await startXmluiViewEngine([]);
  const bogus = "cm0000000000000000000000000";
  t.not(bogus, eci);
  const res = await fetch(
    `${pe.base_url}/ui/${bogus}/com.example.hello/Main.xmlui`
  );
  const body = await res.text();
  t.false(body.includes("<App name"));
  await pe.pf.db.close();
});
