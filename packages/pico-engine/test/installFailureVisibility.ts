/**
 * Exit criterion #6: install validation surfaces errors and ruleset_install_failed.
 */

import test from "ava";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { validateKrl } from "pico-engine-core";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { toTestKrlURL } from "./helpers/toTestKrlURL";

function findRaisedEvent(
  resp: unknown,
  domain: string,
  name: string
): Record<string, unknown> | null {
  const hits: Record<string, unknown>[] = [];
  const walk = (node: unknown) => {
    if (!node || typeof node !== "object") return;
    const o = node as Record<string, unknown>;
    if (o.domain === domain && o.name === name) {
      const data = o.data as { attrs?: unknown } | undefined;
      const attrs = (data?.attrs ?? o.attrs) as Record<string, unknown> | undefined;
      if (attrs) hits.push(attrs);
    }
    const events = (o as { events?: unknown[] }).events;
    if (Array.isArray(events)) events.forEach(walk);

    for (const v of Object.values(o)) {
      if (Array.isArray(v)) v.forEach(walk);
      else walk(v);
    }
  };
  walk(resp);
  return hits[0] || null;
}

test("ctx:validate rejects broken KRL URL before install", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);

  const badUrl = toTestKrlURL("io.picolabs.test.bad_install.krl");
  const check = await validateKrl(badUrl, pe.rsRegistry);
  t.false(check.ok);
  t.truthy(check.errors.length);

  await pe.shutdown();
});

test("install_ruleset_request raises ruleset_install_failed for invalid KRL", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);

  const badUrl = toTestKrlURL("io.picolabs.test.bad_install.krl");
  const picoBefore = await pe.pf.query({
    eci: ui!.id,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const beforeRids = new Set(
    ((picoBefore as { rulesets?: { rid: string }[] }).rulesets || []).map(
      (r) => r.rid
    )
  );

  const resp = await pe.core.eventWait({
    eci: ui!.id,
    domain: "wrangler",
    name: "install_ruleset_request",
    data: { attrs: { url: badUrl } },
    time: 0,
  });

  const failed = findRaisedEvent(resp, "wrangler", "ruleset_install_failed");
  t.truthy(failed, "expected ruleset_install_failed attrs");
  t.is(failed!.url, badUrl);
  t.true(Array.isArray(failed!.errors));
  t.true((failed!.errors as unknown[]).length > 0);

  const installed = findRaisedEvent(resp, "wrangler", "ruleset_installed");
  t.falsy(installed);

  const picoAfter = await pe.pf.query({
    eci: ui!.id,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  });
  const afterRids = new Set(
    ((picoAfter as { rulesets?: { rid: string }[] }).rulesets || []).map(
      (r) => r.rid
    )
  );
  t.deepEqual(afterRids, beforeRids);
  t.false(afterRids.has("io.picolabs.test.bad_install"));

  await pe.shutdown();
});

test("engine_ui flush raises ruleset_flush_failed for invalid KRL at url", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const ui = Object.values(root.channels).find((c) => c.tags.includes("ui"));
  t.truthy(ui);

  const badUrl = toTestKrlURL("io.picolabs.test.bad_install.krl");
  const resp = await pe.core.eventWait({
    eci: ui!.id,
    domain: "engine_ui",
    name: "flush",
    data: { attrs: { url: badUrl } },
    time: 0,
  });

  const failed = findRaisedEvent(resp, "wrangler", "ruleset_flush_failed");
  t.truthy(failed, "expected ruleset_flush_failed attrs");
  t.is(failed!.url, badUrl);
  t.true(Array.isArray(failed!.errors));
  t.true((failed!.errors as unknown[]).length > 0);

  const succeeded = findRaisedEvent(resp, "engine_ui", "flush_succeeded");
  t.falsy(succeeded);

  await pe.shutdown();
});

test("krl-check reports syntax error with line/col for bad ruleset file", async (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "krl-check-"));
  const file = path.join(dir, "bad.krl");
  fs.writeFileSync(
    file,
    `ruleset io.test.bad {\n  meta { }\n  stray\n  rule r { select when a b if true then noop() }\n}\n`
  );
  const { execFileSync } = await import("child_process");
  const bin = path.resolve(
    __dirname,
    "../../krl-compiler/bin/krl-check"
  );
  try {
    execFileSync(process.execPath, [bin, file], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    t.fail("expected non-zero exit");
  } catch (err: unknown) {
    const e = err as { status?: number; stderr?: string };
    t.not(e.status, 0);
    t.regex(e.stderr || "", /error:/i);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
