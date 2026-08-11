/**
 * Custom channel id via engine_ui new_channel.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

async function uiNewChannel(
  pe: Awaited<ReturnType<typeof startIsolatedEngine>>,
  rootUiEci: string,
  attrs: Record<string, unknown>,
) {
  return pe.pf.eventQuery(
    {
      eci: rootUiEci,
      domain: "engine_ui",
      name: "new_channel",
      data: { attrs },
      time: 0,
    },
    {
      eci: rootUiEci,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    },
  );
}

test("engine_ui new_channel accepts a custom channel id", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const uiChannel = Object.values(root.channels).find((c) =>
    c.tags.includes("ui"),
  );
  t.truthy(uiChannel);
  const customId = "prod-webhook-01";

  const pico = await uiNewChannel(pe, uiChannel!.id, {
    id: customId,
    tags: ["hook"],
    eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
      deny: [],
    },
  });

  const created = (pico.channels || []).find((c: any) => c.id === customId);
  t.truthy(created);
  t.is(pe.pf.lookupChannel(customId).pico.id, root.id);

  await pe.pf.db.close();
});

test("engine_ui new_channel rejects duplicate custom id", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const uiChannel = Object.values(root.channels).find((c) =>
    c.tags.includes("ui"),
  );
  t.truthy(uiChannel);
  const customId = "duplicate-hook-01";
  const attrs = {
    id: customId,
    tags: ["hook"],
    eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
    queryPolicy: {
      allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
      deny: [],
    },
  };

  await uiNewChannel(pe, uiChannel!.id, attrs);

  const err = await t.throwsAsync(uiNewChannel(pe, uiChannel!.id, attrs));
  t.true(String(err).includes("Channel id already in use"));

  await pe.pf.db.close();
});
