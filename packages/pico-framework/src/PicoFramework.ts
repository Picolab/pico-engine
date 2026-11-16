import * as cuid from "cuid";
import { LevelBatch, PicoDb } from "./utils";
import { Channel } from "./Channel";
import { dbRange } from "./dbRange";
import { NewPicoConfig, Pico } from "./Pico";
import {
  PERMISSIVE_POLICY_CEILING,
  PolicyCeiling,
  normalizePolicyCeiling,
} from "./policyCeiling";
import { assertEventPolicy, assertQueryPolicy, EventPolicyRule, QueryPolicyRule } from "./Channel";
import { cleanEvent, PicoEvent } from "./PicoEvent";
import { PicoFrameworkEvent } from "./PicoFrameworkEvent";
import { cleanQuery, PicoQuery } from "./PicoQuery";
import { Ruleset, RulesetConfig } from "./Ruleset";

export type RulesetLoader = (
  picoId: string,
  rid: string,
  config: RulesetConfig,
) => Ruleset | Promise<Ruleset>;

type OnFrameworkEvent = (event: PicoFrameworkEvent) => void;

export interface PicoFrameworkConf {
  rulesetLoader: RulesetLoader;

  /**
   * Specify how data should be persisted.
   */
  db: PicoDb;

  /**
   * Function that is called on a pico framework event
   */
  onFrameworkEvent?: OnFrameworkEvent;

  /**
   * Set true if you want to trust the timestamp on events entering the system.
   */
  useEventInputTime?: boolean;

  /**
   * Pass optional data to each ruleset init function
   */
  environment?: any;

  /**
   * Optionally override the function that generates random-unique ids.
   *
   * This is mostly intended for testing purposes.
   */
  genID?: () => string;

  /**
   * When true (the default), startup auto-creates a single root pico if the
   * engine has none — preserving the historical single-root behavior.
   *
   * Set to false to boot with **zero** roots and create them on demand via
   * {@link PicoFramework.createRootPico} (e.g. the pico-engine creates a root
   * per passkey registration). Existing engines that already persisted a root
   * are unaffected either way.
   */
  autoCreateRootPico?: boolean;

  /**
   * Default policy ceiling for root picos that do not set one explicitly.
   * Defaults to permissive (*.*) for backward compatibility.
   */
  defaultRootPolicyCeiling?: PolicyCeiling;

  /** Deny rules applied on every channel event after per-channel policy passes. */
  globalEventDeny?: EventPolicyRule[];

  /** Deny rules applied on every channel query after per-channel policy passes. */
  globalQueryDeny?: QueryPolicyRule[];
}

export class PicoFramework {
  db: PicoDb;

  private defaultRootPolicyCeiling: PolicyCeiling;
  private globalEventDeny: EventPolicyRule[];
  private globalQueryDeny: QueryPolicyRule[];

  private rootPico_?: Pico;
  /**
   * @deprecated The engine now supports 0..N root picos. This returns the
   * "primary" root — the one persisted under `["root-pico"]` for back-compat —
   * and throws when there is none. Prefer {@link rootPicos} / {@link createRootPico}.
   */
  public get rootPico(): Pico {
    if (!this.rootPico_) {
      throw new Error(
        "No primary root pico. The engine boots with zero roots; create one with createRootPico().",
      );
    }
    return this.rootPico_;
  }

  /**
   * All root picos, i.e. every pico with no parent.
   * The engine may have zero, one, or many.
   */
  public rootPicos(): Pico[] {
    return this.picos.filter((pico) => pico.parent === null);
  }

  private picos: Pico[] = [];

  private startupP: Promise<void>;
  genID: () => string;

  private rulesetLoader: RulesetLoader;

  readonly environment?: any;

  private useEventInputTime: boolean = false;

  private autoCreateRootPico: boolean = true;

  /**
   * not using EventEmitter b/c I want it typed checked and limited.
   */
  private onFrameworkEvent?: OnFrameworkEvent;

  constructor(conf: PicoFrameworkConf) {
    this.db = conf.db;
    this.rulesetLoader = conf && conf.rulesetLoader;
    this.genID = (conf && conf.genID) || cuid;
    this.environment = conf && conf.environment;
    this.onFrameworkEvent = conf && conf.onFrameworkEvent;
    this.useEventInputTime = !!(conf && conf.useEventInputTime);
    this.autoCreateRootPico = !(conf && conf.autoCreateRootPico === false);
    this.defaultRootPolicyCeiling = conf.defaultRootPolicyCeiling
      ? normalizePolicyCeiling(conf.defaultRootPolicyCeiling)
      : PERMISSIVE_POLICY_CEILING;
    this.globalEventDeny = conf.globalEventDeny ? conf.globalEventDeny.slice(0) : [];
    this.globalQueryDeny = conf.globalQueryDeny ? conf.globalQueryDeny.slice(0) : [];

    this.startupP = this.startup();
  }

  getDefaultRootPolicyCeiling(): PolicyCeiling {
    return this.defaultRootPolicyCeiling;
  }

  private assertGlobalEventDeny(event: PicoEvent): void {
    if (this.globalEventDeny.length === 0) {
      return;
    }
    assertEventPolicy(
      { allow: [{ domain: "*", name: "*" }], deny: this.globalEventDeny },
      event,
    );
  }

  private assertGlobalQueryDeny(query: PicoQuery): void {
    if (this.globalQueryDeny.length === 0) {
      return;
    }
    assertQueryPolicy(
      { allow: [{ rid: "*", name: "*"}], deny: this.globalQueryDeny },
      query,
    );
  }

  private async startup() {
    this.emit({ type: "startup" });

    await dbRange(this.db, { prefix: ["pico"] }, (data) => {
      const pico = Pico.fromDb(this, data.value);
      this.picos.push(pico);
    });

    await dbRange(this.db, { prefix: ["pico-channel"] }, (data) => {
      const { picoId } = data.value;
      const pico = this.picos.find((pico) => pico.id === picoId);
      if (!pico) {
        throw new Error(`Missing picoId ${picoId}`);
      }
      const chann = Channel.fromDb(pico, data.value);
      pico.channels[chann.id] = chann;
    });

    // get rids that are used, and load them
    // install separate so they are all loaded/warmed up first in case of dependencies
    const toInstall: { pico: Pico; rs: Ruleset; config: any }[] = [];
    await dbRange(this.db, { prefix: ["pico-ruleset"] }, async (data) => {
      const picoId = data.key[1];
      const rid = data.key[2];
      const config = data.value.config;
      const pico = this.picos.find((pico) => pico.id === picoId);
      if (!pico) {
        throw new Error(`Missing picoId ${picoId}`);
      }
      // load ruleset map so when rulesets startup they can see all the available ruleset+config on the pico
      pico.rulesets[rid] = { config, instance: null };
      try {
        const rs = await this.rulesetLoader(picoId, rid, data.value.config);
        toInstall.push({ pico, rs, config: data.value.config });
      } catch (error) {
        pico.rulesets[rid] = { config, instance: null, startupError: error };
        this.emit({
          type: "startupRulesetInitError",
          picoId,
          rid,
          config: data.value.config,
          error,
        });
      }
    });

    for (const { pico, rs, config } of toInstall) {
      try {
        await pico.install(rs, config);
      } catch (error) {
        this.emit({
          type: "startupRulesetInitError",
          picoId: pico.id,
          rid: rs.rid,
          config,
          error,
        });
      }
    }

    // Older engines persisted a single "primary" root under `["root-pico"]`.
    // If present, expose it via the (deprecated) `rootPico` getter.
    let rootId: string | null;
    try {
      rootId = await this.db.get(["root-pico"]);
    } catch (err: any) {
      if (err.notFound) {
        rootId = null;
      } else {
        throw err;
      }
    }
    if (rootId) {
      this.rootPico_ = this.picos.find((pico) => pico.id === rootId);
      if (!this.rootPico_) {
        throw new Error(`Bad root pico ID ${rootId}`);
      }
    } else if (this.autoCreateRootPico) {
      // Default (back-compat): auto-create one root when the engine has none.
      // Disable via `autoCreateRootPico: false` to boot with zero roots and
      // create them on demand with `createRootPico`.
      await this.createRootPico();
    }

    this.emit({ type: "startupDone" });
  }

  start() {
    return this.startupP;
  }

  /**
   * Create a new parentless (root) pico. An engine may have any number of roots.
   * Persists the pico, registers it, optionally installs rulesets, and returns it.
   *
   * The first root created on an engine that has no primary root yet is also
   * recorded under `["root-pico"]`, so the (deprecated) {@link rootPico} getter
   * and existing single-root consumers keep working during migration.
   */
  async createRootPico(conf?: NewPicoConfig): Promise<Pico> {
    const pico = new Pico(this, this.genID());
    if (conf?.policyCeiling) {
      pico.policyCeiling = normalizePolicyCeiling(conf.policyCeiling);
    } else {
      pico.policyCeiling = normalizePolicyCeiling(this.defaultRootPolicyCeiling);
    }

    const isFirstPrimary = !this.rootPico_;
    const dbOps: LevelBatch[] = [pico.toDbPut()];
    if (isFirstPrimary) {
      dbOps.push({ type: "put", key: ["root-pico"], value: pico.id });
    }
    await this.db.batch(dbOps);

    this.addPico(pico);
    if (isFirstPrimary) {
      this.rootPico_ = pico;
    }

    if (conf && conf.rulesets) {
      for (const rs of conf.rulesets) {
        try {
          await pico.install(rs.rs, rs.config);
        } catch (error) {
          this.emit({
            type: "newPicoInstallError",
            picoId: pico.id,
            rid: rs.rs.rid,
            config: rs.config,
            error,
          });
        }
      }
    }

    return pico;
  }

  cleanEvent(event: PicoEvent): PicoEvent {
    if (this.useEventInputTime) {
      return cleanEvent(event, event.time);
    }
    return cleanEvent(event);
  }

  /**
   * Signal an event and return the txn id
   *
   * @param event
   * @param fromPicoId This is for detecting family relationships
   */
  async event(event: PicoEvent, fromPicoId?: string): Promise<string> {
    event = this.cleanEvent(event);

    const channel = this.lookupChannel(event.eci);
    channel.assertEventPolicy(event, fromPicoId);
    this.assertGlobalEventDeny(event);

    return channel.pico.event(event);
  }

  /**
   * Same as `event` but will wait until it finishes processing
   *
   * @param event
   * @param fromPicoId
   */
  async eventWait(
    event: PicoEvent,
    fromPicoId?: string,
  ): Promise<{ eid: string; responses: any[] }> {
    event = this.cleanEvent(event);

    const channel = this.lookupChannel(event.eci);
    channel.assertEventPolicy(event, fromPicoId);
    this.assertGlobalEventDeny(event);

    return channel.pico.eventWait(event);
  }

  /**
   * Same as `event` but will immediately run a query after the event and return the query result
   *
   * @param event
   * @param query
   * @param fromPicoId
   */
  async eventQuery(
    event: PicoEvent,
    query: PicoQuery,
    fromPicoId?: string,
  ): Promise<any> {
    event = this.cleanEvent(event);
    query = cleanQuery(query);
    if (query.eci !== event.eci) {
      throw new Error("eventQuery must use the same channel");
    }

    const channel = this.lookupChannel(event.eci);
    channel.assertEventPolicy(event, fromPicoId);
    this.assertGlobalEventDeny(event);
    channel.assertQueryPolicy(query, fromPicoId);
    this.assertGlobalQueryDeny(query);

    return channel.pico.eventQuery(event, query);
  }

  async query(query: PicoQuery, fromPicoId?: string): Promise<any> {
    query = cleanQuery(query);
    const channel = this.lookupChannel(query.eci);
    channel.assertQueryPolicy(query, fromPicoId);
    this.assertGlobalQueryDeny(query);
    return channel.pico.query(query);
  }

  /** True when `eci` is a pico id or an existing channel id anywhere in the engine. */
  eciIsTaken(eci: string): boolean {
    for (const pico of this.picos) {
      if (pico.id === eci) {
        return true;
      }
      if (Object.prototype.hasOwnProperty.call(pico.channels, eci)) {
        return true;
      }
    }
    return false;
  }

  lookupChannel(eci: string): Channel {
    for (const pico of this.picos) {
      if (pico.channels[eci]) {
        return pico.channels[eci];
      }
    }
    throw new Error(`ECI not found ${eci}`);
  }

  getPico(eci: string): Pico {
    for (const pico of this.picos) {
      if (pico.channels[eci]) {
        return pico;
      }
    }
    throw new Error(`ECI not found ${eci}`);
  }

  reInitRuleset(rs: Ruleset) {
    for (const pico of this.picos) {
      pico.reInitRuleset(rs).catch((err) => {
        this.emit({
          type: "reInitRulesetError",
          picoId: pico.id,
          rid: rs.rid,
          config: pico.rulesets[rs.rid]?.config,
          error: err,
        });
      });
    }
  }

  /**
   * @ignore
   *
   * NOTE: not using EventEmitter so we can have type information and it can be synchronous
   */
  emit(event: PicoFrameworkEvent) {
    if (!this.onFrameworkEvent) return;
    this.onFrameworkEvent(event);
  }

  /**
   * @ignore
   */
  addPico(pico: Pico) {
    this.picos.push(pico);
  }

  /**
   * @ignore
   */
  removePico(picoId: string) {
    this.picos = this.picos.filter((p) => p.id !== picoId);
    this.emit({ type: "picoDeleted", picoId });
  }

  /**
   * All picos currently loaded in memory.
   */
  public loadedPicos(): readonly Pico[] {
    return this.picos;
  }

  /**
   * Return the number of pico's
   * Useful for testing
   */
  numberOfPicos() {
    return this.picos.length;
  }
}
