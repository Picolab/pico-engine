"use strict";

const { randomUUID } = require("crypto");
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const {
  StreamableHTTPServerTransport,
} = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { registerMeshTools, meshToolCatalog, getChannelSchema } = require("./meshTools");
const { registerSubtreeTools } = require("./subtreeTools");
const {
  mcpSurfaceAllowed,
  missingChannelScopes,
  missingSubtreeScopes,
} = require("./mcpScopes");

const engineVersion = require("../package.json").version;

/** @type {Map<string, { transport: import("@modelcontextprotocol/sdk/server/streamableHttp.js").StreamableHTTPServerTransport, mcpServer: import("@modelcontextprotocol/sdk/server/mcp.js").McpServer, eci: string }>} */
const sessions = new Map();
/** @type {typeof sessions} */
const subtreeSessions = new Map();

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

async function createSession(sessionMap, name, eci, register) {
  const mcpServer = new McpServer(
    { name, version: engineVersion },
    { capabilities: { tools: {}, resources: {} } }
  );
  register(mcpServer);

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (sessionId) => {
      sessionMap.set(sessionId, { transport, mcpServer, eci });
    },
    onsessionclosed: async (sessionId) => {
      const row = sessionMap.get(sessionId);
      if (row) {
        sessionMap.delete(sessionId);
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
 *
 * `wwwAuthenticate(eci, error)` builds the RFC 6750 challenge. `error` is
 * omitted when the client sent no token.
 */
function registerMeshMcpRoutes(app, core, oauth, wwwAuthenticate) {
  if (!oauth) {
    return;
  }

  function challenge(req, res, eci, surface, error, scope) {
    if (typeof wwwAuthenticate === "function") {
      res.set("WWW-Authenticate", wwwAuthenticate(eci, error, req, surface, scope));
      res.set("Access-Control-Expose-Headers", "WWW-Authenticate");
    }
  }

  function unauthorized(req, res, eci, surface, error) {
    challenge(req, res, eci, surface, error);
    res.status(401).json({
      error: error === "invalid_token" ? "Invalid or expired token" : "Bearer token required",
    });
  }

  function insufficientScope(req, res, eci, surface, scopeHeader) {
    challenge(req, res, eci, surface, "insufficient_scope", scopeHeader);
    res.status(403).json({ error: "insufficient_scope", scope: scopeHeader });
  }

  function bearerToken(req) {
    const header = req.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      return null;
    }
    return header.slice("Bearer ".length).trim();
  }

  async function requireChannelBearer(req, res, next) {
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
    const token = bearerToken(req);
    if (!token) {
      unauthorized(req, res, eci, "channel");
      return;
    }
    try {
      const auth = await oauth.resolveMcpChannelToken(token, eci);
      if (!auth) {
        unauthorized(req, res, eci, "channel", "invalid_token");
        return;
      }
      const catalog = meshToolCatalog(getChannelSchema(core, eci));
      const decision = missingChannelScopes(auth.scope, req.body, catalog);
      if (decision.missing.length) {
        insufficientScope(req, res, eci, "channel", decision.scopeHeader);
        return;
      }
      const channel = core.picoFramework.lookupChannel(eci);
      if (!mcpSurfaceAllowed(channel.mcpPolicy, "channel")) {
        res.status(403).json({ error: "Channel is not exposed to MCP" });
        return;
      }
      req.mcpAuth = auth;
      next();
    } catch (err) {
      next(err);
    }
  }

  async function requireSubtreeBearer(req, res, next) {
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
    const token = bearerToken(req);
    if (!token) {
      unauthorized(req, res, eci, "mesh");
      return;
    }
    try {
      const auth = await oauth.resolveMcpMeshToken(token, eci);
      if (!auth) {
        unauthorized(req, res, eci, "mesh", "invalid_token");
        return;
      }
      const decision = missingSubtreeScopes(auth.scope, req.body);
      if (decision.missing.length) {
        insufficientScope(req, res, eci, "mesh", decision.scopeHeader);
        return;
      }
      req.mcpAuth = auth;
      next();
    } catch (err) {
      next(err);
    }
  }

  function sessionHandler(sessionMap, create) {
    return async (req, res, next) => {
      try {
        const eci = req.params.eci;
        const sessionId = sessionIdFromRequest(req);
        let row = sessionId ? sessionMap.get(sessionId) : undefined;

        if (!row && req.method === "POST" && bodyHasInitialize(req.body)) {
          row = await create(eci, req.mcpAuth);
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
  }

  app.all(
    "/mcp/mesh/:eci",
    requireSubtreeBearer,
    sessionHandler(subtreeSessions, (eci, auth) =>
      createSession(subtreeSessions, "pico-engine-subtree", eci, (mcpServer) => {
        registerSubtreeTools(mcpServer, core, auth.rootPicoId);
      })
    )
  );

  app.all(
    "/mcp/:eci",
    requireChannelBearer,
    sessionHandler(sessions, (eci) =>
      createSession(sessions, "pico-engine-mesh", eci, (mcpServer) => {
        registerMeshTools(mcpServer, core, eci);
      })
    )
  );
}

module.exports = {
  registerMeshMcpRoutes,
  sessions,
  subtreeSessions,
  meshToolCatalog: require("./meshTools").meshToolCatalog,
  getChannelSchema: require("./meshTools").getChannelSchema,
};
