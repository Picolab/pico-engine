"use strict";

const { z } = require("zod");
const krlCheck = require("krl-compiler/src/check");
const { jsonText } = require("./engineClient");

function textResult(text, isError = false) {
  return {
    content: [{ type: "text", text }],
    isError,
  };
}

const emptySchema = {};

function registerDevTools(server, client) {
  server.tool(
    "engine_status",
    "Local pico-engine connectivity, version, and root UI channel ECI",
    emptySchema,
    async () => {
      try {
        const dev = await client.getDevLocal().catch(() => ({}));
        const uiCtx = await client.getUiContext().catch(() => ({}));
        let uiEci = null;
        try {
          uiEci = await client.resolveUiEci();
        } catch (_err) {
          uiEci = null;
        }
        return textResult(
          jsonText({
            baseUrl: client.baseUrl,
            devLocal: dev,
            uiContext: uiCtx,
            uiEci,
            env: {
              PICO_ENGINE_HOME: process.env.PICO_ENGINE_HOME || null,
              PICO_ENGINE_BASE_URL: process.env.PICO_ENGINE_BASE_URL || null,
              PICO_ENGINE_UI_ECI: process.env.PICO_ENGINE_UI_ECI || null,
            },
            hint:
              uiEci == null
                ? "Start the engine (npm start) and ensure a root pico exists, or set PICO_ENGINE_UI_ECI."
                : undefined,
          })
        );
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "validate_krl",
    "Parse and compile KRL with schema annotation lint (same as krl-check)",
    {
      source: z.string().describe("KRL source text"),
      filename: z
        .string()
        .optional()
        .describe("Optional filename for diagnostics"),
    },
    async ({ source, filename }) => {
      const result = krlCheck(source, filename);
      return textResult(
        jsonText({
          ok: result.ok,
          rid: result.rid,
          errors: result.errors,
          warnings: result.warnings,
        }),
        !result.ok
      );
    }
  );

  server.tool(
    "query",
    "Run a query on a channel ECI (JSON args body)",
    {
      eci: z.string(),
      rid: z.string(),
      name: z.string(),
      args: z.record(z.any()).optional(),
    },
    async ({ eci, rid, name, args }) => {
      try {
        const data = await client.channelQuery(eci, rid, name, args || {});
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "raise_event",
    "Send an event on a channel and wait for the outcome (event-wait)",
    {
      eci: z.string(),
      domain: z.string(),
      name: z.string(),
      attrs: z.record(z.any()).optional(),
    },
    async ({ eci, domain, name, attrs }) => {
      try {
        const data = await client.channelEventWait(
          eci,
          domain,
          name,
          attrs || {}
        );
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "eval_krl",
    "Evaluate a read-only KRL expression in an installed ruleset context (__consoleEval)",
    {
      eci: z.string().describe("Channel ECI of the target pico"),
      rid: z.string().describe("Ruleset id"),
      expression: z.string().describe("KRL expression"),
    },
    async ({ eci, rid, expression }) => {
      try {
        const data = await client.evalKrl(eci, rid, expression);
        if (data && typeof data === "object" && data.error != null) {
          return textResult(jsonText(data), true);
        }
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "list_picos",
    "List picos on this engine (forest boxes: eci, name, parent, children)",
    emptySchema,
    async () => {
      try {
        const boxes = await client.listPicoBoxes();
        return textResult(jsonText(boxes));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "pico_schema",
    "Merged pico schema (wrangler:picoSchema) from the root UI channel",
    {
      format: z.enum(["default", "jsonschema"]).optional(),
    },
    async ({ format }) => {
      try {
        const ui = await client.resolveUiEci();
        const args = {};
        if (format) args.format = format;
        const data = await client.channelQuery(
          ui,
          "io.picolabs.wrangler",
          "picoSchema",
          args
        );
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "ruleset_schema",
    "Ruleset schema for one RID (wrangler:rulesetSchema)",
    { rid: z.string() },
    async ({ rid }) => {
      try {
        const ui = await client.resolveUiEci();
        const data = await client.channelQuery(
          ui,
          "io.picolabs.wrangler",
          "rulesetSchema",
          { rid }
        );
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "list_channels",
    "Channels and rulesets on a pico (io.picolabs.pico-engine-ui/pico query)",
    {
      eci: z.string().optional().describe("UI ECI; default root UI channel"),
    },
    async ({ eci }) => {
      try {
        const target = eci || (await client.resolveUiEci());
        const data = await client.channelQuery(
          target,
          "io.picolabs.pico-engine-ui",
          "pico",
          {}
        );
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "tail_events",
    "Recent pico logs from the Logging tab query (truncated)",
    {
      eci: z.string().optional().describe("Pico UI ECI; default root"),
      limit: z.number().int().min(1).max(30).optional(),
    },
    async ({ eci, limit }) => {
      try {
        const target = eci || (await client.resolveUiEci());
        const logs = await client.channelQuery(
          target,
          "io.picolabs.pico-engine-ui",
          "logs",
          {}
        );
        const max = limit ?? 10;
        return textResult(
          jsonText(Array.isArray(logs) ? logs.slice(0, max) : logs)
        );
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "install_ruleset",
    "Install a ruleset URL on a pico via engine_ui (default root UI channel)",
    {
      url: z.string(),
      eci: z.string().optional().describe("Target pico UI ECI"),
    },
    async ({ url, eci }) => {
      try {
        const ui = eci || (await client.resolveUiEci());
        const data = await client.channelEventWait(ui, "engine_ui", "install", {
          url,
        });
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "flush_ruleset",
    "Flush (reinstall) a ruleset by URL on a pico via engine_ui",
    {
      url: z.string(),
      eci: z.string().optional(),
    },
    async ({ url, eci }) => {
      try {
        const ui = eci || (await client.resolveUiEci());
        const data = await client.channelEventWait(ui, "engine_ui", "flush", {
          url,
        });
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "create_pico",
    "Create a child pico under the root (engine_ui new)",
    {
      name: z.string().optional(),
      backgroundColor: z.string().optional(),
    },
    async (attrs) => {
      try {
        const data = await client.engineUiEvent("new", attrs);
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "delete_pico",
    "Delete a pico by its UI channel ECI (engine_ui del)",
    { eci: z.string().describe("UI ECI of the pico to delete") },
    async ({ eci }) => {
      try {
        const data = await client.engineUiEvent("del", { eci });
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );

  server.tool(
    "create_channel",
    "Create a channel on the root pico (engine_ui new_channel)",
    {
      tags: z.union([z.string(), z.array(z.string())]),
      id: z.string().optional(),
      eventPolicy: z.record(z.any()).optional(),
      queryPolicy: z.record(z.any()).optional(),
    },
    async ({ tags, id, eventPolicy, queryPolicy }) => {
      try {
        const tagList =
          typeof tags === "string"
            ? tags
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean)
            : tags;
        const data = await client.engineUiEvent("new_channel", {
          tags: tagList,
          id,
          eventPolicy,
          queryPolicy,
        });
        return textResult(jsonText(data));
      } catch (err) {
        return textResult(String(err), true);
      }
    }
  );
}

module.exports = { registerDevTools };
