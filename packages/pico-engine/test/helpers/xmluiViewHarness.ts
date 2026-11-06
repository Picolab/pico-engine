/**
 * Install io.picolabs.xmlui and demo view rulesets for /ui/ tests.
 */

import { Pico } from "pico-framework";
import { engineKrlFileUrl } from "../../src/bundledKrl";
import { startTestEngine } from "./startTestEngine";
import { toDemoXmluiKrlURL } from "./toDemoXmluiKrlURL";

export async function installXmluiRuleset(
  pe: Awaited<ReturnType<typeof startTestEngine>>["pe"],
  root: Pico
) {
  const xmluiUrl = engineKrlFileUrl("io.picolabs.xmlui.krl", pe.base_url);
  const xmluiRs = await pe.rsRegistry.load(xmluiUrl);
  await root.install(xmluiRs.ruleset, { url: xmluiUrl });
}

export async function installDemoRulesets(
  pe: Awaited<ReturnType<typeof startTestEngine>>["pe"],
  root: Pico,
  files: string[]
) {
  for (const demo of files) {
    const url = toDemoXmluiKrlURL(demo);
    const rs = await pe.rsRegistry.load(url);
    await root.install(rs.ruleset, { url });
  }
}

/** Open channel with xmlui + standard demos installed. */
export async function startXmluiViewEngine(demoFiles = [
  "com.example.hello.krl",
  "com.example.fav_color.krl",
]) {
  const ctx = await startTestEngine();
  const root = ctx.pe.pf.rootPicos()[0];
  await installXmluiRuleset(ctx.pe, root);
  await installDemoRulesets(ctx.pe, root, demoFiles);
  return { ...ctx, root };
}
