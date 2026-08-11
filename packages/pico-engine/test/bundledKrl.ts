/**
 * Bundled KRL URL resolution for engine-shipped rulesets (wrangler, etc.).
 */

import test from "ava";
import * as path from "path";
import {
  bundledKrlDir,
  resolveBundledKrlUrl,
} from "../src/bundledKrl";
import { toFileUrl } from "../src/utils/toFileUrl";

test("resolveBundledKrlUrl maps wrangler to running engine krl/", (t) => {
  const stale = toFileUrl("/some/other/checkout/krl/io.picolabs.wrangler.krl");
  const resolved = resolveBundledKrlUrl(stale);
  t.is(
    resolved,
    toFileUrl(path.join(bundledKrlDir(), "io.picolabs.wrangler.krl"))
  );
});

test("resolveBundledKrlUrl leaves non-bundled rulesets alone", (t) => {
  const custom = toFileUrl("/tmp/io.picolabs.myapp.krl");
  t.is(resolveBundledKrlUrl(custom), custom);
});

test("resolveBundledKrlUrl leaves http URLs alone", (t) => {
  const http = "https://example.com/io.picolabs.wrangler.krl";
  t.is(resolveBundledKrlUrl(http), http);
});
