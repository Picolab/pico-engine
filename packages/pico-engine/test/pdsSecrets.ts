/**
 * Secret PDS settings are masked in queries and logs. The owning ruleset still
 * reads the value with config_value. getChannelEci is not a shared query, and
 * the pds channel cannot clear every setting.
 */

import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

const APP = "io.picolabs.test.secret_owner";
const SECRET = "square-sandbox-key-123";
const REPLACED = "square-sandbox-key-456";

const SRC = `ruleset ${APP} {
  meta {
    use module io.picolabs.pds alias pds
    shares own
  }
  global {
    own = function(key) {
      pds:config_value(key)
    }
  }
}
`;

test("secret settings are masked, and the owner still reads the value", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pds-secret-"));
  const file = path.join(dir, APP + ".krl");
  fs.writeFileSync(file, SRC);
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"))!;
  const pds = await (async () => {
    const end = Date.now() + 20000;
    for (;;) {
      const found = Object.values(root.channels).find((c) => c.tags.includes("pds"));
      if (found) return found;
      if (Date.now() > end) throw new Error("pds channel was not created");
      await new Promise((r) => setTimeout(r, 50));
    }
  })();

  await pe.pf.eventWait({
    eci: pds.id,
    domain: "pds",
    name: "add_settings",
    data: {
      attrs: {
        keyed_rid: APP,
        name: "Owner",
        data_key: "apiKey",
        value: SECRET,
        secret: true,
      },
    },
    time: 0,
  });
  await pe.pf.eventWait({
    eci: pds.id,
    domain: "pds",
    name: "add_settings",
    data: {
      attrs: {
        keyed_rid: APP,
        name: "Owner",
        data_key: "shareEmail",
        value: true,
      },
    },
    time: 0,
  });

  const listed = (await pe.pf.query({
    eci: pds.id,
    rid: "io.picolabs.pds",
    name: "settings",
    args: { Rid: APP },
  })) as { settings: { data: Record<string, unknown> } };
  t.deepEqual(listed.settings.data.apiKey, { secret: true, set: true });
  t.is(listed.settings.data.shareEmail, true);
  t.false(JSON.stringify(listed).includes(SECRET));

  const one = await pe.pf.query({
    eci: pds.id,
    rid: "io.picolabs.pds",
    name: "get_setting_data_value",
    args: { setRID: APP, setKey: "apiKey" },
  });
  t.deepEqual(one, { secret: true, set: true });

  await pe.pf.eventQuery(
    {
      eci: ui.id,
      domain: "engine_ui",
      name: "install",
      data: { attrs: { url: "file://" + file } },
      time: 0,
    },
    { eci: ui.id, rid: "io.picolabs.pico-engine-ui", name: "pico", args: {} }
  );
  const readEci = "secret-owner-read";
  await pe.pf.eventWait({
    eci: ui.id,
    domain: "engine_ui",
    name: "new_channel",
    data: {
      attrs: {
        id: readEci,
        tags: ["test"],
        eventPolicy: { allow: [], deny: [] },
        queryPolicy: { allow: [{ rid: APP, name: "own" }], deny: [] },
      },
    },
    time: 0,
  });
  t.is(
    await pe.pf.query({ eci: readEci, rid: APP, name: "own", args: { key: "apiKey" } }),
    SECRET
  );

  await pe.pf.eventWait({
    eci: pds.id,
    domain: "pds",
    name: "add_settings",
    data: {
      attrs: { keyed_rid: APP, name: "Owner", data_key: "apiKey", value: REPLACED },
    },
    time: 0,
  });
  t.is(
    await pe.pf.query({ eci: readEci, rid: APP, name: "own", args: { key: "apiKey" } }),
    REPLACED
  );
  const again = (await pe.pf.query({
    eci: pds.id,
    rid: "io.picolabs.pds",
    name: "settings",
    args: { Rid: APP, Key: "data", detail: "apiKey" },
  })) as { settings: unknown };
  t.deepEqual(again.settings, { secret: true, set: true });

  await t.throwsAsync(
    () =>
      pe.pf.query({
        eci: pds.id,
        rid: "io.picolabs.pds",
        name: "getChannelEci",
        args: {},
      }),
    { message: /query function/ }
  );
  await t.throwsAsync(
    () =>
      pe.pf.eventWait({
        eci: pds.id,
        domain: "pds",
        name: "clear_all_data",
        data: { attrs: {} },
        time: 0,
      }),
    { message: /channel policy/i }
  );

  const logs = await pe.pf.query({
    eci: ui.id,
    rid: "io.picolabs.pico-engine-ui",
    name: "logs",
    args: {},
  });
  const text = JSON.stringify(logs);
  t.false(text.includes(SECRET), "the first secret is not in the log");
  t.false(text.includes(REPLACED), "the replacement secret is not in the log");

  await pe.pf.db.close();
});
