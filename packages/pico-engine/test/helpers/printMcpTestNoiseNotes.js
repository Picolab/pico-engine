"use strict";

/**
 * Printed after `npm run test:mcp` succeeds. stderr above may include these; they are expected.
 */
console.log("");
console.log("MCP tests passed.");
console.log("");
console.log("Expected stderr (safe to ignore when tests are green):");
console.log(
  "  • didwebvh-ts: \"Removing secretKeyMultibase…\" (often twice per test) — WebAuthn / did:webvh"
);
console.log("    bootstrap strips secret key material before DID documents are stored.");
console.log("");
