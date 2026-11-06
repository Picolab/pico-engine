/**
 * View component fetch respects channel query policy.
 */

import test from "ava";
import fetch from "cross-fetch";
import { ChannelConfig } from "pico-framework";
import { startTestEngine } from "./helpers/startTestEngine";
import {
  installDemoRulesets,
  installXmluiRuleset,
} from "./helpers/xmluiViewHarness";

const narrowQueryPolicy: ChannelConfig = {
  tags: ["xmlui-narrow"],
  eventPolicy: {
    allow: [{ domain: "*", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [
      { rid: "io.picolabs.xmlui", name: "file" },
      { rid: "com.example.hello", name: "hello" },
    ],
    deny: [
      { rid: "com.example.fav_color", name: "colorView" },
      { rid: "com.example.fav_color", name: "favColor" },
    ],
  },
};

test("denied view query blocked on narrow channel", async (t) => {
  const { pe } = await startTestEngine();
  const root = pe.pf.rootPicos()[0];
  await installXmluiRuleset(pe, root);
  await installDemoRulesets(pe, root, [
    "com.example.hello.krl",
    "com.example.fav_color.krl",
  ]);
  const narrow = await root.newChannel(narrowQueryPolicy);

  const allowed = await fetch(
    `${pe.base_url}/ui/${narrow.id}/com.example.hello/components/Hello.xmlui`
  );
  t.is(allowed.status, 200);
  t.true((await allowed.text()).includes("<H1>Hello</H1>"));

  const deniedComponent = await fetch(
    `${pe.base_url}/ui/${narrow.id}/com.example.fav_color/components/ColorView.xmlui`
  );
  const deniedMarkup = await deniedComponent.text();
  t.false(deniedMarkup.includes("<DataSource"));

  await t.throwsAsync(
    pe.pf.query({
      eci: narrow.id,
      rid: "com.example.fav_color",
      name: "favColor",
      args: {},
    }),
    { message: /channel policy/i }
  );

  await pe.pf.db.close();
});
