var _ = require('lodash')
var ktypes = require('krl-stdlib/types')

function toFloat (v) {
  return ktypes.toNumberOrNull(v) || 0
}

function aggregateWrap (core, currentStateMachineState, rule, ctx, valuePairs, fn) {
  return Promise.all(valuePairs.map(function (pair) {
    var name = pair[0]
    var value = pair[1] === void 0
      ? null// leveldb doesnt support undefined
      : pair[1]
    function updater (val) {
      if (currentStateMachineState === 'start') {
        // reset the aggregated values every time the state machine resets
        return [value]
      } else if (currentStateMachineState === 'end') {
        // keep a sliding window every time the state machine hits end again i.e. select when repeat ..
        return _.tail(val.concat([value]))
      }
      return val.concat([value])
    }
    return core.db.updateAggregatorVar(ctx.pico_id, rule, name, updater)
      .then(function (val) {
        ctx.scope.set(name, fn(val))
      })
  }))
}

var aggregators = {
  max: function (values) {
    return _.max(_.map(values, toFloat))
  },
  min: function (values) {
    return _.min(_.map(values, toFloat))
  },
  sum: function (values) {
    return _.reduce(_.map(values, toFloat), function (sum, n) {
      return sum + n
    }, 0)
  },
  avg: function (values) {
    var sum = _.reduce(_.map(values, toFloat), function (sum, n) {
      return sum + n
    }, 0)
    return sum / _.size(values)
  },
  push: function (values) {
    return values
  }
}

module.exports = function (core, currentStateMachineState, rule) {
  return function (ctx, aggregator, valuePairs) {
    if (!_.has(aggregators, aggregator)) {
      throw new Error('Unsupported aggregator: ' + aggregator)
    }
    var fn = aggregators[aggregator]
    return aggregateWrap(core, currentStateMachineState, rule, ctx, valuePairs, fn)
  }
}
