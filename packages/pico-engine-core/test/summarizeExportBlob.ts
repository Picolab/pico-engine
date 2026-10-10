import test from "ava";
import { sealPortableBlob } from "../src/rulesetStateCrypto";
import {
  normalizePortableExportBlobArg,
  summarizeSubtreeExportBlob,
  type SubtreeExportPayload,
} from "../src/subtreeState";

test("normalizePortableExportBlobArg unwraps exportPortableThing JSON", (t) => {
  const payload: SubtreeExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    root: {
      oldPicoId: "x",
      rulesets: [],
      channels: [],
      children: [],
      ent: {},
    },
  };
  const blob = sealPortableBlob(payload, "s");
  const wrapped = JSON.stringify({ blob, name: "Bike", donorQueryEci: null });
  t.is(normalizePortableExportBlobArg(wrapped), blob);
});

test("normalizePortableExportBlobArg unwraps JSON-quoted envelope paste", (t) => {
  const payload: SubtreeExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    root: {
      oldPicoId: "x",
      rulesets: [],
      channels: [],
      children: [],
      ent: {},
    },
  };
  const blob = sealPortableBlob(payload, "s");
  const quoted = JSON.stringify(blob);
  t.is(normalizePortableExportBlobArg(quoted), blob);
  const summary = summarizeSubtreeExportBlob(quoted, "s");
  t.is(summary.rootPicoId, "x");
});

test("summarizeSubtreeExportBlob reports names and established count", (t) => {
  const payload: SubtreeExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    root: {
      oldPicoId: "bike-old",
      rulesets: [{ rid: "io.picolabs.subscription", url: "mem://x", config: {} }],
      channels: [],
      children: [],
      ent: {
        "io.picolabs.wrangler": { name: "Gravel Bike #7" },
        "io.picolabs.subscription": {
          established: [{ Id: "s1", Tx_role: "community", layer2: false }],
        },
      },
      identity: {
        webvhDid: "did:webvh:example",
        webvhLog: [{}],
        webvhKeys: {},
        publicIntro: true,
        peerSubscriptions: [{ subscriptionId: "s1", peerDid: "did:peer:1", createdAt: "" }],
      },
    },
  };
  const blob = sealPortableBlob(payload, "gear");
  const summary = summarizeSubtreeExportBlob(blob, "gear");
  t.is(summary.wranglerName, "Gravel Bike #7");
  t.is(summary.establishedCount, 1);
  t.true(summary.entRulesets.includes("io.picolabs.subscription"));
  t.true(summary.hasIdentity);
  t.is(summary.peerSubscriptionCount, 1);
});
