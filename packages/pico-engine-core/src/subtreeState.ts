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
import { remapChildUiEcisEnt, remapEcisDeep } from "./eciRemap";
import type { RulesetStateServices } from "./rulesetState";
import {
  compareRulesetsForImport,
  needsInlineKrlOnExport,
  normalizeRulesetUrl,
  portableRulesetUrl,
  resolveImportRulesetUrl,
} from "./rulesetPortable";
import { openPortableBlob, sealPortableBlob } from "./rulesetStateCrypto";

export type { RulesetStateServices };

const WRANGLER_RID = "io.picolabs.wrangler";
const ENGINE_UI_RID = "io.picolabs.pico-engine-ui";
const SUBSCRIPTION_RID = "io.picolabs.subscription";
const PDS_RID = "io.picolabs.pds";

/** Optional engine hooks for identity-bearing portable move (Phase D). */
export interface SubtreePortableHooks {
  exportNodeIdentity(picoId: string): Promise<unknown | null>;
  importNodeIdentity(
    oldPicoId: string,
    newPicoId: string,
    identity: unknown,
    eciMap: Record<string, string>,
    picoIdMap: Record<string, string>
  ): Promise<void>;
}

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
  /** Opaque identity snapshot (engine-defined; includes webvh + peer subs). */
  identity?: unknown;
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

export interface CreateImportChildOptions {
  /** Channel on the parent that accepts wrangler events (e.g. the import request ECI). */
  channelEci?: string;
}

export interface SubtreeImportOptions {
  /** Channel on the adoptive parent that received the import request. */
  parentChannelEci?: string;
  /** Human label when export blob has no wrangler/io.picolabs.pico-engine-ui name yet. */
  bootstrapDisplayName?: string;
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
  picoRef: string,
  recurse: boolean
): Promise<SubtreeNodeExport> {
  const pico = pf.getPico(picoRef);
  const picoId = pico.id;
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

  const identity = services.portableHooks
    ? await services.portableHooks.exportNodeIdentity(picoId)
    : null;

  return {
    oldPicoId: picoId,
    rulesets,
    ent: await listAllEntVars(services.db, picoId),
    channels,
    children,
    ...(identity ? { identity } : {}),
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
  const url = resolveImportRulesetUrl(
    rs.url,
    services.resolveBundledRulesetUrl
  );
  await services.rsRegistry.flush(url);
  return services.rsRegistry.load(url);
}

function importChildName(node: SubtreeNodeExport): string {
  const wranglerEnt = node.ent?.[WRANGLER_RID];
  const name = wranglerEnt?.name;
  if (typeof name === "string" && name.trim().length > 0) {
    return name.trim();
  }
  return "imported";
}

/** Accept raw envelope JSON, exportPortableThing wrapper, or JSON-quoted paste. */
export function normalizePortableExportBlobArg(blob: string): string {
  if (typeof blob !== "string") {
    throw new TypeError("blob must be a string");
  }
  let trimmed = unwrapPortableExportBlobPaste(blob.trim());
  if (trimmed.length === 0) {
    throw new Error("Portable export blob is empty");
  }
  if (!trimmed.startsWith("{")) {
    throw new Error(
      "Invalid portable export blob: expected encrypted JSON envelope (starts with '{') — paste the blob value only, not extra surrounding quotes"
    );
  }
  return trimmed;
}

function unwrapPortableExportBlobPaste(value: string): string {
  let trimmed = value.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }
  if (trimmed.startsWith('"')) {
    try {
      const unwrapped = JSON.parse(trimmed) as unknown;
      if (typeof unwrapped !== "string") {
        throw new Error("not a string");
      }
      return unwrapPortableExportBlobPaste(unwrapped);
    } catch {
      throw new Error(
        "Invalid portable export blob: pasted value is a JSON-quoted string — use the raw blob from export (starts with {\"v\":1,...}) without wrapping it in extra quotes"
      );
    }
  }
  if (trimmed.startsWith("{") && trimmed.includes('"blob"')) {
    try {
      const wrapper = JSON.parse(trimmed) as { blob?: unknown };
      if (typeof wrapper.blob === "string" && wrapper.blob.trim().length > 0) {
        return unwrapPortableExportBlobPaste(wrapper.blob);
      }
    } catch {
      throw new Error(
        "Invalid portable export: pasted value looks like exportPortableThing JSON but is not valid JSON — use only the blob field value"
      );
    }
  }
  return trimmed;
}

/** Read-only summary of export payload (debug import/export issues). */
export function summarizeSubtreeExportBlob(
  blob: string,
  secret: string
): {
  rootPicoId: string;
  rulesetCount: number;
  channelCount: number;
  wranglerName: string | null;
  uiName: string | null;
  establishedCount: number;
  entRulesets: string[];
  hasIdentity: boolean;
  peerSubscriptionCount: number;
  childCount: number;
  childNames: string[];
} {
  const envelope = normalizePortableExportBlobArg(blob);
  let raw: SubtreeExportPayload;
  try {
    raw = openPortableBlob(envelope, secret) as SubtreeExportPayload;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("Invalid portable state blob")) {
      throw new Error(
        "Invalid portable state blob: value is not the encrypted export envelope (wrong copy/paste or truncated blob)"
      );
    }
    if (msg.includes("decryption failed")) {
      throw new Error(`${msg} — confirm the secret matches export (e.g. club-gear-demo-move vs test)`);
    }
    throw err;
  }
  if (!raw || raw.version !== 1 || !raw.root) {
    throw new Error("Invalid subtree export payload");
  }
  const root = raw.root;
  const subEnt = root.ent?.[SUBSCRIPTION_RID]?.established;
  const established = Array.isArray(subEnt) ? subEnt : [];
  return {
    rootPicoId: root.oldPicoId,
    rulesetCount: root.rulesets.length,
    channelCount: root.channels.length,
    wranglerName:
      typeof root.ent?.[WRANGLER_RID]?.name === "string"
        ? root.ent[WRANGLER_RID].name
        : null,
    uiName:
      typeof root.ent?.[ENGINE_UI_RID]?.name === "string"
        ? root.ent[ENGINE_UI_RID].name
        : null,
    establishedCount: established.length,
    entRulesets: Object.keys(root.ent || {}),
    hasIdentity: Boolean(root.identity),
    peerSubscriptionCount: peerSubscriptionCountFromIdentity(root.identity),
    childCount: root.children.length,
    childNames: root.children.map((c) => {
      const n = c.ent?.[WRANGLER_RID]?.name;
      return typeof n === "string" ? n : c.oldPicoId;
    }),
  };
}

function peerSubscriptionCountFromIdentity(identity: unknown): number {
  if (!identity || typeof identity !== "object") {
    return 0;
  }
  const ps = (identity as { peerSubscriptions?: unknown }).peerSubscriptions;
  return Array.isArray(ps) ? ps.length : 0;
}

function needsImportStabilize(node: SubtreeNodeExport): boolean {
  if (node.ent?.[SUBSCRIPTION_RID] || node.ent?.[PDS_RID]) {
    return true;
  }
  if (
    node.rulesets.some(
      (r) => r.rid === SUBSCRIPTION_RID || r.rid === PDS_RID
    )
  ) {
    return true;
  }
  const identity = node.identity;
  if (
    identity &&
    typeof identity === "object" &&
    Array.isArray(
      (identity as { peerSubscriptions?: unknown[] }).peerSubscriptions
    ) &&
    (identity as { peerSubscriptions: unknown[] }).peerSubscriptions.length > 0
  ) {
    return true;
  }
  return false;
}

/** Wrangler / UI display name from an encrypted subtree blob (for import bootstrap). */
export function subtreeRootBootstrapName(blob: string, secret: string): string {
  const raw = openPortableBlob(blob, secret) as SubtreeExportPayload;
  if (!raw || raw.version !== 1 || !raw.root) {
    throw new Error("Invalid subtree export payload");
  }
  return importChildName(raw.root);
}

function importedDisplayName(node: SubtreeNodeExport): string | undefined {
  const uiName = node.ent?.[ENGINE_UI_RID]?.name;
  if (typeof uiName === "string" && uiName.trim().length > 0) {
    return uiName.trim();
  }
  const wranglerName = importChildName(node);
  return wranglerName === "imported" ? undefined : wranglerName;
}

async function syncImportedDisplayName(
  child: Pico,
  node: SubtreeNodeExport,
  installedRids: Set<string>
): Promise<void> {
  const display = importedDisplayName(node);
  if (!display || !installedRids.has(ENGINE_UI_RID)) {
    return;
  }
  await child.putEnt(ENGINE_UI_RID, "name", display);
}

async function waitForRulesetsInstalled(
  pf: PicoFramework,
  parentPicoId: string,
  familyEci: string,
  child: Pico,
  rids: string[],
  timeoutMs = 20000
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const missing = rids.filter((rid) => !child.rulesets[rid]);
    if (missing.length === 0) {
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
  const stillMissing = rids.filter((rid) => !child.rulesets[rid]);
  throw new Error(
    `Timed out waiting for import child rulesets: ${stillMissing.join(", ")}`
  );
}

/** Let wrangler bootstrap events (install_ruleset_request) finish on the child queue. */
async function drainChildEventQueue(
  pf: PicoFramework,
  parentPicoId: string,
  familyEci: string,
  child: Pico,
  rounds = 40
): Promise<void> {
  for (let i = 0; i < rounds; i++) {
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
    if (!child.getCurrentTxn()) {
      await new Promise((resolve) => setTimeout(resolve, 10));
      if (!child.getCurrentTxn()) {
        return;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 15));
  }
}

async function installMissingRulesetsForEnt(
  services: RulesetStateServices,
  child: Pico,
  node: SubtreeNodeExport,
  installedRids: Set<string>
): Promise<void> {
  for (const rid of Object.keys(node.ent || {})) {
    if (installedRids.has(rid)) {
      continue;
    }
    const rsExport = node.rulesets.find((r) => r.rid === rid);
    if (!rsExport) {
      continue;
    }
    const loaded = await loadRulesetForImport(services, rsExport);
    await child.install(loaded.ruleset, {
      url: loaded.url,
      config: rsExport.config || {},
    });
    installedRids.add(rid);
  }
}

function remapEntVarForImport(
  rid: string,
  name: string,
  value: unknown,
  eciMap: Record<string, string>
): unknown {
  if (rid === ENGINE_UI_RID && name === "child_ui_ecis") {
    return remapChildUiEcisEnt(value, eciMap);
  }
  return remapEcisDeep(value, eciMap);
}

/** Match pico-engine-ui backfill: map family ECI → child uiECI for box().children. */
async function syncChildUiEcisFromWrangler(
  child: Pico,
  pf: PicoFramework
): Promise<void> {
  if (!child.rulesets[ENGINE_UI_RID]) {
    return;
  }
  const familyEcis = child.toReadOnly().children;
  const raw = await child.getEnt(ENGINE_UI_RID, "child_ui_ecis");
  const prior =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, string>)
      : {};
  const next: Record<string, string> = {};
  for (const [key, val] of Object.entries(prior)) {
    if (familyEcis.includes(key) && typeof val === "string") {
      next[key] = val;
    }
  }
  for (const familyEci of familyEcis) {
    if (next[familyEci]) {
      continue;
    }
    const uiEci = await pf.query(
      {
        eci: familyEci,
        rid: ENGINE_UI_RID,
        name: "uiECI",
        args: {},
      },
      child.id
    );
    if (typeof uiEci === "string" && uiEci.length > 0) {
      next[familyEci] = uiEci;
    }
  }
  await child.putEnt(ENGINE_UI_RID, "child_ui_ecis", next);
}

async function putEntFromExportNode(
  child: Pico,
  node: SubtreeNodeExport,
  eciMap: Record<string, string>,
  installedRids: Set<string>
): Promise<void> {
  for (const [rid, vars] of Object.entries(node.ent || {})) {
    if (!installedRids.has(rid)) {
      continue;
    }
    for (const [name, value] of Object.entries(vars)) {
      await child.putEnt(
        rid,
        name,
        remapEntVarForImport(rid, name, value, eciMap)
      );
    }
  }
}

/** Re-apply export ent after wrangler bootstrap queue finishes (avoids async clobber). */
async function stabilizeImportEntFromExport(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  child: Pico,
  familyEci: string,
  node: SubtreeNodeExport,
  eciMap: Record<string, string>,
  displayNameOverride?: string
): Promise<void> {
  await waitForRulesetsInstalled(
    pf,
    parent.id,
    familyEci,
    child,
    [SUBSCRIPTION_RID, PDS_RID]
  );
  await drainChildEventQueue(pf, parent.id, familyEci, child, 120);

  const installedRids = new Set(
    child.toReadOnly().rulesets.map((rs) => rs.rid)
  );
  await installMissingRulesetsForEnt(services, child, node, installedRids);
  await putEntFromExportNode(child, node, eciMap, installedRids);

  const display =
    (displayNameOverride && displayNameOverride.trim()) ||
    importedDisplayName(node);
  if (display) {
    if (installedRids.has(WRANGLER_RID)) {
      await child.putEnt(WRANGLER_RID, "name", display);
    }
    if (installedRids.has(ENGINE_UI_RID)) {
      await child.putEnt(ENGINE_UI_RID, "name", display);
    }
  } else {
    await syncImportedDisplayName(child, node, installedRids);
  }
}

async function rulesetsToInstall(
  services: RulesetStateServices,
  node: SubtreeNodeExport
): Promise<NewPicoRuleset[]> {
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
  toInstall.sort((a, b) =>
    compareRulesetsForImport(a.rs.rid, b.rs.rid)
  );
  return toInstall;
}

/** Install rulesets, channels, entity state, and nested children on an existing pico. */
async function hydrateImportedNode(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  child: Pico,
  familyEci: string,
  node: SubtreeNodeExport,
  eciMap: Record<string, string>,
  picoIdMap: Record<string, string>,
  displayNameOverride?: string
): Promise<void> {
  const stabilize = needsImportStabilize(node);
  if (stabilize) {
    await waitForRulesetsInstalled(
      pf,
      parent.id,
      familyEci,
      child,
      [SUBSCRIPTION_RID, PDS_RID]
    );
    await drainChildEventQueue(pf, parent.id, familyEci, child, 80);
  }

  const toInstall = await rulesetsToInstall(services, node);

  const installedRids = new Set(
    child.toReadOnly().rulesets.map((rs) => rs.rid)
  );
  for (const rs of toInstall) {
    if (installedRids.has(rs.rs.rid)) {
      continue;
    }
    const rsConfig = rs.config || { url: "", config: {} };
    await child.install(rs.rs, rsConfig);
    installedRids.add(rs.rs.rid);
  }

  picoIdMap[node.oldPicoId] = child.id;
  eciMap[node.oldPicoId] = child.id;
  eciMap[`${node.oldPicoId}:family`] = familyEci;

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

  await putEntFromExportNode(child, node, eciMap, installedRids);

  if (node.identity && services.portableHooks) {
    await services.portableHooks.importNodeIdentity(
      node.oldPicoId,
      child.id,
      node.identity,
      eciMap,
      picoIdMap
    );
  }

  if (stabilize) {
    await stabilizeImportEntFromExport(
      services,
      pf,
      parent,
      child,
      familyEci,
      node,
      eciMap,
      displayNameOverride
    );
  } else if (displayNameOverride?.trim()) {
    const installed = new Set(
      child.toReadOnly().rulesets.map((rs) => rs.rid)
    );
    const display = displayNameOverride.trim();
    if (installed.has(WRANGLER_RID)) {
      await child.putEnt(WRANGLER_RID, "name", display);
    }
    if (installed.has(ENGINE_UI_RID)) {
      await child.putEnt(ENGINE_UI_RID, "name", display);
    }
  } else {
    await syncImportedDisplayName(
      child,
      node,
      new Set(child.toReadOnly().rulesets.map((rs) => rs.rid))
    );
  }

  await syncChildUiEcisFromWrangler(child, pf);
}

async function importPicoNode(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  node: SubtreeNodeExport,
  eciMap: Record<string, string>,
  picoIdMap: Record<string, string>,
  importCtx?: CreateImportChildOptions
): Promise<{ child: Pico; familyEci: string }> {
  if (!services.createImportChild) {
    throw new Error(
      "Subtree import requires createImportChild (host must wire subtreeImportServices on the engine)"
    );
  }

  const { familyEci, child } = await services.createImportChild(
    pf,
    parent,
    importChildName(node),
    importCtx
  );

  await hydrateImportedNode(
    services,
    pf,
    parent,
    child,
    familyEci,
    node,
    eciMap,
    picoIdMap
  );

  return { child, familyEci };
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
  const { child: root, familyEci: rootFamilyEci } = await importPicoNode(
    services,
    pf,
    parent,
    raw.root,
    eciMap,
    picoIdMap,
    options?.parentChannelEci
      ? { channelEci: options.parentChannelEci }
      : undefined
  );

  const result: SubtreeImportResult = {
    oldRootPicoId: raw.root.oldPicoId,
    newRootPicoId: root.id,
    newRootEci: rootFamilyEci,
    eciMap,
    picoIdMap,
  };

  if (options?.afterImport) {
    await options.afterImport(result, raw);
  }

  return result;
}

/** Hydrate a wrangler-bootstrapped child (root of import) without creating it. */
export async function importIntoExistingChild(
  services: RulesetStateServices,
  pf: PicoFramework,
  parent: Pico,
  rootFamilyEci: string,
  blob: string,
  secret: string,
  options?: SubtreeImportOptions
): Promise<SubtreeImportResult> {
  const raw = openPortableBlob(blob, secret) as SubtreeExportPayload;
  if (!raw || raw.version !== 1 || !raw.root) {
    throw new Error("Invalid subtree export payload");
  }

  const child = pf.getPico(rootFamilyEci);
  if (!child) {
    throw new Error(`Import child not found for family ECI ${rootFamilyEci}`);
  }
  if (!parent.toReadOnly().children.includes(rootFamilyEci)) {
    throw new Error(
      `Family ECI ${rootFamilyEci} is not a direct child of the importing parent`
    );
  }

  const eciMap: Record<string, string> = {};
  const picoIdMap: Record<string, string> = {};
  await hydrateImportedNode(
    services,
    pf,
    parent,
    child,
    rootFamilyEci,
    raw.root,
    eciMap,
    picoIdMap,
    options?.bootstrapDisplayName
  );

  const result: SubtreeImportResult = {
    oldRootPicoId: raw.root.oldPicoId,
    newRootPicoId: child.id,
    newRootEci: rootFamilyEci,
    eciMap,
    picoIdMap,
  };

  if (options?.afterImport) {
    await options.afterImport(result, raw);
  }

  return result;
}
