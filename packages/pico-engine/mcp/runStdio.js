"use strict";

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StdioServerTransport,
} = require("@modelcontextprotocol/sdk/server/stdio.js");
const { EngineClient } = require("./engineClient");
const { registerDevTools } = require("./devTools");
const { registerDevResources } = require("./devResources");

async function runDevMcpStdio() {
  const client = new EngineClient();
  const server = new McpServer(
    {
      name: "pico-engine-dev",
      version: require("../package.json").version,
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  registerDevTools(server, client);
  registerDevResources(server, client);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

module.exports = { runDevMcpStdio };
