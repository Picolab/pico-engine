/**
 * Pico-level policy ceiling (1.8 §2) on a running engine instance.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const thingCeiling = {
  eventPolicy: {
    allow: [{ domain: "manifold", name: "*" }],
    deny: [],
  },
  queryPolicy: {
    allow: [{ rid: "io.picolabs.thing", name: "*" }],
    deny: [],
  },
};

test("child with narrow ceiling rejects app channels above ceiling", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const childEci = await root.newPico({ policyCeiling: thingCeiling });
  const { pico: child } = pe.pf.lookupChannel(childEci);

  await t.throwsAsync(
    () =>
      child.newChannel({
        tags: ["wide-open"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  await pe.pf.db.close();
});

test("wrangler new_child_request passes policyCeiling to child", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);

  await pe.pf.eventWait({
    eci: ui!.id,
    domain: "wrangler",
    name: "new_child_request",
    data: {
      attrs: {
        name: "ceiling-child",
        policyCeiling: thingCeiling,
      },
    },
    time: 0,
  });

  const childEci = root.toReadOnly().children.slice(-1)[0];
  const { pico: child } = pe.pf.lookupChannel(childEci);
  t.deepEqual(child.policyCeiling?.eventPolicy.allow, thingCeiling.eventPolicy.allow);

  await t.throwsAsync(
    () =>
      child.newChannel({
        tags: ["too-wide"],
        eventPolicy: { allow: [{ domain: "wrangler", name: "*" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.thing", name: "profile" }],
          deny: [],
        },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  await pe.pf.db.close();
});

test("defaultRootPolicyCeiling from operator config limits root newChannel", async (t) => {
  const fs = require("fs") as typeof import("fs");
  const os = require("os") as typeof import("os");
  const path = require("path") as typeof import("path");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pe-root-ceil-"));
  const configPath = path.join(dir, "config.json");
  fs.writeFileSync(
    configPath,
    JSON.stringify({
      defaultRootPolicyCeiling: {
        eventPolicy: {
          allow: [{ domain: "demo", name: "*" }],
          deny: [],
        },
        queryPolicy: {
          allow: [{ rid: "demo.rid", name: "*" }],
          deny: [],
        },
      },
    }),
  );
  process.env.PICO_ENGINE_CONFIG = configPath;

  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];

  await t.throwsAsync(
    () =>
      root.newChannel({
        tags: ["too-wide"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
      }),
    { message: /event policy exceeds pico policy ceiling/i },
  );

  delete process.env.PICO_ENGINE_CONFIG;
  fs.rmSync(dir, { recursive: true, force: true });
  await pe.pf.db.close();
});

test("globalEventDeny blocks events even when channel allows all", async (t) => {
  const pe = await startIsolatedEngine({
    autoCreateRootPico: true,
    globalEventDeny: [{ domain: "engine", name: "secret_ping" }],
  });
  const root = pe.pf.rootPicos()[0];
  const ch = await root.newChannel({
    tags: ["probe"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await t.throwsAsync(
    () =>
      pe.pf.event({
        eci: ch.id,
        domain: "engine",
        name: "secret_ping",
        data: { attrs: {} },
        time: 0,
      }),
    { message: /Denied by channel policy/ },
  );

  await pe.pf.db.close();
});
