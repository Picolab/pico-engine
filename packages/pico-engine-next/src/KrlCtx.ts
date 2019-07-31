import * as _ from "lodash";
import { PicoEvent, RulesetContext } from "pico-framework";
import * as SelectWhen from "select-when";
import * as krl from "./krl";
import { KrlLogger } from "./KrlLogger";
import * as modules from "./modules";

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

  constructor(public log: KrlLogger) {}

  mkCtx(rsCtx: RulesetContext): KrlCtx {
    const log = this.log.child({
      picoId: rsCtx.pico().id,
      rid: rsCtx.ruleset.rid
    });

    const environment = this;

    let currentEvent: CurrentPicoEvent | null = null;

    let directives: Directive[] = [];

    return {
      rsCtx,
      log,
      module(domain) {
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
          setting: Object.assign({}, state.setting, newSetting)
        });
      }
    };
  }
}

export interface KrlCtx {
  rsCtx: RulesetContext;
  log: KrlLogger;
  module(domain: string): krl.Module | null;
  getEvent(): CurrentPicoEvent | null;
  setEvent(event: CurrentPicoEvent | null): void;
  addDirective(name: string, options: { [name: string]: any }): Directive;
  drainDirectives(): Directive[];
  aggregateEvent(state: any, op: string, pairs: [string, string][]): any;
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
      function(sum, n) {
        return sum + n;
      },
      0
    );
  },
  avg(values) {
    var sum = _.reduce(
      _.map(values, toFloat),
      function(sum, n) {
        return sum + n;
      },
      0
    );
    return sum / _.size(values);
  },
  push(values) {
    return values;
  }
};
