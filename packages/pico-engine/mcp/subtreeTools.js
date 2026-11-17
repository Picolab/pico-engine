"use strict";

const { z } = require("zod");
const { mcpSurfaceAllowed } = require("./mcpScopes");
const { getChannelSchema } = require("./meshTools");

function jsonText(data) {
  return JSON.stringify(data, null, 2);
}

function textResult(text, isError = false) {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

function errorResult(message) {
  return textResult(jsonText({ error: message }), true);
}

function picoInSubtree(pf, picoId, rootPicoId) {
  try {
    let pico = pf.getPico(picoId);
    while (pico) {
      if (pico.id === rootPicoId) {
        return true;
      }
      if (!pico.parent) {
        return false;
      }
      pico = pf.getPico(pico.parent);
    }
  } catch (_e) {
    return false;
  }
  return false;
}

async function picoTree(pf, picoId) {
  const pico = pf.getPico(picoId);
  const readOnly = pico.toReadOnly();
  let name = null;
  try {
    const stored = await pico.getEnt("io.picolabs.wrangler", "name");
    name = stored == null || stored === "" ? null : stored;
  } catch (_e) {
    name = null;
  }
  const children = [];
  for (const childId of readOnly.children || []) {
    children.push(await picoTree(pf, childId));
  }
  return {
    id: readOnly.id,
    name,
    rulesets: (readOnly.rulesets || []).map((ruleset) => ruleset.rid),
    children,
  };
}

function meshChannels(core, picoId) {
  const pico = core.picoFramework.getPico(picoId);
  const channels = [];
  for (const channel of Object.values(pico.channels || {})) {
    const readOnly = channel.toReadOnly ? channel.toReadOnly() : channel;
    if (!mcpSurfaceAllowed(readOnly.mcpPolicy, "mesh")) {
      continue;
    }
    channels.push({
      id: readOnly.id,
      tags: readOnly.tags || [],
      channelSchema: getChannelSchema(core, readOnly.id),
    });
  }
  return channels;
}

function registerSubtreeTools(server, core, rootPicoId) {
  const pf = core.picoFramework;

  server.tool(
    "pico_tree",
    "Children, names, and installed rulesets for this mesh",
    {},
    async () => textResult(jsonText(await picoTree(pf, rootPicoId)))
  );

  server.tool(
    "pico_channels",
    "Channels exposed to this mesh endpoint, with tags and channelSchema",
    { pico: z.string() },
    async ({ pico }) => {
      if (!picoInSubtree(pf, pico, rootPicoId)) {
        return errorResult("Pico is not in this mesh");
      }
      return textResult(jsonText(meshChannels(core, pico)));
    }
  );

  server.tool(
    "query",
    "Run a query on a channel exposed to this mesh endpoint",
    {
      eci: z.string(),
      rid: z.string(),
      name: z.string(),
      args: z.record(z.any()).optional(),
    },
    async ({ eci, rid, name, args }) => {
      const refused = refuseChannel(pf, eci, rootPicoId);
      if (refused) {
        return refused;
      }
      try {
        const data = await core.query({
          eci,
          rid,
          name,
          args: args || {},
        });
        return textResult(jsonText(data));
      } catch (err) {
        return policyOrError(err);
      }
    }
  );

  server.tool(
    "raise_event",
    "Raise an event on a channel exposed to this mesh endpoint",
    {
      eci: z.string(),
      domain: z.string(),
      type: z.string(),
      attrs: z.record(z.any()).optional(),
    },
    async ({ eci, domain, type, attrs }) => {
      const refused = refuseChannel(pf, eci, rootPicoId);
      if (refused) {
        return refused;
      }
      try {
        const data = await core.eventWait({
          eci,
          domain,
          name: type,
          data: { attrs: attrs || {} },
          time: 0,
        });
        return textResult(jsonText(data));
      } catch (err) {
        return policyOrError(err);
      }
    }
  );
}

function refuseChannel(pf, eci, rootPicoId) {
  let channel;
  try {
    channel = pf.lookupChannel(eci);
  } catch (_e) {
    return errorResult("Unknown channel");
  }
  if (!picoInSubtree(pf, channel.pico.id, rootPicoId)) {
    return errorResult("Channel is not in this mesh");
  }
  const readOnly = channel.toReadOnly();
  if (!mcpSurfaceAllowed(readOnly.mcpPolicy, "mesh")) {
    return errorResult("Channel is not exposed to the mesh endpoint");
  }
  return null;
}

function policyOrError(err) {
  const msg = String((err && err.message) || err);
  const policy =
    /policy|not allowed|denied|forbidden/i.test(msg) ||
    /channel.*(event|query)/i.test(msg);
  return textResult(jsonText({ error: msg, kind: policy ? "policy" : "error" }), true);
}

module.exports = { registerSubtreeTools };
