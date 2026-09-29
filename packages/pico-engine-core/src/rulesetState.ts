/**
 * Ruleset + entity var export/import (Phase A, pico-move #664).
 */

import * as normalizeUrl from "normalize-url";
import {
  Pico,
  PicoDb,
  PicoDbKey,
  PicoReadOnly,
  Ruleset,
  RulesetConfig,
} from "pico-framework";
import { RulesetRegistry } from "./RulesetRegistry";
import {
  openRulesetState,
  RulesetStatePayload,
  sealRulesetState,
} from "./rulesetStateCrypto";

export interface RulesetStateServices {
  db: PicoDb;
  rsRegistry: RulesetRegistry;
}

async function listEntVars(
  db: PicoDb,
  picoId: string,
  rid: string
): Promise<Record<string, unknown>> {
  const ent: Record<string, unknown> = {};
  const prefix: PicoDbKey = ["entvar", picoId, rid];
  const iter = db.iterator({
    gte: prefix,
    lte: prefix.concat([undefined] as unknown as PicoDbKey),
  });
  for await (const [key, value] of iter) {
    ent[String(key[3])] = value;
  }
  return ent;
}

function findInstalledRuleset(pico: PicoReadOnly, rid: string) {
  const entry = pico.rulesets.find((rs) => rs.rid === rid);
  if (!entry) {
    throw new Error(`Ruleset not installed: ${rid}`);
  }
  return entry;
}

export async function exportRulesetState(
  services: RulesetStateServices,
  pico: PicoReadOnly,
  picoId: string,
  rid: string,
  secret: string
): Promise<string> {
  const installed = findInstalledRuleset(pico, rid);
  const url = installed.config.url;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error(`Ruleset ${rid} has no url in config`);
  }
  const ent = await listEntVars(services.db, picoId, rid);
  const innerConfig =
    installed.config.config && typeof installed.config.config === "object"
      ? (installed.config.config as Record<string, unknown>)
      : {};
  const payload: RulesetStatePayload = {
    version: 1,
    rid,
    url,
    config: innerConfig,
    ent,
    exportedAt: new Date().toISOString(),
  };
  return sealRulesetState(payload, secret);
}

export async function importRulesetState(
  services: RulesetStateServices,
  pico: Pico,
  blob: string,
  secret: string,
  install: (rs: Ruleset, config: RulesetConfig) => Promise<void>
): Promise<string> {
  const payload = openRulesetState(blob, secret);
  const url = normalizeUrl(payload.url);
  const rid = payload.rid;
  const config: RulesetConfig = {
    url,
    config: payload.config || {},
  };

  await services.rsRegistry.flush(url);
  const loaded = await services.rsRegistry.load(url);
  if (loaded.rid !== rid) {
    throw new Error(
      `Ruleset at ${url} has rid ${loaded.rid}, blob expects ${rid}`
    );
  }

  await install(loaded.ruleset, config);

  for (const [name, value] of Object.entries(payload.ent || {})) {
    await pico.putEnt(rid, name, value);
  }

  return rid;
}
