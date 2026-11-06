/**
 * config.json served under /ui/:eci/:rid/
 */

import test from "ava";
import fetch from "cross-fetch";
import { startXmluiViewEngine } from "./helpers/xmluiViewHarness";

test("ui-sky-context reports no bearer on open channel", async (t) => {
  const { pe, eci } = await startXmluiViewEngine();
  const res = await fetch(
    `${pe.base_url}/api/ui-sky-context?eci=${encodeURIComponent(eci)}`
  );
  t.is(res.status, 200);
  t.false((await res.json()).bearerRequired);
  await pe.pf.db.close();
});

test("GET config.json exposes appGlobals and path routing", async (t) => {
  const { pe, eci } = await startXmluiViewEngine();
  const res = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.fav_color/config.json`
  );
  t.is(res.status, 200);
  const cfg = await res.json();
  t.is(cfg.name, "Favorite color");
  t.is(cfg.appGlobals.eci, eci);
  t.is(cfg.appGlobals.appRid, "com.example.fav_color");
  t.is(cfg.xmluiConfig.useHashBasedRouting, true);
  await pe.pf.db.close();
});
