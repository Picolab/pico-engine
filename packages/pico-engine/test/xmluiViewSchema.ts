/**
 * @view metadata in rulesetSchema, picoSchema, and channelSchema.
 */

import test from "ava";
import { startTestEngine } from "./helpers/startTestEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";
import { startXmluiViewEngine } from "./helpers/xmluiViewHarness";

test("@view with path appears on rulesetSchema", async (t) => {
  const { pe, eci, installTestFile } = await startTestEngine();
  const root = pe.pf.rootPicos()[0]!;
  await installTestFile(root, "io.test.xmlui_view_path.krl");

  const schema = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: "io.test.xmlui_view_path" },
  });
  const page = schema.queries.find(
    (q: { name: string }) => q.name === "page"
  );
  t.deepEqual(page?.view, { title: "Settings", path: "/settings" });
  await pe.pf.db.close();
});

test("picoSchema and channelSchema include view on @view queries", async (t) => {
  const { pe, eci } = await startXmluiViewEngine(["com.example.hello.krl"]);

  const picoSchema = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "picoSchema",
    args: {},
  });
  const hello = picoSchema.queries.find(
    (q: { rid: string; name: string }) =>
      q.rid === "com.example.hello" && q.name === "hello"
  );
  t.deepEqual(hello?.view, { title: "Hello" });

  const channelSchema = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "channelSchema",
    args: { eci },
  });
  const onChannel = channelSchema.queries.find(
    (q: { rid: string; name: string }) =>
      q.rid === "com.example.hello" && q.name === "hello"
  );
  t.deepEqual(onChannel?.view, { title: "Hello" });
  await pe.pf.db.close();
});

test("contactsPage keeps /list route (not built-in List tag)", async (t) => {
  const { pe, eci } = await startXmluiViewEngine(["com.example.contacts.krl"]);

  const schema = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "rulesetSchema",
    args: { rid: "com.example.contacts" },
  });
  const contactsPage = schema.queries.find(
    (q: { name: string }) => q.name === "contactsPage"
  );
  t.deepEqual(contactsPage?.view, { title: "Contacts", path: "/list" });

  const channelSchema = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "channelSchema",
    args: { eci },
  });
  const onChannel = channelSchema.queries.find(
    (q: { rid: string; name: string }) =>
      q.rid === "com.example.contacts" && q.name === "contactsPage"
  );
  t.deepEqual(onChannel?.view, { title: "Contacts", path: "/list" });

  const main = await fetch(
    `${pe.base_url}/ui/${eci}/com.example.contacts/Main.xmlui`
  );
  const text = await main.text();
  t.true(text.includes('fallbackPath="/list"'));
  t.true(text.includes('<Page url="/list"><ContactsPage /></Page>'));

  await pe.pf.db.close();
});
