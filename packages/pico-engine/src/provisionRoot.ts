import * as path from "path";
import { PicoEngineCore } from "pico-engine-core";
import { ChannelConfig, Pico, PicoFramework } from "pico-framework";
import {
  UI_CHANNEL_EVENT_POLICY,
  UI_CHANNEL_QUERY_POLICY,
  UI_CHANNEL_TAGS,
} from "./uiChannelPolicies";
import { toFileUrl } from "./utils/toFileUrl";

/**
 * Base rulesets installed onto every root pico. These make up the engine's
 * "OS" layer (wrangler + friends) plus the built-in UI ruleset.
 */
const BASE_KRL_FILES = [
  "io.picolabs.pico-engine-ui.krl",
  "io.picolabs.wrangler.krl",
  "io.picolabs.subscription.krl",
  "io.picolabs.did-o.krl",
  "io.picolabs.pds.krl",
];

function uiChannelKey(tags: string[]): string {
  return tags.slice(0).sort().join(",");
}

const UI_CHANNEL_CONFIG: ChannelConfig = {
  tags: [...UI_CHANNEL_TAGS],
  eventPolicy: UI_CHANNEL_EVENT_POLICY,
  queryPolicy: UI_CHANNEL_QUERY_POLICY,
};

/**
 * Find the ["engine","ui"] channel on a pico, if it exists.
 */
export function uiECIForRoot(
  pf: PicoFramework,
  rootPicoId: string
): string | null {
  const pico = pf.rootPicos().find((p) => p.id === rootPicoId);
  if (!pico) {
    return null;
  }
  return uiECIForPico(pico);
}

export function uiECIForPico(pico: Pico): string | null {
  const chann = pico
    .toReadOnly()
    .channels.find((c) => uiChannelKey([...UI_CHANNEL_TAGS]) === uiChannelKey(c.tags));
  return chann ? chann.id : null;
}

async function forEachLoadedPico(
  pf: PicoFramework,
  fn: (pico: Pico) => Promise<void>
): Promise<void> {
  for (const pico of pf.loadedPicos()) {
    await fn(pico);
  }
}

/**
 * Install the current io.picolabs.pico-engine-ui ruleset on every pico and
 * refresh its ["engine","ui"] channel policy directly (no event policy gate).
 */
export async function refreshAllUiChannelPolicies(
  pf: PicoFramework,
  core: PicoEngineCore
): Promise<void> {
  const uiUrl = toFileUrl(
    path.resolve(__dirname, "..", "krl", "io.picolabs.pico-engine-ui.krl")
  );
  const { ruleset: uiRuleset } = await core.rsRegistry.flush(uiUrl);

  await forEachLoadedPico(pf, async (pico) => {
    await pico.install(uiRuleset, { url: uiUrl, config: {} });
    const uiEci = uiECIForPico(pico);
    if (uiEci) {
      await pico.putChannel(uiEci, UI_CHANNEL_CONFIG);
    }
  });
}

/**
 * Provision a root pico: install the base rulesets, ensure the ["engine","ui"]
 * channel exists, fire `engine_ui setup`, and return the root + its UI ECI.
 *
 * Pass an existing `root` to (re)provision it — this is how the engine migrates
 * a pre-existing single-root install. Omit it to mint a brand new root, which is
 * what the passkey new-account registration flow does.
 */
export async function provisionRoot(
  pf: PicoFramework,
  core: PicoEngineCore,
  opts: { root?: Pico; name?: string } = {}
): Promise<{ root: Pico; uiECI: string }> {
  const root = opts.root || (await pf.createRootPico());

  for (const file of BASE_KRL_FILES) {
    const url = toFileUrl(path.resolve(__dirname, "..", "krl", file));
    const { ruleset } = await core.rsRegistry.flush(url);
    await root.install(ruleset, { url, config: {} });
  }

  let uiChannel = root
    .toReadOnly()
    .channels.find((c) => uiChannelKey([...UI_CHANNEL_TAGS]) === uiChannelKey(c.tags));
  if (!uiChannel) {
    uiChannel = (
      await root.newChannel({
        tags: [...UI_CHANNEL_TAGS],
        eventPolicy: {
          allow: [{ domain: "engine_ui", name: "setup" }],
          deny: [],
        },
      })
    ).toReadOnly();
  }

  await refreshAllUiChannelPolicies(pf, core);

  const name = (opts.name || "").trim();
  if (name) {
    await pf.eventWait({
      eci: uiChannel.id,
      domain: "engine_ui",
      name: "box",
      data: { attrs: { name } },
      time: 0,
    });
  }

  return { root, uiECI: uiChannel.id };
}
