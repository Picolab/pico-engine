/**
 * UI channel policies in uiChannelPolicies.ts must match io.picolabs.pico-engine-ui.krl.
 */
import test from "ava";
import * as fs from "fs";
import * as path from "path";
import {
  UI_CHANNEL_EVENT_POLICY,
  UI_CHANNEL_QUERY_POLICY,
} from "../src/uiChannelPolicies";

const krlPath = path.join(
  __dirname,
  "../krl/io.picolabs.pico-engine-ui.krl"
);
const krlSrc = fs.readFileSync(krlPath, "utf8");

function assertKrlListsEvent(domain: string, name: string) {
  const needle = `"domain": "${domain}", "name": "${name}"`;
  if (!krlSrc.includes(needle)) {
    throw new Error(`KRL uiChannelEventPolicy missing ${domain}:${name}`);
  }
}

function assertKrlListsQuery(rid: string, name: string) {
  const needle = `"rid": "${rid}", "name": "${name}"`;
  if (!krlSrc.includes(needle)) {
    throw new Error(`KRL uiChannelQueryPolicy missing ${rid}/${name}`);
  }
}

test("uiChannelPolicies.ts event allow list matches pico-engine-ui.krl", (t) => {
  for (const e of UI_CHANNEL_EVENT_POLICY.allow) {
    assertKrlListsEvent(e.domain, e.name);
  }
  t.pass();
});

test("uiChannelPolicies.ts query allow list matches pico-engine-ui.krl", (t) => {
  for (const q of UI_CHANNEL_QUERY_POLICY.allow) {
    assertKrlListsQuery(q.rid, q.name);
  }
  t.pass();
});
