/**
 * Subtree export/import (Phase B, pico-move #659).
 */

import {
  ChannelConfig,
  NewPicoRuleset,
  Pico,
  PicoDb,
  PicoDbKey,
  PicoFramework,
} from "pico-framework";
import { remapEcisDeep } from "./eciRemap";
import type { RulesetStateServices } from "./rulesetState";
import {
  needsInlineKrlOnExport,
  normalizeRulesetUrl,
  portableRulesetUrl,
} from "./rulesetPortable";
import { openPortableBlob, sealPortableBlob } from "./rulesetStateCrypto";

export type { RulesetStateServices };

export interface SubtreeRulesetExport {
  rid: string;
  url: string;
  config: Record<string, unknown>;
  /** Inline KRL when url is not retrievable on destination (Phase B1). */
  krl?: string;
}

export interface SubtreeChannelExport {
  oldEci: string;
  key: string;
  tags: string[];
  eventPolicy: ChannelConfig["eventPolicy"];
  queryPolicy: ChannelConfig["queryPolicy"];
}

export interface SubtreeNodeExport {
  oldPicoId: string;
  rulesets: SubtreeRulesetExport[];
  ent: Record<string, Record<string, unknown>>;
  channels: SubtreeChannelExport[];
  children: SubtreeNodeExport[];
}

export interface SubtreeExportPayload {
  version: 1;
  exportedAt: string;
  root: SubtreeNodeExport;
}

export interface SubtreeImportResult {
  oldRootPicoId: string;
  newRootPicoId: string;
  newRootEci: string;
  eciMap: Record<string, string>;
  picoIdMap: Record<string, string>;
}

export interface SubtreeImportOptions {
  afterImport?: (
    result: SubtreeImportResult,
    payload: SubtreeExportPayload
  ) => Promise<void>;
}

function channelKey(tags: string[]): string {
  return tags.slice().sort().join(",");
}

function isExportableChannel(
  picoId: string,
  ch: { id: string; tags: string[]; familyChannelPicoID: string | null }
): boolean {
  if (ch.id === picoId) {
    return false;
  }
  if (ch.familyChannelPicoID) {
    return false;
  }
  const tags = ch.tags.slice().sort().join(",");
  if (tags === "system,self") {
    return false;
  }
  return true;
}

async function listAllEntVars(
  db: PicoDb,
  picoId: string
): Promise<Record<string, Record<string, unknown>>> {
  const ent: Record<string, Record<string, unknown>> = {};
  const prefix: PicoDbKey = ["entvar", picoId];
  const iter = db.iterator({
    gte: prefix,
    lte: prefix.concat([undefined] as unknown as PicoDbKey),
  });
  for await (const [key, value] of iter) {
    const rid = String(key[2]);
    const name = String(key[3]);
    if (!ent[rid]) {
      ent[rid] = {};
    }
    ent[rid][name] = value;
  }
  return ent;
}

async function resolveRulesetKrl(
  services: RulesetStateServices,
  url: string
): Promise<string> {
  const normalized = normalizeRulesetUrl(url);
  let cached = services.rsRegistry.getCached(normalized);
  if (!cached) {
    cached = await services.rsRegistry.load(normalized);
  }
  if (!cached.krl) {
    throw new Error(`No KRL cached for ruleset url: ${url}`);
  }
  return cached.krl;
}

async function exportRulesetEntry(
  services: RulesetStateServices,
  rs: { rid: string; url: string; config: Record<string, unknown> }
): Promise<SubtreeRulesetExport> {
  const entry: SubtreeRulesetExport = {
    rid: rs.rid,
    url: rs.url,
    config: rs.config,
  };
  if (needsInlineKrlOnExport(rs.url)) {
    entry.krl = await resolveRulesetKrl(services, rs.url);
  }
  return entry;
}

async function exportPicoNode(
  services: RulesetStateServices,
  pf: PicoFramework,
  picoId: string,
  recurse: boolean
): Promise<SubtreeNodeExport> {
  const pico = pf.getPico(picoId);
  if (!pico) {
    throw new Error(`Pico not found: ${picoId}`);
  }
  const readOnly = pico.toReadOnly();

  const rulesets: SubtreeRulesetExport[] = [];
  for (const rs of readOnly.rulesets) {
    const innerConfig =
      rs.config.config && typeof rs.config.config === "object"
        ? (rs.config.config as Record<string, unknown>)
        : {};
    rulesets.push(
      await exportRulesetEntry(services, {
        rid: rs.rid,
        url: rs.config.url,
        config: innerConfig,
      })
    );
  }

  const channels: SubtreeChannelExport[] = readOnly.channels
    .filter((ch) => isExportableChannel(picoId, ch))
    .map((ch) => ({
      oldEci: ch.id,
      key: channelKey(ch.tags),
      tags: ch.tags.slice(),
      eventPolicy: ch.eventPolicy,
      queryPolicy: ch.queryPolicy,
    }));

  const children: SubtreeNodeExport[] = [];
  if (recurse) {
    for (const childEci of readOnly.children) {
      const { pico: childPico } = pf.lookupChannel(childEci);
      children.push(await exportPicoNode(services, pf, childPico.id, true));
    }
  }

  return {
    oldPicoId: picoId,
    rulesets,
    ent: await listAllEntVars(services.db, picoId),
    channels,
    children,
  };
}

/** Export pico subtree (recursive by default). */
export async function exportSubtree(
  services: RulesetStateServices,
  pf: PicoFramework,
  picoId: string,
  secret: string,
  options?: { recurse?: boolean }
): Promise<string> {
  const recurse = options?.recurse !== false;
  const payload: SubtreeExportPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    root: await exportPicoNode(services, pf, picoId, recurse),
  };
  return sealPortableBlob(payload, secret);
}

async function loadRulesetForImport(
  services: RulesetStateServices,
  rs: SubtreeRulesetExport
) {
  if (rs.krl) {
    const url = portableRulesetUrl(rs.krl);
    const loaded = services.rsRegistry.getCached(url);
    if (loaded) {
      return loaded;
    }
    return services.rsRegistry.registerInline(url, rs.krl);
  }
  const url = normalizeRulesetUrl(rs.url);
  await services.rsRegistry.flush(url);
  return services.rsRegistry.load(url);
}

async function importPicoNode(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  node: SubtreeNodeExport,
  eciMap: Record<string, string>,
  picoIdMap: Record<string, string>
): Promise<Pico> {
  const toInstall: NewPicoRuleset[] = [];
  for (const rs of node.rulesets) {
    const loaded = await loadRulesetForImport(services, rs);
    if (loaded.rid !== rs.rid) {
      throw new Error(
        `Ruleset at ${loaded.url} has rid ${loaded.rid}, export expects ${rs.rid}`
      );
    }
    toInstall.push({
      rs: loaded.ruleset,
      config: {
        url: loaded.url,
        config: rs.config || {},
      },
    });
  }

  const childEci = await parent.newPico({ rulesets: toInstall });
  const child = pf.lookupChannel(childEci).pico;
  picoIdMap[node.oldPicoId] = child.id;
  eciMap[node.oldPicoId] = child.id;

  for (const ch of node.channels) {
    const conf: ChannelConfig = {
      tags: ch.tags,
      eventPolicy: ch.eventPolicy,
      queryPolicy: ch.queryPolicy,
    };
    const created = await child.newChannel(conf);
    eciMap[ch.oldEci] = created.id;
  }

  for (const sub of node.children) {
    await importPicoNode(services, pf, child, sub, eciMap, picoIdMap);
  }

  for (const [rid, vars] of Object.entries(node.ent || {})) {
    for (const [name, value] of Object.entries(vars)) {
      await child.putEnt(rid, name, remapEcisDeep(value, eciMap));
    }
  }

  return child;
}

/** Import subtree under parent pico (creates new child subtree). */
export async function importSubtree(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  blob: string,
  secret: string,
  options?: SubtreeImportOptions
): Promise<SubtreeImportResult> {
  const raw = openPortableBlob(blob, secret) as SubtreeExportPayload;
  if (!raw || raw.version !== 1 || !raw.root) {
    throw new Error("Invalid subtree export payload");
  }

  const eciMap: Record<string, string> = {};
  const picoIdMap: Record<string, string> = {};
  const root = await importPicoNode(
    services,
    pf,
    parent,
    raw.root,
    eciMap,
    picoIdMap
  );

  const result: SubtreeImportResult = {
    oldRootPicoId: raw.root.oldPicoId,
    newRootPicoId: root.id,
    newRootEci: root.id,
    eciMap,
    picoIdMap,
  };

  if (options?.afterImport) {
    await options.afterImport(result, raw);
  }

  return result;
}
