import * as normalizeUrl from "normalize-url";
import { allowsEventPolicy, Pico, RulesetContext } from "pico-framework";
import { PicoEngineCore } from "./PicoEngineCore";
import { buildPicoSchema, PicoSchema } from "./picoSchema";

export type RulesetSetChangedAction = "install" | "uninstall" | "flush";

export interface RulesetSetChangedHash {
  old: string | null;
  new: string | null;
}

export interface RulesetSetChangedAttrs {
  action: RulesetSetChangedAction;
  rid: string;
  url: string;
  hash: RulesetSetChangedHash;
}

const ENGINE_RULESET_SET_CHANGED = {
  domain: "engine",
  name: "ruleset_set_changed",
};

export function picoSchemaChanged(before: PicoSchema, after: PicoSchema): boolean {
  return JSON.stringify(before) !== JSON.stringify(after);
}

function channelAllowsEngineRulesetSetChanged(pico: Pico, eci: string): boolean {
  const channel = pico.channels[eci];
  if (!channel) return false;
  return allowsEventPolicy(channel.eventPolicy || { allow: [], deny: [] }, {
    domain: ENGINE_RULESET_SET_CHANGED.domain,
    name: ENGINE_RULESET_SET_CHANGED.name,
  });
}

/** Prefer UI channel; otherwise any channel whose policy allows the engine event. */
export function pickEciForEngineRulesetSetChanged(pico: Pico): string | null {
  for (const eci of Object.keys(pico.channels)) {
    const ch = pico.channels[eci];
    const tags = (ch.tags || []).map((t) => String(t).toLowerCase());
    if (tags.includes("engine_ui")) {
      if (channelAllowsEngineRulesetSetChanged(pico, eci)) return eci;
    }
  }
  for (const eci of Object.keys(pico.channels)) {
    if (channelAllowsEngineRulesetSetChanged(pico, eci)) return eci;
  }
  return null;
}

export function picoUsesRulesetUrl(pico: Pico, url: string): string | null {
  const normalized = normalizeUrl(url);
  for (const rid of Object.keys(pico.rulesets)) {
    const rsUrl = pico.rulesets[rid]?.config?.["url"];
    if (typeof rsUrl === "string" && normalizeUrl(rsUrl) === normalized) {
      return rid;
    }
  }
  return null;
}

export function normalizedRulesetUrl(url: string): string {
  return normalizeUrl(url);
}

/** During flush/registerInline, before the ruleset cache is updated. */
export function snapshotPicoSchemasForUrl(
  core: PicoEngineCore,
  url: string
): Map<string, PicoSchema> {
  const out = new Map<string, PicoSchema>();
  for (const pico of core.picoFramework.loadedPicos()) {
    if (picoUsesRulesetUrl(pico, url)) {
      out.set(pico.id, buildPicoSchema(pico, core.rsRegistry));
    }
  }
  return out;
}

export async function raiseRulesetSetChangedOnPico(
  core: PicoEngineCore,
  pico: Pico,
  attrs: RulesetSetChangedAttrs
): Promise<void> {
  const eci = pickEciForEngineRulesetSetChanged(pico);
  if (!eci) {
    core.log.warn("ruleset_set_changed: no channel on pico", {
      picoId: pico.id,
      rid: attrs.rid,
      action: attrs.action,
    });
    return;
  }
  try {
    await core.picoFramework.event({
      eci,
      domain: ENGINE_RULESET_SET_CHANGED.domain,
      name: ENGINE_RULESET_SET_CHANGED.name,
      data: { attrs },
      time: Date.now(),
    });
  } catch (err) {
    core.log.error("ruleset_set_changed delivery failed", {
      picoId: pico.id,
      rid: attrs.rid,
      action: attrs.action,
      error: String(err),
    });
  }
}

/** Raise on one pico from an active ruleset context (install / uninstall). */
export async function raiseRulesetSetChangedFromRsCtx(
  core: PicoEngineCore,
  rsCtx: RulesetContext,
  attrs: RulesetSetChangedAttrs
): Promise<void> {
  try {
    await rsCtx.raiseEvent(
      ENGINE_RULESET_SET_CHANGED.domain,
      ENGINE_RULESET_SET_CHANGED.name,
      attrs,
      undefined
    );
  } catch (err) {
    core.log.error("ruleset_set_changed raiseEvent failed", {
      picoId: rsCtx.pico().id,
      rid: attrs.rid,
      action: attrs.action,
      error: String(err),
    });
  }
}

/** After flush: every pico that had this URL installed and whose pico schema changed. */
export async function notifyRulesetSetChangedAfterFlush(
  core: PicoEngineCore,
  crs: { url: string; rid: string; hash: string },
  oldHash: string | null,
  schemaBeforeByPico: Map<string, PicoSchema>,
  skipPicoId?: string | null
): Promise<void> {
  const url = normalizedRulesetUrl(crs.url);
  const attrsBase = {
    action: "flush" as const,
    rid: crs.rid,
    url,
    hash: { old: oldHash, new: crs.hash },
  };
  for (const pico of core.picoFramework.loadedPicos()) {
    if (skipPicoId && pico.id === skipPicoId) continue;
    if (!picoUsesRulesetUrl(pico, url)) continue;
    const before = schemaBeforeByPico.get(pico.id);
    const after = buildPicoSchema(pico, core.rsRegistry);
    if (before && !picoSchemaChanged(before, after)) continue;
    await raiseRulesetSetChangedOnPico(core, pico, attrsBase);
  }
}
