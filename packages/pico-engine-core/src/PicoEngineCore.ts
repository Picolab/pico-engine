import { krl, KrlLogger, PicoLogEntry } from "krl-stdlib";
import {
  PicoEvent,
  PicoFramework,
  PicoQuery,
  RulesetContext,
} from "pico-framework";
import { CorePico } from "./CorePico";
import { CoreEventOutput, formatEventOutput } from "./formatEventOutput";
import { makeKrlCtx } from "./makeKrlCtx";
import initCtxModule from "./modules/ctx";
import module_event from "./modules/event";
import initHttpModule from "./modules/http";
import module_math from "./modules/math";
import module_random from "./modules/random";
import { initScheduleModule } from "./modules/schedule";
import module_stdlib from "./modules/stdlib";
import module_time from "./modules/time";
import module_ursa from "./modules/ursa";
import initMetaModule from "./modules/meta";
import { PicoEngineCoreConfiguration } from "./PicoEngineCoreConfiguration";
import { CachedRuleset, RulesetRegistry } from "./RulesetRegistry";
import type { RulesetStateServices } from "./rulesetState";
import type { SubtreePortableHooks } from "./subtreeState";
import {
  notifyRulesetSetChangedAfterFlush,
  snapshotPicoSchemasForUrl,
} from "./schemaNotify";
import type { PicoSchema } from "./picoSchema";
import {
  annotatedRuleOutcomesForEvent,
  collectRuntimeRuleOutcomes,
} from "./ruleOutcomes";

const version = require("../package.json").version;

export class PicoEngineCore {
  readonly version: string = version;

  log: KrlLogger;
  rsRegistry: RulesetRegistry;
  getPicoLogs: (picoId: string) => Promise<PicoLogEntry[]>;
  modules: { [domain: string]: krl.Module } = {};
  base_url: string | undefined;
  picoFramework: PicoFramework;
  onPicoCreated?: (
    picoId: string,
    ctx: { isRoot: boolean; parentPicoId: string }
  ) => Promise<void>;
  /** Identity export/import for ctx:exportSubtree / importSubtree (set by pico-engine). */
  subtreePortableHooks?: SubtreePortableHooks;
  /** Remap bundled /krl/ ruleset URLs on import (set by pico-engine). */
  resolveBundledRulesetUrl?: (url: string) => string;
  /**
   * Host-provided import hooks (e.g. wrangler events). Core stays OS-agnostic;
   * the running engine sets this from a layer above ctx.
   */
  subtreeImportServices?: Partial<RulesetStateServices>;

  private picos: { [picoId: string]: CorePico } = {};
  private flushSchemaSnapshots: Map<string, PicoSchema> | null = null;
  /** Pico that invoked ctx:flush (registry hook skips it; ctx raises there). */
  ctxFlushPicoId: string | null = null;
  /** Collect `raise` events during `eventWait` for the active ingress transaction. */
  private eventWaitRaised: {
    txnId: string | null;
    root: { domain: string; name: string };
    events: PicoEvent[];
    seen: Set<string>;
  } | null = null;
  private startupModules: (() => Promise<any>)[] = [];
  private reloadSchedulesForPico: (picoId: string) => Promise<void> = async () =>
    undefined;

  constructor(conf: PicoEngineCoreConfiguration) {
    const log = (this.log = conf.log);
    this.getPicoLogs = conf.getPicoLogs;
    this.onPicoCreated = conf.onPicoCreated;
    this.rsRegistry = new RulesetRegistry(
      conf.rsRegLoader,
      (crs) => this.onRulesetLoaded(crs),
      (url) => {
        this.flushSchemaSnapshots = snapshotPicoSchemasForUrl(this, url);
      },
      (crs, oldHash) => this.onRulesetContentUpdated(crs, oldHash)
    );

    let scheduleHooks: ReturnType<typeof initScheduleModule>;

    this.picoFramework = new PicoFramework({
      db: conf.db,
      genID: conf.genID,
      useEventInputTime: conf.useEventInputTime,
      autoCreateRootPico: conf.autoCreateRootPico,
      defaultRootPolicyCeiling: conf.defaultRootPolicyCeiling,
      globalEventDeny: conf.globalEventDeny,
      globalQueryDeny: conf.globalQueryDeny,

      environment: (rsCtx: RulesetContext) => makeKrlCtx(this, rsCtx),

      rulesetLoader: this.rsRegistry.loader,

      onFrameworkEvent: (ev) => {
        scheduleHooks?.onFrameworkEvent(ev);
        switch (ev.type) {
          case "startup":
            break;
          case "startupDone":
            log.debug("pico-framework started");
            break;
          case "startupRulesetInitError":
            log.error("onStartupRulesetInitError", {
              picoId: ev.picoId,
              rid: ev.rid,
              rulesetConfig: ev.config,
              error: ev.error,
            });
            break;
          case "txnQueued":
            log.debug(ev.type, {
              picoId: ev.picoId,
              txnId: ev.txn.id,
              txn: ev.txn,
            });
            break;
          case "txnStart":
            if (
              this.eventWaitRaised &&
              ev.txn.kind === "event" &&
              ev.txn.event.domain === this.eventWaitRaised.root.domain &&
              ev.txn.event.name === this.eventWaitRaised.root.name
            ) {
              this.eventWaitRaised.txnId = ev.txn.id;
            }
            log.debug(ev.type, { picoId: ev.picoId, txnId: ev.txn.id });
            break;
          case "txnDone":
            log.debug(ev.type, { picoId: ev.picoId, txnId: ev.txn.id });
            break;
          case "txnError": {
            const err = ev.error as Error & {
              krl_compiler?: { loc?: { start?: { line?: number; column?: number } } };
              where?: { line?: number; col?: number; filename?: string };
            };
            const payload: Record<string, unknown> = {
              picoId: ev.picoId,
              txnId: ev.txn.id,
              txnKind: ev.txn.kind,
              error: err + "",
            };
            if (ev.txn.kind === "event") {
              payload.event = {
                domain: ev.txn.event.domain,
                name: ev.txn.event.name,
                eci: ev.txn.event.eci,
              };
            } else if (ev.txn.kind === "query") {
              payload.query = {
                rid: ev.txn.query.rid,
                name: ev.txn.query.name,
                eci: ev.txn.query.eci,
              };
            }
            if (err.krl_compiler?.loc?.start) {
              payload.line = err.krl_compiler.loc.start.line;
              payload.column = err.krl_compiler.loc.start.column;
            } else if (err.where?.line != null) {
              payload.line = err.where.line;
              payload.column = err.where.col;
              payload.filename = err.where.filename;
            }
            log.error("txnError", payload);
            break;
          }
          case "eventScheduleAdded": {
            const waitCtx = this.eventWaitRaised;
            if (
              waitCtx?.txnId &&
              ev.txn.id === waitCtx.txnId &&
              (ev.event.domain !== waitCtx.root.domain ||
                ev.event.name !== waitCtx.root.name)
            ) {
              const key = JSON.stringify({
                domain: ev.event.domain,
                name: ev.event.name,
                attrs: ev.event.data?.attrs,
              });
              if (!waitCtx.seen.has(key)) {
                waitCtx.seen.add(key);
                waitCtx.events.push(ev.event);
              }
            }
            log.debug("event added to schedule", {
              picoId: ev.picoId,
              txnId: ev.txn.id,
              rid: ev.rid,
              event: ev.event,
            });
            break;
          }
          case "eventScheduleCleared":
            log.debug("schedule cleared", {
              picoId: ev.picoId,
              txnId: ev.txn.id,
            });
            break;
          case "picoDeleted":
            log.debug("pico deleted", { picoId: ev.picoId });
            break;
        }
      },
    });

    this.modules["ctx"] = initCtxModule(this);
    this.modules["event"] = module_event;
    this.modules["http"] = initHttpModule(this);

    this.modules["math"] = module_math;
    this.modules["random"] = module_random;

    scheduleHooks = initScheduleModule(this.picoFramework);
    this.modules["schedule"] = scheduleHooks.module;
    this.reloadSchedulesForPico = scheduleHooks.reloadSchedulesForPico;
    this.startupModules.push(scheduleHooks.start);

    this.modules["stdlib"] = module_stdlib;
    this.modules["time"] = module_time;
    this.modules["ursa"] = module_ursa;
    this.modules["meta"] = initMetaModule(this);

    if (conf.modules) {
      for (const domain of Object.keys(conf.modules)) {
        this.modules[domain] = conf.modules[domain];
      }
    }
    this.base_url = conf.base_url;
  }

  async start() {
    for (const startModule of this.startupModules) {
      await startModule();
    }
    await this.picoFramework.start();
  }

  /** Re-register in-memory schedule jobs from ent:_schedule after import. */
  async reloadImportedSchedules(picoIds: string[]): Promise<void> {
    for (const picoId of picoIds) {
      await this.reloadSchedulesForPico(picoId);
    }
  }

  onRulesetLoaded(crs: CachedRuleset) {
    this.picoFramework.reInitRuleset(crs.ruleset);
    for (const picoId of Object.keys(this.picos)) {
      this.picos[picoId].onRulesetLoaded(crs);
    }
  }

  async onRulesetContentUpdated(
    crs: CachedRuleset,
    oldHash: string | null
  ): Promise<void> {
    const before = this.flushSchemaSnapshots ?? new Map();
    this.flushSchemaSnapshots = null;
    const skip = this.ctxFlushPicoId;
    this.ctxFlushPicoId = null;
    await notifyRulesetSetChangedAfterFlush(this, crs, oldHash, before, skip);
  }

  addPico(picoId: string): CorePico {
    if (!this.picos[picoId]) {
      this.picos[picoId] = new CorePico(this);
    }
    return this.picos[picoId];
  }

  getPico(picoId: string): CorePico | null {
    return this.picos[picoId] || null;
  }

  event(event: PicoEvent): Promise<string> {
    return this.picoFramework.event(event);
  }

  eventWait(event: PicoEvent): Promise<CoreEventOutput> {
    this.eventWaitRaised = {
      txnId: null,
      root: { domain: event.domain, name: event.name },
      events: [],
      seen: new Set(),
    };
    return this.picoFramework
      .eventWait(event)
      .then((resp) => {
        const raisedEvents = this.eventWaitRaised?.events ?? [];
        this.eventWaitRaised = null;
        const runtime = collectRuntimeRuleOutcomes(resp.responses);
        let ruleOutcomes = runtime;
        try {
          const pico = this.picoFramework.getPico(event.eci);
          ruleOutcomes = annotatedRuleOutcomesForEvent(
            pico,
            this.rsRegistry,
            event.domain,
            event.name,
            runtime
          );
        } catch {
          // unknown eci — leave runtime-only outcomes
        }
        return formatEventOutput({
          ...resp,
          ruleOutcomes,
          raisedEvents,
        });
      })
      .catch((err) => {
        this.eventWaitRaised = null;
        throw err;
      });
  }

  eventQuery(event: PicoEvent, query: PicoQuery) {
    return this.picoFramework.eventQuery(event, query);
  }

  query(query: PicoQuery) {
    return this.picoFramework.query(query);
  }
}
