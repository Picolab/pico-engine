/**
 * Wrangler channel_update_request: tags and policy updates.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { allowAllChannelConf } from "./helpers/startTestEngine";

test("wrangler channel_update_request updates tags and policies", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const eci = (await root.newChannel(allowAllChannelConf)).id;

  await pe.pf.eventWait({
    eci,
    domain: "wrangler",
    name: "new_channel_request",
    data: {
      attrs: {
        tags: ["hook"],
        eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
        queryPolicy: {
          allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
          deny: [],
        },
      },
    },
    time: 0,
  });

  const created = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: "hook" },
  });
  t.is(created.length, 1);
  const hookEci = created[0].id;

  await pe.pf.eventWait({
    eci,
    domain: "wrangler",
    name: "channel_update_request",
    data: {
      attrs: {
        eci: hookEci,
        tags: ["hook", "oauth-webhook"],
        eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
        queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
      },
    },
    time: 0,
  });

  const updated = await pe.pf.query({
    eci,
    rid: "io.picolabs.wrangler",
    name: "channels",
    args: { tags: "hook,oauth-webhook" },
  });
  t.is(updated.length, 1);
  t.is(updated[0].id, hookEci);
  t.deepEqual(updated[0].tags.sort(), ["hook", "oauth-webhook"]);
});
