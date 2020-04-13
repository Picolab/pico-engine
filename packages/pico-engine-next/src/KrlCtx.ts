import * as _ from "lodash";
import { PicoEvent, PicoFramework, RulesetContext } from "pico-framework";
import { Pico } from "pico-framework/dist/src/Pico";
import * as SelectWhen from "select-when";
import { PicoLogEntry } from "./getPicoLogs";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";
import { ScheduledEvent } from "./modules/schedule";
import { RulesetRegistry } from "./RulesetRegistry";
import { createRulesetContext } from "pico-framework/dist/src/RulesetContext";

export interface CurrentPicoEvent extends PicoEvent {
  eid: string;
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

  public addScheduledEvent?: (rid: string, sEvent: ScheduledEvent) => void;
  public removeScheduledEvent?: (id: string) => void;
  public picoFramework?: PicoFramework;

  constructor(public log: KrlLogger, public rsRegistry: RulesetRegistry) {}

  mkCtx(rsCtx: RulesetContext): KrlCtx {
    const pico = rsCtx.pico();
    const picoId = pico.id;
    const log = this.log.child({
      picoId,
      rid: rsCtx.ruleset.rid,
    });

    const environment = this;

    let currentEvent: CurrentPicoEvent | null = null;

    let directives: Directive[] = [];

    const myModules: { [domain: string]: krl.Module } = {};

    return {
      rsCtx,
      log,
      rsRegistry: this.rsRegistry,
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
        currentEvent = event;
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
        const module = await environment.getRulesetModule(
          pico.id,
          rid,
          configure || {},
          rsCtx
        );
        if (!module) {
          throw new Error(`Module not found: ${rid}`);
        }
        if (!alias) {
          alias = rid;
        }
        myModules[alias] = module;
      },
    };
  }

  private async getRulesetModule(
    picoId: string,
    rid: string,
    configure: { [name: string]: any },
    rsCtx: RulesetContext
  ): Promise<krl.Module | null> {
    if (!this.picoFramework) return null;
    let pico: Pico;
    try {
      pico = this.picoFramework.getPico(picoId);
    } catch (err) {
      return null;
    }
    const rs = pico.rulesets[rid];
    if (!rs) {
      return null;
    }
    const ruleset = this.rsRegistry.getCached(rs.config?.url || "");
    if (!ruleset) {
      return null;
    }
    const rsI = await ruleset.ruleset.init(
      createRulesetContext(this.picoFramework, pico, {
        rid: ruleset.rid,
        version: ruleset.version,
        config: {
          ...rsCtx.ruleset.config,
          _krl_module_config: configure,
        },
      }),
      this
    );
    return (rsI as any).provides || {};
  }
}

export interface KrlCtx {
  rsCtx: RulesetContext;
  log: KrlLogger;
  rsRegistry: RulesetRegistry;
  module(domain: string): krl.Module | null;
  getEvent(): CurrentPicoEvent | null;
  setEvent(event: CurrentPicoEvent | null): void;
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
