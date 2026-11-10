"use strict";

const fs = require("fs");
const path = require("path");

// Docs live at the repo root (docs/, CLAUDE.md). In a checkout, read them there;
// in an npm install, read the copies `npm pack` bundled into mcp/docs/.
const repoRoot = path.join(__dirname, "..", "..", "..");
const bundledDir = path.join(__dirname, "docs");

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_e) {
    return "";
  }
}

function readDoc(relativeFromRepoRoot) {
  return (
    readFile(path.join(repoRoot, relativeFromRepoRoot)) ||
    readFile(path.join(bundledDir, path.basename(relativeFromRepoRoot)))
  );
}

function registerDevResources(server, client) {
  server.resource(
    "krl-conventions",
    "pico://docs/krl-conventions",
    {
      description: "KRL rule shape and conventions (from CLAUDE.md)",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "pico://docs/krl-conventions",
          mimeType: "text/markdown",
          text: readDoc("CLAUDE.md"),
        },
      ],
    })
  );

  server.resource(
    "pico-overview",
    "pico://docs/pico-overview",
    {
      description: "Pico model overview",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "pico://docs/pico-overview",
          mimeType: "text/markdown",
          text:
            readDoc("docs/pico-overview.md"),
        },
      ],
    })
  );

  server.resource(
    "pico-engine-operator",
    "pico://docs/pico-engine",
    {
      description: "Pico engine operator notes",
      mimeType: "text/markdown",
    },
    async () => ({
      contents: [
        {
          uri: "pico://docs/pico-engine",
          mimeType: "text/markdown",
          text: readDoc("docs/pico-engine.md"),
        },
      ],
    })
  );

  server.prompt(
    "write-ruleset",
    "Draft KRL using pico conventions; optionally pass target ECI to embed channel schema",
    {
      purpose: zOptionalString(),
      eci: zOptionalString(),
    },
    async ({ purpose, eci }) => {
      let schemaBlock = "";
      if (eci) {
        try {
          const ui = await client.resolveUiEci();
          const target = eci || ui;
          const data = await client.channelQuery(
            target,
            "io.picolabs.wrangler",
            "channelSchema",
            { eci: target }
          );
          schemaBlock = `\n\nChannel schema (JSON):\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n`;
        } catch (err) {
          schemaBlock = `\n\n(Could not load channel schema: ${String(err)})\n`;
        }
      }
      const conventions = readDoc("CLAUDE.md");
      return {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text:
                `Write a KRL ruleset${purpose ? ` for: ${purpose}` : ""}. Follow these conventions:\n\n${conventions}${schemaBlock}`,
            },
          },
        ],
      };
    }
  );
}

function zOptionalString() {
  const { z } = require("zod");
  return z.string().optional();
}

module.exports = { registerDevResources };
