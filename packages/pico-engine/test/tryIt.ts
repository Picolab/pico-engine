/**
 * "Try It!" demos: the engine lists bootstrap rulesets under demos/, serves
 * them at /krl/demos/, and the Thermostat bootstrap sets up its whole demo on
 * a new child pico, the same steps the developer UI's Try It! tab takes.
 */

import test from "ava";
import fetch from "cross-fetch";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { startIsolatedEngine } from "./helpers/isolatedEngine";
import { resolveEngineSettings } from "../src/engineConfig";

const RID = "com.example.thermostat.bootstrap";

type Pe = Awaited<ReturnType<typeof startIsolatedEngine>>;

function uiEvent(pe: Pe, eci: string, name: string, attrs: Record<string, unknown>) {
  return pe.pf.eventWait({ eci, domain: "engine_ui", name, data: { attrs }, time: 0 });
}

function picoInfo(pe: Pe, uiEci: string) {
  return pe.pf.query({
    eci: uiEci,
    rid: "io.picolabs.pico-engine-ui",
    name: "pico",
    args: {},
  }) as Promise<{ children: string[]; channels: Array<{ id: string; tags: string[] }> }>;
}

async function waitFor<T>(fn: () => Promise<T | null | undefined>, ms = 8000): Promise<T> {
  const end = Date.now() + ms;
  for (;;) {
    const v = await fn();
    if (v) return v;
    if (Date.now() > end) throw new Error("timed out");
    await new Promise((r) => setTimeout(r, 100));
  }
}

test("/api/try-it lists bootstrap demos and /krl/demos serves them", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const res = await fetch(`${pe.base_url}/api/try-it`);
  t.is(res.status, 200);
  const { demos } = (await res.json()) as {
    demos: Array<{
      rid: string;
      name: string;
      folder: string;
      url: string;
      path: string;
      docs: string;
      files: Array<{ rid: string; file: string; url: string; path: string }>;
    }>;
  };
  t.deepEqual(
    demos.map((d) => d.folder),
    ["echo", "score_tracker", "xmlui", "two_picos", "child_tasks", "guard_rules", "layered_rulesets", "collection", "secrets", "bootstrap", "kblog"]
  );
  for (const demo of demos as Array<{ folder: string; notes?: string }>) {
    t.true((demo.notes || "").includes("- "), `${demo.folder} has try-it.md notes`);
  }
  const thermostat = demos.find((d) => d.rid === RID);
  t.truthy(thermostat);
  t.is(thermostat!.name, "Thermostat");
  t.is(thermostat!.folder, "xmlui");
  t.is(thermostat!.url, `${pe.base_url}/krl/demos/xmlui/${RID}.krl`);
  t.is(thermostat!.docs, "https://docs.picolabs.io/#/cookbook/xmlui/");
  t.true(path.isAbsolute(thermostat!.path));
  t.true(fs.existsSync(thermostat!.path));
  const app = thermostat!.files.find((f) => f.rid === "com.example.thermostat");
  t.truthy(app);
  t.is(app!.url, `${pe.base_url}/krl/demos/xmlui/com.example.thermostat.krl`);
  t.true(fs.existsSync(app!.path));

  const krl = await fetch(thermostat!.url);
  t.is(krl.status, 200);
  t.true((await krl.text()).includes(`ruleset ${RID}`));

  t.is((await fetch(`${pe.base_url}/krl/demos/../package.json`)).status, 404);
  t.is((await fetch(`${pe.base_url}/krl/demos/xmlui/missing.krl`)).status, 404);
  await pe.pf.db.close();
});

test("the Thermostat bootstrap sets up its demo on a new child", async (t) => {
  const pe = await startIsolatedEngine({ autoCreateRootPico: true });
  const root = pe.pf.rootPicos()[0];
  const rootUi = Object.values(root.channels).find((c) => c.tags.includes("ui"))!.id;

  await uiEvent(pe, rootUi, "new", { name: "Thermostat" });
  const childUi = await waitFor(async () => (await picoInfo(pe, rootUi)).children[0]);

  const url = `${pe.base_url}/krl/demos/xmlui/${RID}.krl`;
  await uiEvent(pe, childUi, "install", { url });

  const tryItEci = await waitFor(async () =>
    (await picoInfo(pe, childUi)).channels.find((c) => c.tags.includes("try_it"))?.id
  );
  const status = await waitFor(async () => {
    const s = (await pe.pf.query({ eci: tryItEci, rid: RID, name: "tryIt", args: {} })) as {
      ready: boolean;
      stage: string;
      links: Array<{ label: string; url: string }>;
    };
    return s.ready ? s : null;
  });
  t.is(status.stage, "ready");
  t.is(status.links.length, 2);

  const channels = (await picoInfo(pe, childUi)).channels;
  t.truthy(channels.find((c) => c.tags.join(",") === "thermostat,viewer"));

  const viewer = status.links[0].url;
  t.regex(viewer, /\/ui\/[^/]+\/com\.example\.thermostat\/$/);
  const main = await fetch(viewer + "Main.xmlui");
  t.is(main.status, 200);
  t.true((await main.text()).includes("<Dashboard />"));

  const viewerEci = viewer.split("/ui/")[1].split("/")[0];
  const readings = (await pe.pf.query({
    eci: viewerEci,
    rid: "com.example.thermostat",
    name: "readings",
    args: {},
  })) as Array<{ temperature: number }>;
  t.deepEqual(readings.map((r) => r.temperature).sort(), [70, 72, 75]);

  await pe.pf.db.close();
});

test("show_tryit_menu defaults to root_only; off hides the demos", async (t) => {
  const def = await startIsolatedEngine({ autoCreateRootPico: true });
  const ctx = (await (await fetch(`${def.base_url}/api/ui-context`)).json()) as { showTryItMenu: string };
  t.is(ctx.showTryItMenu, "root_only");
  await def.pf.db.close();

  const off = await startIsolatedEngine({ autoCreateRootPico: true, showTryItMenu: "off" });
  const offCtx = (await (await fetch(`${off.base_url}/api/ui-context`)).json()) as { showTryItMenu: string };
  t.is(offCtx.showTryItMenu, "off");
  const offList = (await (await fetch(`${off.base_url}/api/try-it`)).json()) as { show: string; demos: unknown[] };
  t.is(offList.show, "off");
  t.deepEqual(offList.demos, []);
  await off.pf.db.close();

  const all = await startIsolatedEngine({ autoCreateRootPico: true, showTryItMenu: "all" });
  const allCtx = (await (await fetch(`${all.base_url}/api/ui-context`)).json()) as { showTryItMenu: string };
  t.is(allCtx.showTryItMenu, "all");
  await all.pf.db.close();

  const saved = process.env.PICO_ENGINE_SHOW_TRYIT_MENU;
  process.env.PICO_ENGINE_SHOW_TRYIT_MENU = "sometimes";
  try {
    t.throws(() => resolveEngineSettings({}), { message: /PICO_ENGINE_SHOW_TRYIT_MENU must be one of off, root_only, all/ });
  } finally {
    if (saved === undefined) delete process.env.PICO_ENGINE_SHOW_TRYIT_MENU;
    else process.env.PICO_ENGINE_SHOW_TRYIT_MENU = saved;
  }
});

// The loop the Try It! modal teaches: edit a shipped demo file, flush it on
// the running demo, see the change. Uses a copy of demos/ so the real files
// stay untouched.
test("editing a demo file and flushing it changes the running demo", async (t) => {
  const copy = fs.mkdtempSync(path.join(os.tmpdir(), "try-it-demos-"));
  fs.cpSync(path.resolve(__dirname, "..", "..", "..", "demos", "xmlui"), path.join(copy, "xmlui"), { recursive: true });
  const saved = process.env.PICO_ENGINE_DEMOS_DIR;
  process.env.PICO_ENGINE_DEMOS_DIR = copy;
  try {
    const pe = await startIsolatedEngine({ autoCreateRootPico: true });
    const root = pe.pf.rootPicos()[0];
    const rootUi = Object.values(root.channels).find((c) => c.tags.includes("ui"))!.id;
    await uiEvent(pe, rootUi, "new", { name: "Thermostat" });
    const childUi = await waitFor(async () => (await picoInfo(pe, rootUi)).children[0]);
    await uiEvent(pe, childUi, "install", { url: `${pe.base_url}/krl/demos/xmlui/${RID}.krl` });
    const tryItEci = await waitFor(async () =>
      (await picoInfo(pe, childUi)).channels.find((c) => c.tags.includes("try_it"))?.id
    );
    const status = await waitFor(async () => {
      const s = (await pe.pf.query({ eci: tryItEci, rid: RID, name: "tryIt", args: {} })) as {
        ready: boolean;
        links: Array<{ url: string }>;
      };
      return s.ready ? s : null;
    });
    const viewerEci = status.links[0].url.split("/ui/")[1].split("/")[0];
    const threshold = () =>
      pe.pf.query({ eci: viewerEci, rid: "com.example.thermostat", name: "threshold", args: {} });
    t.is(await threshold(), 80);

    const file = path.join(copy, "xmlui", "com.example.thermostat.krl");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("ent:threshold.defaultsTo(80)", "ent:threshold.defaultsTo(65)"));
    await uiEvent(pe, childUi, "flush", { url: `${pe.base_url}/krl/demos/xmlui/com.example.thermostat.krl` });
    t.is(await threshold(), 65);
    await pe.pf.db.close();
  } finally {
    if (saved === undefined) delete process.env.PICO_ENGINE_DEMOS_DIR;
    else process.env.PICO_ENGINE_DEMOS_DIR = saved;
  }
});
