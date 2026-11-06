/**
 * Smoke: shell assets, view markup, fav_color Sky round-trip.
 */

import test from "ava";
import fetch from "cross-fetch";
import { XMLUI_RUNTIME_PUBLIC_PATH } from "../src/xmluiRuntime";
import { startXmluiViewEngine } from "./helpers/xmluiViewHarness";

test("view shell and demo markup load over /ui/", async (t) => {
  const { pe, eci } = await startXmluiViewEngine();

  const index = await fetch(`${pe.base_url}/ui/${eci}/com.example.hello`);
  t.is(index.status, 200);
  const indexHtml = await index.text();
  t.true(indexHtml.includes("<base href=\"/ui/" + eci + "/com.example.hello/\""));
  t.true(indexHtml.includes("pico-view-boot.js"));
  t.true(indexHtml.includes('window.__PICO_VIEW_USE_HASH_ROUTING="true"'));
  t.true(indexHtml.includes("__PICO_VIEW_ECI=\"" + eci + "\""));
  t.true(indexHtml.includes(XMLUI_RUNTIME_PUBLIC_PATH));
  t.true(
    indexHtml.includes('window.__XMLUI_FALLBACK_PATH="/"'),
    "single-view hello uses app root as fallback, not /hello"
  );

  const boot = await fetch(`${pe.base_url}/xmlui/pico-view-boot.js`);
  t.is(boot.status, 200);
  t.true((await boot.text()).includes("window.xmlui.startApp"));

  const main = await fetch(`${pe.base_url}/ui/${eci}/com.example.hello/Main.xmlui`);
  t.is(main.status, 200);
  const mainXml = await main.text();
  t.true(mainXml.includes("<Hello />"));
  t.true(mainXml.includes('fallbackPath="/"'));
  t.true(mainXml.includes('layout="vertical-sticky"'));
  t.true(mainXml.includes('scrollWholePage="false"'));
  t.false(mainXml.includes("<NavPanel>"), "single-view apps omit redundant nav");
  t.true(mainXml.includes('url="/"'));

  const mainXs = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.hello/Main.xmlui.xs`
  );
  t.is(mainXs.status, 200);
  t.true((await mainXs.text()).includes("__pico_xmlui_codebehind"));

  const helloComponent = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.hello/components/Hello.xmlui`
  );
  t.is(helloComponent.status, 200);
  t.true((await helloComponent.text()).includes("<H1>Hello</H1>"));

  const colorView = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.fav_color/components/ColorView.xmlui`
  );
  t.is(colorView.status, 200);
  t.true((await colorView.text()).includes("favColor"));

  const favMain = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.fav_color/Main.xmlui`
  );
  const favMainXml = await favMain.text();
  t.true(favMainXml.includes('fallbackPath="/"'));
  t.true(favMainXml.includes('url="/"'));
  t.false(favMainXml.includes('fallbackPath="/colorView"'));

  await pe.pf.db.close();
});

test("fav_color event and query round-trip on open channel", async (t) => {
  const { pe, eci } = await startXmluiViewEngine();

  const pick = await fetch(
    `${pe.base_url}/sky/event/${eci}/xmlui/fav_color/fav_color_selected`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fav_color: "#AABBCC" }),
    }
  );
  t.is(pick.status, 200);

  const fav = await fetch(
    `${pe.base_url}/sky/query/${eci}/com.example.fav_color/favColor`
  );
  t.is(fav.status, 200);
  t.is((await fav.json()).code, "#AABBCC");

  await pe.pf.db.close();
});
