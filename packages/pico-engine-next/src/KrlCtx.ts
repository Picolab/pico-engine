import {
  aggregateEvent,
  CurrentPicoEvent,
  CurrentPicoQuery,
  Directive,
  krl,
  KrlCtx,
  KrlLogger,
  PicoLogEntry,
  RulesetCtxInfo,
} from "krl-stdlib";
import * as _ from "lodash";
import * as normalizeUrl from "normalize-url";
import { PicoFramework, RulesetContext } from "pico-framework";
import { NewPicoRuleset, Pico } from "pico-framework/dist/src/Pico";
import { createRulesetContext } from "pico-framework/dist/src/RulesetContext";
import * as SelectWhen from "select-when";
import * as modules from "./modules";
import { ScheduledEvent } from "./modules/schedule";
import { RulesetRegistry } from "./RulesetRegistry";

export function cleanDirectives(responses: any[]): Directive[] {
  return _.compact(_.flattenDeep(responses));
}

export class RulesetEnvironment {
  krl = krl;

  SelectWhen = SelectWhen;

  modules: { [domain: string]: krl.Module } = modules;

  picoRidUses: {
    [picoId: string]: { [rid: string]: { [usesRid: string]: true } };
  } = {};
  picoRidUsedBy: {
    [picoId: string]: { [rid: string]: { [usedByRid: string]: true } };
  } = {};

  public addScheduledEvent?: (rid: string, sEvent: ScheduledEvent) => void;
  public removeScheduledEvent?: (id: string) => void;
  public picoFramework?: PicoFramework;

  constructor(
    public log: KrlLogger,
    public rsRegistry: RulesetRegistry,
    public getPicoLogs: (picoId: string) => Promise<PicoLogEntry[]>
  ) {}

  mkCtx(rsCtx: RulesetContext): KrlCtx {
    const pico = rsCtx.pico();
    const picoId = pico.id;
    const logCtxBase = { picoId, rid: rsCtx.ruleset.rid };
    let log = this.log.child(logCtxBase);

    const environment = this;
    const rsRegistry = this.rsRegistry;

    let currentEvent: CurrentPicoEvent | null = null;
    let currentQuery: CurrentPicoQuery | null = null;

    let directives: Directive[] = [];

    const myModules: { [domain: string]: krl.Module } = {};

    const krlCtx: KrlCtx = {
      log,
      rsCtx,
      module(domain) {
        if (myModules[domain]) {
          return myModules[domain];
        }
        return environment.modules[domain] || null;
      },
      getEvent() {
        return currentEvent;
      },
      setEvent(event) {
        krlCtx.log = log = this.log.child(
          event ? { ...logCtxBase, txnId: event.eid } : logCtxBase
        );
        currentEvent = event;
      },
      getQuery() {
        return currentQuery;
      },
      setQuery(query) {
        krlCtx.log = log = this.log.child(
          query ? { ...logCtxBase, txnId: query.qid } : logCtxBase
        );
        currentQuery = query;
      },
      addDirective(name, options) {
        const directive: Directive = { name, options: options || {} };
        directives.push(directive);
        return directive;
      },
      drainDirectives() {
        const tmp = directives;
        directives = [];
        return tmp;
      },
      aggregateEvent,

      scheduleEvent(sEvent) {
        if (environment.addScheduledEvent) {
          environment.addScheduledEvent(rsCtx.ruleset.rid, sEvent);
        }
      },

      removeScheduledEvent(id) {
        if (environment.removeScheduledEvent) {
          environment.removeScheduledEvent(id);
        }
      },

      getPicoLogs() {
        return environment.getPicoLogs(picoId);
      },

      configure(name, dflt) {
        const config = rsCtx.ruleset.config;
        if (_.has(config, ["_krl_module_config", name])) {
          return config._krl_module_config[name];
        }
        return dflt;
      },

      async useModule(rid, alias, configure) {
        let pfPico: Pico;
        const picoFramework = environment.picoFramework;
        if (!picoFramework) {
          throw new Error("PicoFramework not yet setup");
        }
        try {
          pfPico = picoFramework.getPico(picoId);
        } catch (err) {
          throw new Error("PicoFramework not yet setup");
        }
        const ruleset = rsRegistry.getCached(
          pfPico.rulesets[rid]?.config?.url || ""
        );
        if (!ruleset) {
          throw new Error(`Module not found: ${rid}`);
        }
        const rsI = await ruleset.ruleset.init(
          createRulesetContext(picoFramework, pfPico, {
            rid: ruleset.rid,
            version: ruleset.version,
            config: {
              ...rsCtx.ruleset.config,
              _krl_module_config: configure,
            },
          }),
          environment
        );
        const module: krl.Module = (rsI as any).provides || {};
        if (!alias) {
          alias = rid;
        }
        myModules[alias] = module;
        _.set(environment.picoRidUses, [pico.id, rsCtx.ruleset.rid, rid], true);
        _.set(
          environment.picoRidUsedBy,
          [pico.id, rid, rsCtx.ruleset.rid],
          true
        );
      },

      async newPico(rulesets) {
        if (!Array.isArray(rulesets)) {
          throw new TypeError("ctx:newPico expects an array of {url, config}");
        }
        const toInstall: NewPicoRuleset[] = [];
        for (const rs of rulesets) {
          const result = await rsRegistry.load(rs.url);
          toInstall.push({
            rs: result.ruleset,
            config: {
              url: rs.url,
              config: rs.config || {},
            },
          });
        }
        const newEci = await rsCtx.newPico({
          rulesets: toInstall,
        });
        return newEci;
      },

      rulesets() {
        const pico = rsCtx.pico();

        const results: RulesetCtxInfo[] = [];

        for (const rs of pico.rulesets) {
          const cached = rsRegistry.getCached(rs.config.url);
          results.push({
            rid: rs.rid,
            version: rs.version,
            url: rs.config.url,
            config: rs.config.config,
            meta: cached
              ? {
                  krl: cached.krl,
                  hash: cached.hash,
                  flushed: cached.flushed,
                  compiler: cached.compiler,
                }
              : null,
          });
        }

        return results;
      },

      async install(url, config) {
        if (typeof url !== "string") {
          throw new TypeError(
            "Expected string for url but got " + krl.typeOf(url)
          );
        }
        url = normalizeUrl(url);
        const rs = await rsRegistry.load(url);
        await rsCtx.install(rs.ruleset, {
          url: url,
          config: config || {},
        });
      },

      uninstall(rid: string) {
        if (typeof rid !== "string") {
          throw new TypeError(
            "Expected string for rid but got " + krl.typeOf(rid)
          );
        }
        const usedBy = Object.keys(
          _.get(environment.picoRidUsedBy, [pico.id, rid], {})
        );
        if (usedBy.length > 0) {
          throw new Error(
            `Cannot uninstall ${rid} because ${usedBy.join(
              " and "
            )} depends on it`
          );
        }
        _.unset(environment.picoRidUses, [pico.id, rid]);
        return rsCtx.uninstall(rid);
      },

      async flush(url: string) {
        if (typeof url !== "string") {
          throw new TypeError(
            "Expected string for url but got " + krl.typeOf(url)
          );
        }
        url = normalizeUrl(url);
        const rs = await rsRegistry.flush(url);
        if (environment.picoFramework) {
          environment.picoFramework.reInitRuleset(rs.ruleset);
        }
      },
    };
    return krlCtx;
  }
}
