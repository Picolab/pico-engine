/**
 * MCP authorization discovery: RFC 8414, RFC 9728, and the 401 challenge on /mcp/:eci.
 */

import test from "ava";
import fetch from "cross-fetch";
import {
  MCP_CHANNEL_SCOPE,
  MCP_SCOPES,
  authorizationServerMetadata,
  bearerChallengeHeader,
  canonicalBaseUrl,
  protectedResourceMetadata,
  protectedResourceMetadataUrl,
} from "../src/oauth/discovery";
import { startIsolatedEngine } from "./helpers/isolatedEngine";

test("canonicalBaseUrl drops a trailing slash and falls back to the request", (t) => {
  t.is(canonicalBaseUrl("http://localhost:3000/"), "http://localhost:3000");
  t.is(
    canonicalBaseUrl(undefined, {
      protocol: "http",
      get: () => "127.0.0.1:9",
    }),
    "http://127.0.0.1:9"
  );
});

test("authorization server metadata names this engine and S256", (t) => {
  const doc = authorizationServerMetadata("http://localhost:3000/");
  t.is(doc.issuer, "http://localhost:3000");
  t.is(doc.authorization_endpoint, "http://localhost:3000/oauth/authorize");
  t.is(doc.token_endpoint, "http://localhost:3000/oauth/token");
  t.deepEqual(doc.response_types_supported, ["code"]);
  t.deepEqual(doc.code_challenge_methods_supported, ["S256"]);
  t.true(doc.grant_types_supported.includes("authorization_code"));
  t.true(doc.grant_types_supported.includes("refresh_token"));
  t.deepEqual(doc.scopes_supported, [...MCP_SCOPES]);
  t.deepEqual(doc.token_endpoint_auth_methods_supported, ["none", "client_secret_post"]);
  t.true(doc.client_id_metadata_document_supported);
});

test("protected resource metadata is path-suffixed for channel and mesh", (t) => {
  const channel = protectedResourceMetadata("http://localhost:3000", "eci 1", "channel");
  t.is(channel.resource, "http://localhost:3000/mcp/eci%201");
  t.deepEqual(channel.authorization_servers, ["http://localhost:3000"]);
  t.deepEqual(channel.bearer_methods_supported, ["header"]);
  t.is(
    protectedResourceMetadataUrl("http://localhost:3000", "eci 1", "channel"),
    "http://localhost:3000/.well-known/oauth-protected-resource/mcp/eci%201"
  );
  const mesh = protectedResourceMetadata("http://localhost:3000", "eci1", "mesh");
  t.is(mesh.resource, "http://localhost:3000/mcp/mesh/eci1");
  t.is(
    protectedResourceMetadataUrl("http://localhost:3000", "eci1", "mesh"),
    "http://localhost:3000/.well-known/oauth-protected-resource/mcp/mesh/eci1"
  );
});

test("bearer challenge quotes the metadata URL and adds error only when a token was refused", (t) => {
  const url = "http://localhost:3000/.well-known/oauth-protected-resource/mcp/eci1";
  t.is(
    bearerChallengeHeader(url, MCP_CHANNEL_SCOPE),
    `Bearer resource_metadata="${url}", scope="${MCP_CHANNEL_SCOPE}"`
  );
  t.true(
    bearerChallengeHeader(url, MCP_CHANNEL_SCOPE, "invalid_token").includes(
      'error="invalid_token"'
    )
  );
});

test.serial("engine serves discovery documents and challenges /mcp/:eci", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  try {
    const eci = pe.uiECI;
    t.truthy(eci);
    const base = pe.base_url.replace(/\/$/, "");

    const as = await fetch(`${base}/.well-known/oauth-authorization-server`);
    t.is(as.status, 200);
    t.true((as.headers.get("content-type") || "").includes("application/json"));
    const asBody = (await as.json()) as {
      issuer: string;
      authorization_endpoint: string;
      token_endpoint: string;
      code_challenge_methods_supported: string[];
      scopes_supported: string[];
    };
    t.is(asBody.issuer, base);
    t.is(asBody.authorization_endpoint, `${base}/oauth/authorize`);
    t.is(asBody.token_endpoint, `${base}/oauth/token`);

    const pathAs = await fetch(
      `${base}/.well-known/oauth-authorization-server/mcp/${encodeURIComponent(eci!)}`
    );
    t.is(pathAs.status, 200);
    const pathBody = (await pathAs.json()) as {
      issuer: string;
      authorization_endpoint: string;
      token_endpoint_auth_methods_supported: string[];
      client_id_metadata_document_supported: boolean;
    };
    t.is(pathBody.issuer, base);
    t.is(pathBody.authorization_endpoint, `${base}/oauth/authorize`);
    t.true(pathBody.token_endpoint_auth_methods_supported.includes("none"));
    t.true(pathBody.client_id_metadata_document_supported);
    t.deepEqual(asBody.code_challenge_methods_supported, ["S256"]);
    t.deepEqual(asBody.scopes_supported, [...MCP_SCOPES]);

    const prmUrl = `${base}/.well-known/oauth-protected-resource/mcp/${encodeURIComponent(eci!)}`;
    const prm = await fetch(prmUrl);
    t.is(prm.status, 200);
    const prmBody = (await prm.json()) as {
      resource: string;
      authorization_servers: string[];
      bearer_methods_supported: string[];
    };
    t.is(prmBody.resource, `${base}/mcp/${encodeURIComponent(eci!)}`);
    t.deepEqual(prmBody.authorization_servers, [base]);
    t.deepEqual(prmBody.bearer_methods_supported, ["header"]);

    const mesh = await fetch(
      `${base}/.well-known/oauth-protected-resource/mcp/mesh/${encodeURIComponent(eci!)}`
    );
    t.is(mesh.status, 200);
    const meshBody = (await mesh.json()) as { resource: string };
    t.is(meshBody.resource, `${base}/mcp/mesh/${encodeURIComponent(eci!)}`);

    const missing = await fetch(
      `${base}/.well-known/oauth-protected-resource/mcp/no-such-channel`
    );
    t.is(missing.status, 404);

    const denied = await fetch(`${base}/mcp/${encodeURIComponent(eci!)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    t.is(denied.status, 401);
    const challenge = denied.headers.get("www-authenticate") || "";
    t.true(challenge.startsWith("Bearer "));
    t.true(challenge.includes(`resource_metadata="${prmUrl}"`));
    t.true(challenge.includes(`scope="${MCP_CHANNEL_SCOPE}"`));
    t.false(challenge.includes("error="));
    t.true((denied.headers.get("access-control-expose-headers") || "").includes("WWW-Authenticate"));

    const rejected = await fetch(`${base}/mcp/${encodeURIComponent(eci!)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer not-a-token",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    t.is(rejected.status, 401);
    t.true((rejected.headers.get("www-authenticate") || "").includes('error="invalid_token"'));
  } finally {
    await pe.shutdown();
  }
});
