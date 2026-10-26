"use strict";

const { z } = require("zod");
const { channelSchemaForEci } = require("pico-engine-core");
const { attrsToZodShape } = require("./schemaToZod");

const MAX_TOOL_NAME = 64;

function sanitizeToolPart(s) {
  return String(s).replace(/[^a-zA-Z0-9_]/g, "_");
}

function eventToolName(domain, name) {
  return sanitizeToolPart(`${domain}_${name}`).slice(0, MAX_TOOL_NAME);
}

function queryToolName(rid, fn) {
  const ridPart = sanitizeToolPart(rid.replace(/\./g, "_"));
  const base = `${ridPart}_${fn}`;
  return base.slice(0, MAX_TOOL_NAME);
}

function jsonText(data) {
  return JSON.stringify(data, null, 2);
}

function textResult(text, isError = false) {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

function getChannelSchema(core, eci) {
  const { pico } = core.picoFramework.lookupChannel(eci);
  return channelSchemaForEci(
    pico,
    core.rsRegistry,
    (id) => core.picoFramework.lookupChannel(id),
    eci
  );
}

/**
 * Catalog of mesh MCP tools for exit tests (names must match channelSchema).
 */
function meshToolCatalog(schema) {
  const used = new Set();
  const tools = [];

  function claim(name) {
    let n = name;
    let i = 2;
    while (used.has(n)) {
      const suffix = `_${i}`;
      n = name.slice(0, MAX_TOOL_NAME - suffix.length) + suffix;
      i += 1;
    }
    used.add(n);
    return n;
  }

  for (const ev of schema.events || []) {
    tools.push({
      name: claim(eventToolName(ev.domain, ev.name)),
      kind: "event",
      domain: ev.domain,
      eventName: ev.name,
    });
  }
  for (const q of schema.queries || []) {
    tools.push({
      name: claim(queryToolName(q.rid, q.name)),
      kind: "query",
      rid: q.rid,
      queryName: q.name,
    });
  }
  return tools;
}

function registerMeshTools(server, core, eci) {
  const schema = getChannelSchema(core, eci);
  const catalog = meshToolCatalog(schema);

  for (const entry of catalog) {
    if (entry.kind === "event") {
      const ev = (schema.events || []).find(
        (e) => e.domain === entry.domain && e.name === entry.eventName
      );
      const shape = attrsToZodShape(ev?.attrs || []);
      const inputSchema =
        Object.keys(shape).length > 0 ? shape : { _note: z.string().optional() };
      const desc =
        ev?.description ||
        `Raise ${entry.domain} event "${entry.eventName}" on channel ${eci}`;

      server.tool(entry.name, desc, inputSchema, async (attrs) => {
        try {
          const payload = { ...(attrs || {}) };
          delete payload._note;
          const data = await core.eventWait({
            eci,
            domain: entry.domain,
            name: entry.eventName,
            data: { attrs: payload },
            time: 0,
          });
          return textResult(jsonText(data));
        } catch (err) {
          const msg = String(err?.message || err);
          const policy =
            /policy|not allowed|denied|forbidden/i.test(msg) ||
            /channel.*(event|query)/i.test(msg);
          return textResult(
            jsonText({
              error: msg,
              kind: policy ? "policy" : "error",
            }),
            true
          );
        }
      });
    } else {
      const q = (schema.queries || []).find(
        (x) => x.rid === entry.rid && x.name === entry.queryName
      );
      const rawArgs = Array.isArray(q?.args) ? q.args : [];
      const shape = attrsToZodShape(rawArgs);
      const inputSchema =
        Object.keys(shape).length > 0 ? shape : { _note: z.string().optional() };
      const desc =
        q?.description ||
        `Query ${entry.rid}:${entry.queryName} on channel ${eci}`;

      server.tool(entry.name, desc, inputSchema, async (args) => {
        try {
          const payload = { ...(args || {}) };
          delete payload._note;
          const data = await core.query({
            eci,
            rid: entry.rid,
            name: entry.queryName,
            args: payload,
          });
          return textResult(jsonText(data));
        } catch (err) {
          const msg = String(err?.message || err);
          const policy =
            /policy|not allowed|denied|forbidden/i.test(msg) ||
            /channel.*(event|query)/i.test(msg);
          return textResult(
            jsonText({
              error: msg,
              kind: policy ? "policy" : "error",
            }),
            true
          );
        }
      });
    }
  }

  server.resource(
    "pico-channel-schema",
    `pico://channel/${eci}/schema`,
    {
      description: "Merged pico schema filtered to this channel's policy",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: `pico://channel/${eci}/schema`,
          mimeType: "application/json",
          text: jsonText(schema),
        },
      ],
    })
  );
}

module.exports = {
  registerMeshTools,
  meshToolCatalog,
  getChannelSchema,
  eventToolName,
  queryToolName,
};
