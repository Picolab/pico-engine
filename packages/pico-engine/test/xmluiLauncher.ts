/**
 * Channel launcher at GET /ui/:eci
 */

import test from "ava";
import fetch from "cross-fetch";
import { startXmluiViewEngine } from "./helpers/xmluiViewHarness";

test("GET /ui/:eci lists spike demo apps", async (t) => {
  const { pe, eci } = await startXmluiViewEngine();
  const res = await fetch(`${pe.base_url}/ui/${eci}`);
  t.is(res.status, 200);
  const html = await res.text();
  t.true(html.includes("/ui/" + eci + "/com.example.hello\""));
  t.false(html.includes("/ui/" + eci + "/com.example.hello/\""));
  t.true(html.includes("/ui/" + eci + "/com.example.fav_color\""));
  t.true(html.includes("Favorite color"));
  await pe.pf.db.close();
});
