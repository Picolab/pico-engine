/**
 * Subtree import child creation via wrangler (engine layer — above ctx).
 */

import {
  allowsEventPolicy,
  ChannelReadOnly,
  Pico,
  PicoEvent,
  PicoFramework,
} from "pico-framework";
import type {
  CreateImportChildOptions,
  RulesetRegistry,
  RulesetStateServices,
} from "pico-engine-core";

const WRANGLER_RID = "io.picolabs.wrangler";
const ENGINE_UI_RID = "io.picolabs.pico-engine-ui";
const SUBSCRIPTION_RID = "io.picolabs.subscription";
const PDS_RID = "io.picolabs.pds";

function isUiChannel(c: ChannelReadOnly): boolean {
  return [...c.tags].sort().join(",") === "engine,ui";
}

function nonFamilyChannels(pico: Pico): ChannelReadOnly[] {
  return pico.toReadOnly().channels.filter((c) => !c.familyChannelPicoID);
}

function channelAllowsEvent(
  c: ChannelReadOnly,
  event: Pick<PicoEvent, "domain" | "name">
): boolean {
  return allowsEventPolicy(c.eventPolicy, event);
}

/** Pick a channel that may deliver a specific wrangler bootstrap event. */
function pickEventEci(
  pico: Pico,
  event: Pick<PicoEvent, "domain" | "name">
): string {
  const channels = nonFamilyChannels(pico);
  if (channels.length === 0) {
    throw new Error(
      `Pico ${pico.id} has no non-family channels for wrangler events`
    );
  }
  const permitted = channels.filter((c) => channelAllowsEvent(c, event));
  if (permitted.length > 0) {
    const ui = permitted.find((c) => isUiChannel(c));
    return (ui ?? permitted[0]).id;
  }
  throw new Error(
    `Pico ${pico.id} has no channel that allows ${event.domain}:${event.name}`
  );
}

/**
 * Prefer caller's channel when it allows the event; otherwise pick one that does.
 * HTTP/UI import passes the UI ECI — skip it when policy blocks wrangler bootstrap.
 */
function resolveWranglerChannelEci(
  pico: Pico,
  event: Pick<PicoEvent, "domain" | "name">,
  preferred?: string
): string {
  if (preferred) {
    const ch = nonFamilyChannels(pico).find((c) => c.id === preferred);
    if (ch && channelAllowsEvent(ch, event)) {
      return preferred;
    }
  }
  return pickEventEci(pico, event);
}

async function rulesetFromParent(
  parent: Pico,
  rid: string,
  rsRegistry: RulesetRegistry
) {
  const config = parent.rulesets[rid]?.config;
  if (!config?.url) {
    throw new Error(
      `Parent pico ${parent.id} does not have ${rid} installed (required for wrangler import bootstrap)`
    );
  }
  const loaded = await rsRegistry.load(config.url);
  return { rs: loaded.ruleset, config };
}

/** Same bootstrap as wrangler bootstrapNewChild, without blocking the parent's event queue. */
async function bootstrapImportChildSync(
  pf: PicoFramework,
  parent: Pico,
  name: string,
  rsRegistry: RulesetRegistry,
  options?: CreateImportChildOptions
): Promise<{ familyEci: string; child: Pico }> {
  const ui = await rulesetFromParent(parent, ENGINE_UI_RID, rsRegistry);
  const wrangler = await rulesetFromParent(parent, WRANGLER_RID, rsRegistry);
  const familyEci = await parent.newPico({
    rulesets: [ui, wrangler],
  });
  const child = pf.getPico(familyEci);
  if (!child) {
    throw new Error(`Failed to resolve child for family ECI ${familyEci}`);
  }

  const parentUi = parent.toReadOnly().channels.find(
    (c) => [...c.tags].sort().join(",") === "engine,ui"
  );

  await pf.eventWait(
    {
      eci: familyEci,
      domain: "wrangler",
      name: "pico_created",
      data: { attrs: { name: name || "imported" } },
      time: Date.now(),
    },
    parent.id
  );

  await waitForWranglerBootstrapRulesets(
    pf,
    parent.id,
    familyEci,
    child
  );

  const uiEci = await pf.eventQuery(
    {
      eci: familyEci,
      domain: "engine_ui",
      name: "setup",
      data: { attrs: {} },
      time: Date.now(),
    },
    {
      eci: familyEci,
      rid: ENGINE_UI_RID,
      name: "uiECI",
      args: {},
    },
    parent.id
  );

  await pf.event({
    eci: uiEci,
    domain: "engine_ui",
    name: "box",
    data: {
      attrs: {
        name: name || "imported",
        parentUiEci: parentUi?.id,
      },
    },
    time: Date.now(),
  });

  const newChildCreated = {
    domain: "wrangler" as const,
    name: "new_child_created" as const,
  };
  const parentEci = resolveWranglerChannelEci(
    parent,
    newChildCreated,
    options?.channelEci
  );
  await pf.event({
    eci: parentEci,
    domain: newChildCreated.domain,
    name: newChildCreated.name,
    data: {
      attrs: {
        name: name || "imported",
        eci: familyEci,
        uiEci,
      },
    },
    time: Date.now(),
  });

  return { familyEci, child };
}

function parentIsHandlingEvent(parent: Pico): boolean {
  return parent.getCurrentTxn()?.kind === "event";
}

/** Wait for pico_created's queued install_ruleset_request (pds + subscription). */
async function waitForWranglerBootstrapRulesets(
  pf: PicoFramework,
  parentPicoId: string,
  familyEci: string,
  child: Pico,
  timeoutMs = 20000
): Promise<void> {
  const need = [SUBSCRIPTION_RID, PDS_RID];
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (need.every((rid) => child.rulesets[rid])) {
      return;
    }
    await pf
      .query(
        {
          eci: familyEci,
          rid: WRANGLER_RID,
          name: "id",
          args: {},
        },
        parentPicoId
      )
      .catch(() => undefined);
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
  const missing = need.filter((rid) => !child.rulesets[rid]);
  throw new Error(
    `Import child wrangler bootstrap missing rulesets: ${missing.join(", ")}`
  );
}

/** Create an import child through wrangler (sync bootstrap when parent queue is busy). */
export async function createImportChildViaWrangler(
  pf: PicoFramework,
  parent: Pico,
  name: string,
  rsRegistry: RulesetRegistry,
  options?: CreateImportChildOptions
): Promise<{ familyEci: string; child: Pico }> {
  if (parentIsHandlingEvent(parent)) {
    return bootstrapImportChildSync(pf, parent, name, rsRegistry, options);
  }

  const newChildRequest = {
    domain: "wrangler" as const,
    name: "new_child_request" as const,
  };
  const parentEci = resolveWranglerChannelEci(
    parent,
    newChildRequest,
    options?.channelEci
  );
  const childCountBefore = parent.toReadOnly().children.length;

  await pf.eventWait({
    eci: parentEci,
    domain: newChildRequest.domain,
    name: newChildRequest.name,
    data: { attrs: { name: name || "imported" } },
    time: Date.now(),
  });

  const children = parent.toReadOnly().children;
  if (children.length <= childCountBefore) {
    throw new Error(
      "wrangler new_child_request did not create a child (is io.picolabs.wrangler installed on the parent?)"
    );
  }
  const familyEci = children[children.length - 1];
  const child = pf.getPico(familyEci);
  if (!child) {
    throw new Error(`Failed to resolve child for family ECI ${familyEci}`);
  }
  return { familyEci, child };
}

/** Wrangler-backed child creation wired into ctx subtree import. */
export function wranglerSubtreeImportServices(
  rsRegistry: RulesetRegistry
): Pick<RulesetStateServices, "createImportChild"> {
  return {
    createImportChild: (pf, parent, name, opts) =>
      createImportChildViaWrangler(pf, parent, name, rsRegistry, opts),
  };
}
