import * as _ from "lodash";
import * as normalizeUrl from "normalize-url";
import {
  PicoEvent,
  PicoFramework,
  PicoQuery,
  RulesetConfig,
  RulesetContext,
} from "pico-framework";
import { NewPicoRuleset, Pico } from "pico-framework/dist/src/Pico";
import { createRulesetContext } from "pico-framework/dist/src/RulesetContext";
import * as SelectWhen from "select-when";
import { PicoLogEntry } from "./getPicoLogs";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";
import { ScheduledEvent } from "./modules/schedule";
import { RulesetRegistry } from "./RulesetRegistry";

export interface CurrentPicoEvent extends PicoEvent {
  eid: string;
}

export interface CurrentPicoQuery extends PicoQuery {
  qid: string;
}

export interface Directive {
  name: string;
  options: { [name: string]: any };
}

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

  constructor(public log: KrlLogger, public rsRegistry: RulesetRegistry) {}

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
      aggregateEvent(state, op, pairs) {
        state = state || {};
        const stateStates = Array.isArray(state.states) ? state.states : [];
        const isStart = stateStates.indexOf("start") >= 0;
        const isEnd = stateStates.indexOf("end") >= 0;
        let newAggregates: { [name: string]: any[] } = {};
        let newSetting: { [name: string]: any } = {};
        for (const [name, value] of pairs) {
          let vals: any[] =
            state.aggregates && Array.isArray(state.aggregates[name])
              ? state.aggregates[name]
              : [];
          if (isStart) {
            // reset the aggregated values every time the state machine resets
            vals = [value];
          } else if (isEnd) {
            // keep a sliding window every time the state machine hits end again i.e. select when repeat ..
            vals = _.tail(vals.concat([value]));
          } else {
            vals = vals.concat([value]);
          }
          newAggregates[name] = vals;
          if (aggregators[op]) {
            newSetting[name] = aggregators[op](vals);
          }
        }

        return Object.assign({}, state, {
          aggregates: newAggregates,
          setting: Object.assign({}, state.setting, newSetting),
        });
      },

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
        return log.getPicoLogs(picoId);
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

export interface KrlCtx {
  log: KrlLogger;
  rsCtx: RulesetContext;
  module(domain: string): krl.Module | null;
  getEvent(): CurrentPicoEvent | null;
  setEvent(event: CurrentPicoEvent | null): void;
  getQuery(): CurrentPicoQuery | null;
  setQuery(query: CurrentPicoQuery | null): void;
  addDirective(name: string, options: { [name: string]: any }): Directive;
  drainDirectives(): Directive[];
  aggregateEvent(state: any, op: string, pairs: [string, string][]): any;
  scheduleEvent(sEvent: ScheduledEvent): void;
  removeScheduledEvent(id: string): void;
  getPicoLogs(): Promise<PicoLogEntry[]>;
  configure(name: string, dflt: any): any;
  useModule(
    rid: string,
    alias?: string | null,
    configure?: { [name: string]: any }
  ): Promise<void>;

  newPico(rulesets: { url: string; config: any }[]): Promise<string>;

  rulesets(): RulesetCtxInfo[];
  install(url: string, config: RulesetConfig): Promise<void>;
  uninstall(rid: string): Promise<void>;
  flush(url: string): Promise<void>;
}

function toFloat(v: any) {
  return krl.toNumberOrNull(v) || 0;
}

const aggregators: { [op: string]: (vals: any[]) => any } = {
  max(values) {
    return _.max(_.map(values, toFloat));
  },
  min(values) {
    return _.min(_.map(values, toFloat));
  },
  sum(values) {
    return _.reduce(
      _.map(values, toFloat),
      function (sum, n) {
        return sum + n;
      },
      0
    );
  },
  avg(values) {
    var sum = _.reduce(
      _.map(values, toFloat),
      function (sum, n) {
        return sum + n;
      },
      0
    );
    return sum / _.size(values);
  },
  push(values) {
    return values;
  },
};

interface RulesetCtxInfo {
  rid: string;
  version: string;
  config: RulesetConfig | null;
  url: string;
  meta: RulesetCtxInfoMeta | null;
}

interface RulesetCtxInfoMeta {
  krl: string;
  hash: string;
  flushed: Date;
  compiler: {
    version: string;
    warnings: any[];
  };
}
