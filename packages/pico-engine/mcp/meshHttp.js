"use strict";

const { randomUUID } = require("crypto");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { registerMeshTools } = require("./meshTools");

const engineVersion = require("../package.json").version;

/** @type {Map<string, { transport: import("@modelcontextprotocol/sdk/server/streamableHttp.js").StreamableHTTPServerTransport, mcpServer: import("@modelcontextprotocol/sdk/server/mcp.js").McpServer, eci: string }>} */
const sessions = new Map();

function bodyHasInitialize(body) {
  if (!body || typeof body !== "object") return false;
  const batch = Array.isArray(body) ? body : [body];
  return batch.some(
    (m) => m && typeof m === "object" && m.method === "initialize"
  );
}

function sessionIdFromRequest(req) {
  const raw =
    req.headers["mcp-session-id"] ||
    req.headers["Mcp-Session-Id"] ||
    req.headers["MCP-Session-Id"];
  return typeof raw === "string" && raw.trim() ? raw.trim() : undefined;
}

async function createMeshSession(core, eci) {
  const mcpServer = new McpServer(
    {
      name: "pico-engine-mesh",
      version: engineVersion,
    },
    { capabilities: { tools: {}, resources: {} } }
  );

  registerMeshTools(mcpServer, core, eci);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessions.set(sessionId, { transport, mcpServer, eci });
    },
    onsessionclosed: async (sessionId) => {
      const row = sessions.get(sessionId);
      if (row) {
        sessions.delete(sessionId);
        try {
          await row.mcpServer.close();
        } catch (_e) {
          // ignore
        }
      }
    },
  });

  await mcpServer.connect(transport);
  return { transport, mcpServer, eci };
}

/**
 * Streamable HTTP mesh MCP at `/mcp/:eci` (OAuth bearer scoped to that ECI).
 */
function registerMeshMcpRoutes(app, core, oauth) {
  if (!oauth) {
    return;
  }

  async function requireMeshBearer(req, res, next) {
    const eci = req.params.eci;
    if (!eci) {
      res.status(400).json({ error: "Missing channel ECI" });
      return;
    }
    try {
      core.picoFramework.lookupChannel(eci);
    } catch (_e) {
      res.status(404).json({ error: "Unknown channel ECI" });
      return;
    }
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      res.status(401).json({ error: "Bearer token required" });
      return;
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const valid = await oauth.validateSkyBearerToken(token, eci);
      if (!valid) {
        res.status(401).json({ error: "Invalid or expired token" });
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  }

  const handler = async (req, res, next) => {
    try {
      const eci = req.params.eci;
      const sessionId = sessionIdFromRequest(req);
      let row = sessionId ? sessions.get(sessionId) : undefined;

      if (!row && req.method === "POST" && bodyHasInitialize(req.body)) {
        row = await createMeshSession(core, eci);
      }

      if (!row) {
        if (sessionId) {
          res.status(404).json({ error: "Unknown MCP session" });
          return;
        }
        res.status(400).json({
          error: "MCP session required (send initialize on POST without session id)",
        });
        return;
      }

      if (row.eci !== eci) {
        res.status(403).json({ error: "Session ECI mismatch" });
        return;
      }

      await row.transport.handleRequest(req, res, req.body);
    } catch (err) {
      next(err);
    }
  };

  app.all("/mcp/:eci", requireMeshBearer, handler);
}

module.exports = { registerMeshMcpRoutes, sessions, meshToolCatalog: require("./meshTools").meshToolCatalog, getChannelSchema: require("./meshTools").getChannelSchema };
