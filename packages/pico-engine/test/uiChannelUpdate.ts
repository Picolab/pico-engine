/**
 * UI channel update_channel after provision refresh.
 */

import test from "ava";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { uiECIForPico } from "../src/provisionRoot";

test("update_channel allowed on UI channel after provision refresh", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const uiEci = uiECIForPico(root);
  t.truthy(uiEci);

  const hook = await root.newChannel({
    tags: ["hook"],
    eventPolicy: { allow: [{ domain: "*", name: "*" }], deny: [] },
    queryPolicy: { allow: [{ rid: "*", name: "*" }], deny: [] },
  });

  await pe.pf.eventQuery(
    {
      eci: uiEci!,
      domain: "engine_ui",
      name: "update_channel",
      data: {
        attrs: {
          eci: hook.id,
          tags: ["hook", "oauth-webhook"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
          mcpPolicy: { allow: [{ surface: "channel" }], deny: [] },
        },
      },
      time: 0,
    },
    {
      eci: uiEci!,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    }
  );

  const pico = await pe.pf.query({
    eci: uiEci!,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const updated = (pico.channels || []).find((c: any) => c.id === hook.id);
  t.deepEqual(updated.tags.sort(), ["hook", "oauth-webhook"]);
  t.deepEqual(updated.mcpPolicy, {
    allow: [{ surface: "channel" }],
    deny: [],
  });

  await pe.pf.eventQuery(
    {
      eci: uiEci!,
      domain: "engine_ui",
      name: "update_channel",
      data: {
        attrs: {
          eci: hook.id,
          tags: ["hook", "oauth-webhook"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
        },
      },
      time: 0,
    },
    {
      eci: uiEci!,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    }
  );
  const kept = (
    await pe.pf.query({
      eci: uiEci!,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    })
  ).channels.find((c: any) => c.id === hook.id);
  t.deepEqual(kept.mcpPolicy, updated.mcpPolicy, "omitting mcpPolicy leaves exposure");

  await pe.pf.eventQuery(
    {
      eci: uiEci!,
      domain: "engine_ui",
      name: "update_channel",
      data: {
        attrs: {
          eci: hook.id,
          tags: ["hook", "oauth-webhook"],
          eventPolicy: { allow: [{ domain: "hook", name: "ping" }], deny: [] },
          queryPolicy: {
            allow: [{ rid: "io.picolabs.wrangler", name: "name" }],
            deny: [],
          },
          mcpPolicy: { allow: [], deny: [] },
        },
      },
      time: 0,
    },
    {
      eci: uiEci!,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    }
  );
  const cleared = (
    await pe.pf.query({
      eci: uiEci!,
      rid: "io.picolabs.pico-engine-ui",
      name: "pico",
      args: {},
    })
  ).channels.find((c: any) => c.id === hook.id);
  t.deepEqual(cleared.mcpPolicy, { allow: [], deny: [] });
});
