import fetch from "cross-fetch";
import { krl } from "krl-stdlib";
import * as normalizeUrl from "normalize-url";
import {
  allowsEventPolicy,
  allowsQueryPolicy,
  ChannelConfig,
  cleanChannelTags,
  NewPicoRuleset,
  PolicyCeiling,
  RulesetConfig,
  RulesetContext,
} from "pico-framework";
import { PicoEngineCore } from "../PicoEngineCore";
import {
  exportRulesetState as exportRulesetStateImpl,
  importRulesetState as importRulesetStateImpl,
} from "../rulesetState";
import {
  exportSubtree as exportSubtreeImpl,
  importIntoExistingChild as importIntoExistingChildImpl,
  importSubtree as importSubtreeImpl,
  summarizeSubtreeExportBlob as summarizeSubtreeExportBlobImpl,
} from "../subtreeState";
import type { RulesetStateServices } from "../rulesetState";
import type { SubtreeImportResult } from "../subtreeState";
import {
  buildPicoSchema,
  channelSchemaForEci,
  rulesetSchemaForInstalled,
  schemaBindingsFromRuleset,
} from "../picoSchema";
import {
  normalizedRulesetUrl,
  picoSchemaChanged,
  raiseRulesetSetChangedFromRsCtx,
} from "../schemaNotify";
import { evalInRuleset as runConsoleEvalInRuleset } from "../evalInRuleset";
import { validateKrl } from "../validateKrl";

async function afterSubtreeImport(
  core: PicoEngineCore,
  result: SubtreeImportResult
): Promise<void> {
  await core.reloadImportedSchedules(Object.values(result.picoIdMap));
  const importedRoot = core.picoFramework.getPico(result.newRootPicoId);
  if (importedRoot) {
    await importedRoot.event({
      eci: result.newRootEci,
      domain: "wrangler",
      name: "pico_imported",
      data: {
        attrs: {
          oldRootPicoId: result.oldRootPicoId,
          newRootPicoId: result.newRootPicoId,
          eciMap: result.eciMap,
          picoIdMap: result.picoIdMap,
        },
      },
      time: Date.now(),
    });
  }
}

function subtreeStateServices(core: PicoEngineCore): RulesetStateServices {
  return {
    db: core.picoFramework.db,
    rsRegistry: core.rsRegistry,
    portableHooks: core.subtreePortableHooks,
    resolveBundledRulesetUrl: core.resolveBundledRulesetUrl,
    ...core.subtreeImportServices,
  };
}

export interface RulesetCtxInfo {
  rid: string;
  config: RulesetConfig | null;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

export interface RulesetCtxInfoMeta {
  krl: string;
  krlMeta?: {
    version?: string;
    name?: string;
    description?: string;
    author?: string;
  };
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}

export default function initCtxModule(core: PicoEngineCore) {
  function rulesetKrlMetaProperty(key: string) {
    return krl.Property(function () {
      const url = this.rsCtx.ruleset.config["url"];
      const cached = core.rsRegistry.getCached(url);
      const krlMeta = (cached?.ruleset as any).meta || {};
      return krlMeta[key] || null;
    });
  }

  const module: krl.Module = {
    picoId: krl.Property(function rid(){
      return this.rsCtx.pico().id;
    }),

    rid: krl.Property(function rid() {
      return this.rsCtx.ruleset.rid;
    }),

    rid_url: krl.Property(function rid_url() {
      return this.rsCtx.ruleset.config["url"];
    }),

    rid_config: krl.Property(function rid_config() {
      return this.rsCtx.ruleset.config["config"];
    }),

    rid_version: rulesetKrlMetaProperty("version"),
    rid_name: rulesetKrlMetaProperty("name"),
    rid_description: rulesetKrlMetaProperty("description"),
    rid_author: rulesetKrlMetaProperty("author"),

    parent: krl.Property(function parent() {
      return this.rsCtx.pico().parent;
    }),

    children: krl.Property(function children() {
      return this.rsCtx.pico().children;
    }),

    newPico: krl.Action(
      ["rulesets", "policyCeiling"],
      async function newPico(rulesets, policyCeiling): Promise<string> {
      if (!Array.isArray(rulesets)) {
        throw new TypeError("ctx:newPico expects an array of {url, config}");
      }
      const toInstall: NewPicoRuleset[] = [];
      for (const rs of rulesets) {
        const result = await core.rsRegistry.load(rs.url);
        toInstall.push({
          rs: result.ruleset,
          config: {
            url: rs.url,
            config: rs.config || {},
          },
        });
      }
      const newPicoConf: { rulesets: NewPicoRuleset[]; policyCeiling?: PolicyCeiling } =
        { rulesets: toInstall };
      if (
        policyCeiling &&
        typeof policyCeiling === "object" &&
        !Array.isArray(policyCeiling) &&
        (policyCeiling as PolicyCeiling).eventPolicy &&
        (policyCeiling as PolicyCeiling).queryPolicy
      ) {
        newPicoConf.policyCeiling = policyCeiling as PolicyCeiling;
      }
      const newEci = await this.rsCtx.newPico(newPicoConf);
      if (core.onPicoCreated) {
        const childPico = core.picoFramework.getPico(newEci);
        await core.onPicoCreated(childPico.id, {
          isRoot: false,
          parentPicoId: this.rsCtx.pico().id,
        });
      }
      return newEci;
    }),

    delPico: krl.Action(["eci"], async function delPico(eci) {
      await this.rsCtx.delPico(eci);
    }),

    channels: krl.Property(function channels() {
      return this.rsCtx.pico().channels;
    }),

    newChannel: krl.Action(
      ["tags", "eventPolicy", "queryPolicy", "id"],
      async function newChannel(tags, eventPolicy, queryPolicy, id) {
        const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
        if (typeof id === "string" && id.trim().length > 0) {
          conf.id = id;
        }
        const chann = await this.rsCtx.newChannel(conf);
        return chann;
      }
    ),

    putChannel: krl.Action(
      ["eci", "tags", "eventPolicy", "queryPolicy"],
      async function putChannel(eci, tags, eventPolicy, queryPolicy) {
        const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
        return await this.rsCtx.putChannel(eci, conf);
      }
    ),

    upsertChannel: krl.Action(
      ["tags", "eventPolicy", "queryPolicy"],
      async function upsertChannel(tags, eventPolicy, queryPolicy) {
        tags = cleanChannelTags(tags);
        tags.sort();
        const search = tags.join(",");
        const channel = this.rsCtx.pico().channels.find((c) => {
          return search === c.tags.slice(0).sort().join(",");
        });
        const conf: ChannelConfig = { tags, eventPolicy, queryPolicy };
        if (channel) {
          await this.rsCtx.putChannel(channel.id, conf);
        } else {
          await this.rsCtx.newChannel(conf);
        }
      }
    ),

    delChannel: krl.Action(["eci"], async function delChannel(eci) {
      await this.rsCtx.delChannel(eci);
    }),

    rulesets: krl.Property(function rulesets(): RulesetCtxInfo[] {
      const pico = this.rsCtx.pico();

      const results: RulesetCtxInfo[] = [];

      for (const rs of pico.rulesets) {
        const cached = core.rsRegistry.getCached(rs.config.url);
        results.push({
          rid: rs.rid,
          url: rs.config.url,
          config: rs.config.config,
          meta: cached
            ? {
                krl: cached.krl,
                krlMeta: (cached?.ruleset as any).meta,
                hash: cached.hash,
                flushed: cached.flushed,
                compiler: cached.compiler,
              }
            : null,
        });
      }

      return results;
    }),

    install: krl.Action(["url", "config"], async function install(
      url: string,
      config: RulesetConfig
    ) {
      if (typeof url !== "string") {
        throw new TypeError(
          "Expected string for url but got " + krl.typeOf(url)
        );
      }
      url = normalizeUrl(url);
      const pico = core.picoFramework.getPico(this.rsCtx.pico().id);
      if (!pico) {
        throw new Error("Pico not found: " + this.rsCtx.pico().id);
      }
      const schemaBefore = buildPicoSchema(pico, core.rsRegistry);
      const rs = await core.rsRegistry.load(url);
      await this.rsCtx.install(rs.ruleset, {
        url: url,
        config: config || {},
      });
      const schemaAfter = buildPicoSchema(pico, core.rsRegistry);
      if (picoSchemaChanged(schemaBefore, schemaAfter)) {
        const cached = core.rsRegistry.getCached(url);
        await raiseRulesetSetChangedFromRsCtx(core, this.rsCtx, {
          action: "install",
          rid: rs.rid,
          url: normalizedRulesetUrl(url),
          hash: { old: null, new: cached?.hash ?? null },
        });
      }
      return rs.rid;
    }),

    uninstall: krl.Action(["rid"], async function uninstall(rid: string) {
      const pico = this.rsCtx.pico();

      if (typeof rid !== "string") {
        throw new TypeError(
          "Expected string for rid but got " + krl.typeOf(rid)
        );
      }

      const corePico = core.getPico(pico.id);
      if (!corePico) {
        throw new TypeError("Pico not found in core: " + pico.id);
      }

      const usedBy = corePico.whoUses(rid);
      if (usedBy.length > 0) {
        throw new Error(
          `Cannot uninstall ${rid} because ${usedBy.join(
            " and "
          )} depends on it`
        );
      }
      const installed = pico.rulesets.find((r) => r.rid === rid);
      const rsUrl = installed?.config?.["url"];
      const url =
        typeof rsUrl === "string" ? normalizedRulesetUrl(rsUrl) : "";
      const oldHash =
        typeof rsUrl === "string"
          ? core.rsRegistry.getCached(rsUrl)?.hash ?? null
          : null;
      const schemaBefore = buildPicoSchema(
        core.picoFramework.getPico(pico.id)!,
        core.rsRegistry
      );
      corePico.unUse(rid);
      await this.rsCtx.uninstall(rid);
      const schemaAfter = buildPicoSchema(
        core.picoFramework.getPico(pico.id)!,
        core.rsRegistry
      );
      if (picoSchemaChanged(schemaBefore, schemaAfter)) {
        await raiseRulesetSetChangedFromRsCtx(core, this.rsCtx, {
          action: "uninstall",
          rid,
          url,
          hash: { old: oldHash, new: null },
        });
      }
    }),

    flush: krl.Action(["url"], async function flush(url: string) {
      if (typeof url !== "string") {
        throw new TypeError(
          "Expected string for url but got " + krl.typeOf(url)
        );
      }
      url = normalizeUrl(url);
      const pfPico = core.picoFramework
        .loadedPicos()
        .find((p) => p.id === this.rsCtx.pico().id);
      if (!pfPico) {
        throw new Error("Pico not found: " + this.rsCtx.pico().id);
      }
      const schemaBefore = buildPicoSchema(pfPico, core.rsRegistry);
      const oldHash = core.rsRegistry.getCached(url)?.hash ?? null;
      core.ctxFlushPicoId = pfPico.id;
      const crs = await core.rsRegistry.flush(url);
      if (oldHash === crs.hash) {
        core.ctxFlushPicoId = null;
        return;
      }
      const schemaAfter = buildPicoSchema(pfPico, core.rsRegistry);
      if (picoSchemaChanged(schemaBefore, schemaAfter)) {
        await raiseRulesetSetChangedFromRsCtx(core, this.rsCtx, {
          action: "flush",
          rid: crs.rid,
          url: normalizedRulesetUrl(url),
          hash: { old: oldHash, new: crs.hash },
        });
      }
    }),

    exportRulesetState: krl.Function(
      ["rid", "secret"],
      async function exportRulesetState(rid: string, secret: string) {
        if (typeof rid !== "string") {
          throw new TypeError(
            "Expected string for rid but got " + krl.typeOf(rid)
          );
        }
        const picoReadOnly = this.rsCtx.pico();
        return exportRulesetStateImpl(
          { db: core.picoFramework.db, rsRegistry: core.rsRegistry },
          picoReadOnly,
          picoReadOnly.id,
          rid,
          secret
        );
      }
    ),

    importRulesetState: krl.Function(
      ["blob", "secret"],
      async function importRulesetState(blob: string, secret: string) {
        if (typeof blob !== "string") {
          throw new TypeError(
            "Expected string for blob but got " + krl.typeOf(blob)
          );
        }
        const picoId = this.rsCtx.pico().id;
        const pico = core.picoFramework.getPico(picoId);
        if (!pico) {
          throw new Error("Pico not found: " + picoId);
        }
        return importRulesetStateImpl(
          { db: core.picoFramework.db, rsRegistry: core.rsRegistry },
          pico,
          blob,
          secret,
          (rs, config) => this.rsCtx.install(rs, config)
        );
      }
    ),

    summarizeSubtreeExportBlob: krl.Function(
      ["blob", "secret"],
      function summarizeSubtreeExportBlob(blob: string, secret: string) {
        return summarizeSubtreeExportBlobImpl(blob, secret);
      }
    ),

    exportSubtree: krl.Function(
      ["picoId", "secret"],
      async function exportSubtree(picoId: string, secret: string) {
        if (typeof picoId !== "string") {
          throw new TypeError(
            "Expected string for picoId but got " + krl.typeOf(picoId)
          );
        }
        return exportSubtreeImpl(
          subtreeStateServices(core),
          core.picoFramework,
          picoId,
          secret
        );
      }
    ),

    importSubtree: krl.Function(
      ["blob", "secret"],
      async function importSubtree(blob: string, secret: string) {
        if (typeof blob !== "string") {
          throw new TypeError(
            "Expected string for blob but got " + krl.typeOf(blob)
          );
        }
        const picoId = this.rsCtx.pico().id;
        const pico = core.picoFramework.getPico(picoId);
        if (!pico) {
          throw new Error("Pico not found: " + picoId);
        }
        return importSubtreeImpl(
          subtreeStateServices(core),
          core.picoFramework,
          pico,
          blob,
          secret,
          { afterImport: (result) => afterSubtreeImport(core, result) }
        );
      }
    ),

    importIntoExistingChild: krl.Function(
      ["blob", "secret", "rootFamilyEci"],
      async function importIntoExistingChild(
        blob: string,
        secret: string,
        rootFamilyEci: string
      ) {
        if (typeof blob !== "string") {
          throw new TypeError(
            "Expected string for blob but got " + krl.typeOf(blob)
          );
        }
        if (typeof rootFamilyEci !== "string") {
          throw new TypeError(
            "Expected string for rootFamilyEci but got " +
              krl.typeOf(rootFamilyEci)
          );
        }
        const picoId = this.rsCtx.pico().id;
        const pico = core.picoFramework.getPico(picoId);
        if (!pico) {
          throw new Error("Pico not found: " + picoId);
        }
        return importIntoExistingChildImpl(
          subtreeStateServices(core),
          core.picoFramework,
          pico,
          rootFamilyEci,
          blob,
          secret,
          { afterImport: (result) => afterSubtreeImport(core, result) }
        );
      }
    ),

    raiseEvent: krl.Postlude(
      ["domain", "name", "attrs", "forRid"],
      function raiseEvent(
        domain: string,
        name: string,
        attrs: any,
        forRid?: string
      ) {
        return this.rsCtx.raiseEvent(domain, name, attrs, forRid);
      }
    ),

    event: krl.Action(
      ["eci", "domain", "name", "attrs", "host"],
      async function event(eci, domain, name, attrs = {}, host) {
        if (host) {
          const url = `${host}/c/${eci}/event/${domain}/${name}`;

          fetch(url, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: krl.encode(attrs),
          }).catch((err) => {
            this.log.error(err + ""); // TODO better handling
          });

          return;
        }

        // fire-n-forget event not eventWait
        const eid = await this.rsCtx.event({
          eci,
          domain,
          name,
          data: { attrs },
          time: 0,
        });

        return eid;
      }
    ),

    eventQuery: krl.Action(
      ["eci", "domain", "name", "attrs", "rid", "queryName", "args"],
      async function event(
        eci,
        domain,
        name,
        attrs = {},
        rid,
        queryName,
        args = {}
      ) {
        return this.rsCtx.eventQuery(
          {
            eci,
            domain,
            name,
            data: { attrs },
            time: 0,
          },
          {
            eci,
            rid,
            name: queryName,
            args,
          }
        );
      }
    ),

    query: krl.Function(["eci", "rid", "name", "args"], async function query(
      eci,
      rid,
      name,
      args = {}
    ) {
      return this.rsCtx.query({
        eci,
        rid,
        name,
        args,
      });
    }),

    logs: krl.Function([], async function logs() {
      const entries = await this.getPicoLogs();
      return entries;
    }),

    allowsEvent: krl.Function(["eci", "domain", "name"], function allowsEvent(
      eci,
      domain,
      name
    ) {
      try {
        const channel = core.picoFramework.lookupChannel(eci);
        return allowsEventPolicy(channel.eventPolicy, { domain, name });
      } catch {
        return false;
      }
    }),

    allowsQuery: krl.Function(["eci", "rid", "name"], function allowsQuery(
      eci,
      rid,
      name
    ) {
      try {
        const channel = core.picoFramework.lookupChannel(eci);
        return allowsQueryPolicy(channel.queryPolicy, { rid, name });
      } catch {
        return false;
      }
    }),

    picoSchema: krl.Function([], function picoSchema() {
      const picoId = this.rsCtx.pico().id;
      const pico = core.picoFramework.getPico(picoId);
      if (!pico) {
        throw new Error("Pico not found: " + picoId);
      }
      return buildPicoSchema(pico, core.rsRegistry);
    }),

    rulesetSchema: krl.Function(["rid"], function rulesetSchema(rid?: string) {
      const picoId = this.rsCtx.pico().id;
      const pico = core.picoFramework.getPico(picoId);
      if (!pico) {
        throw new Error("Pico not found: " + picoId);
      }
      if (rid == null) {
        const out: { [rid: string]: unknown } = {};
        for (const installedRid of Object.keys(pico.rulesets)) {
          const schema = rulesetSchemaForInstalled(
            pico,
            installedRid,
            core.rsRegistry
          );
          if (schema) out[installedRid] = schema;
        }
        return out;
      }
      if (typeof rid !== "string") {
        throw new TypeError(
          "Expected string for rid but got " + krl.typeOf(rid)
        );
      }
      return rulesetSchemaForInstalled(pico, rid, core.rsRegistry);
    }),

    schemaBindings: krl.Function(["rid"], function schemaBindings(rid: string) {
      if (typeof rid !== "string") {
        throw new TypeError(
          "Expected string for rid but got " + krl.typeOf(rid)
        );
      }
      const picoId = this.rsCtx.pico().id;
      const pico = core.picoFramework.getPico(picoId);
      if (!pico) {
        throw new Error("Pico not found: " + picoId);
      }
      const schema = rulesetSchemaForInstalled(pico, rid, core.rsRegistry);
      if (!schema) {
        return { version: 1, queries: [], events: [] };
      }
      return schemaBindingsFromRuleset(schema);
    }),

    channelSchema: krl.Function(["eci"], function channelSchema(eci: string) {
      if (typeof eci !== "string") {
        throw new TypeError(
          "Expected string for eci but got " + krl.typeOf(eci)
        );
      }
      const picoId = this.rsCtx.pico().id;
      const pico = core.picoFramework.getPico(picoId);
      if (!pico) {
        throw new Error("Pico not found: " + picoId);
      }
      return channelSchemaForEci(
        pico,
        core.rsRegistry,
        (channelEci) => core.picoFramework.lookupChannel(channelEci),
        eci
      );
    }),

    validate: krl.Function(
      ["sourceOrUrl"],
      async function validate(sourceOrUrl: string) {
        if (typeof sourceOrUrl !== "string") {
          throw new TypeError(
            "Expected string for sourceOrUrl but got " + krl.typeOf(sourceOrUrl)
          );
        }
        return validateKrl(sourceOrUrl, core.rsRegistry);
      }
    ),

    rulesetWarnings: krl.Function(["rid"], function rulesetWarnings(rid: string) {
      if (typeof rid !== "string") {
        throw new TypeError(
          "Expected string for rid but got " + krl.typeOf(rid)
        );
      }
      const pico = this.rsCtx.pico();
      let url: string | undefined;
      for (const rs of pico.rulesets) {
        if (rs.rid === rid) {
          url = rs.config.url;
          break;
        }
      }
      if (!url) {
        return [];
      }
      if (typeof url !== "string") {
        return [];
      }
      const cached = core.rsRegistry.getCached(url);
      const warnings = cached?.compiler?.warnings;
      if (!Array.isArray(warnings)) {
        return [];
      }
      return warnings.map((w: { message?: string; loc?: { start?: { line?: number; column?: number } } }) => ({
        message: w.message || "",
        line: w.loc?.start?.line,
        column: w.loc?.start?.column,
      }));
    }),

    /** Owner console: evaluate a KRL expression in another installed ruleset's scope. */
    evalInRuleset: krl.Function(
      ["rid", "expr"],
      async function evalInRuleset(rid: string, expr: string) {
        if (typeof rid !== "string" || typeof expr !== "string") {
          throw new TypeError("evalInRuleset expects (rid, expr) strings");
        }
        const query = this.getQuery();
        const eci = query?.eci;
        if (!eci) {
          throw new Error("evalInRuleset requires query context");
        }
        return runConsoleEvalInRuleset(
          core,
          this.rsCtx.pico().id,
          eci,
          rid,
          expr
        );
      }
    ),

  };

  return module;
}
