import * as path from "path";
import { PicoEngineCore } from "pico-engine-core";
import { Pico, PicoFramework } from "pico-framework";
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

const UI_CHANNEL_TAGS = ["engine", "ui"];

function uiChannelKey(tags: string[]): string {
  return tags.slice(0).sort().join(",");
}

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
  const chann = pico
    .toReadOnly()
    .channels.find((c) => uiChannelKey(UI_CHANNEL_TAGS) === uiChannelKey(c.tags));
  return chann ? chann.id : null;
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
    .channels.find((c) => uiChannelKey(UI_CHANNEL_TAGS) === uiChannelKey(c.tags));
  if (!uiChannel) {
    uiChannel = (
      await root.newChannel({
        tags: UI_CHANNEL_TAGS,
        eventPolicy: {
          allow: [{ domain: "engine_ui", name: "setup" }],
          deny: [],
        },
      })
    ).toReadOnly();
  }

  await pf.eventWait({
    eci: uiChannel.id,
    domain: "engine_ui",
    name: "setup",
    data: { attrs: {} },
    time: 0,
  });

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
