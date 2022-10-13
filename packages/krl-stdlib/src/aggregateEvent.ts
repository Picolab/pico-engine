import * as _ from "lodash";
import * as krl from "./krl";

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

export function aggregateEvent(
  state: any,
  op: string,
  pairs: [string, string][]
): any {
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
}
