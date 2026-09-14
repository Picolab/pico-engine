/**
 * Engine-shipped KRL directory listing and URL resolution.
 */

import test from "ava";
import * as path from "path";
import {
  bundledKrlDir,
  engineKrlFileUrl,
  engineKrlHttpPath,
  engineKrlRelativeFromUrl,
  listEngineKrlRelativePaths,
  listEngineKrlSources,
  resolveBundledKrlUrl,
  resolveEngineKrlFile,
} from "../src/bundledKrl";
import { toFileUrl } from "../src/utils/toFileUrl";

test("listEngineKrlRelativePaths includes shipped optional rulesets", (t) => {
  const paths = listEngineKrlRelativePaths();
  t.true(paths.includes("io.picolabs.wrangler.krl"));
  t.true(paths.includes("io.picolabs.oauth.krl"));
  t.false(paths.some((p) => p.includes("didtestdid")));
});

test("listEngineKrlSources returns rid and metadata", (t) => {
  const oauth = listEngineKrlSources("http://localhost:3000").find(
    (source) => source.rid === "io.picolabs.oauth"
  );
  t.truthy(oauth);
  t.is(oauth!.name, "OAuth Mesh");
  t.is(oauth!.url, "http://localhost:3000/krl/io.picolabs.oauth.krl");
  t.true(oauth!.rootOnly);
});

test("resolveBundledKrlUrl maps wrangler to running engine krl/", (t) => {
  const stale = toFileUrl("/some/other/checkout/krl/io.picolabs.wrangler.krl");
  const resolved = resolveBundledKrlUrl(stale);
  t.is(
    resolved,
    toFileUrl(path.join(bundledKrlDir(), "io.picolabs.wrangler.krl"))
  );
});

test("resolveBundledKrlUrl maps optional oauth ruleset by basename", (t) => {
  const stale = toFileUrl("/var/old/image/krl/io.picolabs.oauth.krl");
  const resolved = resolveBundledKrlUrl(stale);
  t.is(
    resolved,
    toFileUrl(path.join(bundledKrlDir(), "io.picolabs.oauth.krl"))
  );
});

test("resolveBundledKrlUrl maps /krl/ HTTP URLs to local files", (t) => {
  const http = "https://picos.example.net/krl/io.picolabs.oauth.krl";
  const resolved = resolveBundledKrlUrl(http);
  t.is(
    resolved,
    toFileUrl(path.join(bundledKrlDir(), "io.picolabs.oauth.krl"))
  );
});

test("resolveBundledKrlUrl leaves unrelated local rulesets alone", (t) => {
  const custom = toFileUrl("/tmp/io.picolabs.myapp.krl");
  t.is(resolveBundledKrlUrl(custom), custom);
});

test("resolveBundledKrlUrl leaves unrelated http URLs alone", (t) => {
  const http = "https://example.com/io.picolabs.custom.krl";
  t.is(resolveBundledKrlUrl(http), http);
});

test("resolveEngineKrlFile rejects path traversal", (t) => {
  t.is(resolveEngineKrlFile("../package.json"), null);
});

test("engineKrlHttpPath preserves nested paths", (t) => {
  t.is(
    engineKrlHttpPath("examples/io.picolabs.custom.krl"),
    "/krl/examples/io.picolabs.custom.krl"
  );
});

test("engineKrlRelativeFromUrl recognizes nested file URLs", (t) => {
  const fileUrl = toFileUrl(
    path.join(bundledKrlDir(), "examples/io.picolabs.custom.krl")
  );
  t.is(
    engineKrlRelativeFromUrl(fileUrl),
    "examples/io.picolabs.custom.krl"
  );
});

test("engineKrlFileUrl without baseUrl uses file://", (t) => {
  t.is(
    engineKrlFileUrl("io.picolabs.oauth.krl"),
    toFileUrl(path.join(bundledKrlDir(), "io.picolabs.oauth.krl"))
  );
});
