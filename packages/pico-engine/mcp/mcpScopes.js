"use strict";

const READ = "mesh:read";
const ACT = "mesh:act";

function granted(scope) {
  return new Set(String(scope || "").split(/\s+/).filter(Boolean));
}

function has(scope, name) {
  return granted(scope).has(name);
}

function hasOperational(scope) {
  return has(scope, READ) || has(scope, ACT);
}

function mcpSurfaceAllowed(policy, surface) {
  const rules = policy || { allow: [], deny: [] };
  const denied = (rules.deny || []).some(
    (rule) => rule && (rule.surface === "*" || rule.surface === surface)
  );
  if (denied) {
    return false;
  }
  return (rules.allow || []).some(
    (rule) => rule && (rule.surface === "*" || rule.surface === surface)
  );
}

function messagesOf(body) {
  if (!body || typeof body !== "object") {
    return [];
  }
  return Array.isArray(body) ? body : [body];
}

/**
 * Scopes this channel-MCP body still needs.
 * `scopeHeader` is the WWW-Authenticate scope value when the call is refused.
 * An empty `missing` means the token may proceed.
 */
function missingChannelScopes(scope, body, catalog) {
  const messages = messagesOf(body);
  const need = new Set();
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      continue;
    }
    const method = msg.method;
    if (!method || String(method).startsWith("notifications/")) {
      continue;
    }
    if (method === "initialize" || method === "ping") {
      continue;
    }
    if (method === "tools/call") {
      const name = msg.params && msg.params.name;
      const entry = (catalog || []).find((tool) => tool.name === name);
      need.add(entry && entry.kind === "event" ? ACT : READ);
      continue;
    }
    need.add(READ);
  }
  return missingFrom(scope, need);
}

const SUBTREE_TOOL_SCOPE = {
  pico_tree: READ,
  pico_channels: READ,
  query: READ,
  raise_event: ACT,
};

function missingSubtreeScopes(scope, body) {
  const messages = messagesOf(body);
  const need = new Set();
  for (const msg of messages) {
    if (!msg || typeof msg !== "object") {
      continue;
    }
    const method = msg.method;
    if (!method || String(method).startsWith("notifications/")) {
      continue;
    }
    if (method === "initialize" || method === "ping") {
      continue;
    }
    if (method === "tools/call") {
      const name = msg.params && msg.params.name;
      need.add(SUBTREE_TOOL_SCOPE[name] || READ);
      continue;
    }
    need.add(READ);
  }
  return missingFrom(scope, need);
}

function missingFrom(scope, need) {
  const missing = [];
  for (const name of need) {
    if (!has(scope, name)) {
      missing.push(name);
    }
  }
  if (missing.length === 0 && !hasOperational(scope)) {
    return { missing: [READ, ACT], scopeHeader: `${READ} ${ACT}` };
  }
  return { missing, scopeHeader: missing.join(" ") };
}

module.exports = {
  READ,
  ACT,
  mcpSurfaceAllowed,
  missingChannelScopes,
  missingSubtreeScopes,
};
