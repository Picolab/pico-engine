var _ = require('lodash')

function assertCTXkeys (ctx, keys) {
  var stdCtxKeys = [
    'rid',
    'scope',
    'txn_id',
    'getMyKey',
    'modules',
    'mkFunction',
    'emit',
    'log',
    'mkAction',
    'applyFn'
  ]

  var expected = _.cloneDeep(keys).sort().join(',')
  var actual = _.pullAll(_.map(ctx, function (v, k) {
    if (v === void 0 || v === null || _.isNaN(v)) {
      throw new Error('Invalid ctx.' + k + ' is not defined')
    }
    return k
  }), stdCtxKeys).sort().join(',')

  if (actual !== expected) {
    throw new Error('Invalid ctx expected ' + expected + ' but was ' + actual)
  }
}

module.exports = function runKRL () {
  var args = Array.prototype.slice.call(arguments)
  var fn = args.shift()

  if (process.env.NODE_ENV !== 'production') {
    // in development, assert ctx is shaped right
    var ctx = args[0]
    if (!_.has(ctx, 'rid')) {
      throw new Error('ctx must always have `rid`')
    }
    if (!_.has(ctx, 'scope')) {
      throw new Error('ctx must always have `scope`')
    }
    if (_.has(ctx, 'event') && !_.has(ctx, 'raiseEvent')) { // event durring select/eval event exp
      assertCTXkeys(ctx, [
        'event',
        'pico_id',
        'rule_name'
      ])
    } else if (_.has(ctx, 'event')) { // event durring rule body
      assertCTXkeys(ctx, [
        'event',
        'pico_id',
        'rule_name',

        'raiseEvent',
        'raiseError',
        'scheduleEvent',
        'addActionResponse',
        'stopRulesetExecution'
      ])
    } else if (_.has(ctx, 'query')) {
      assertCTXkeys(ctx, [
        'query',
        'pico_id'
      ])
    } else {
      assertCTXkeys(ctx, [
        // no extra keys when registering a ruleset
        // TODO use a pico_id when registering rulesets
      ])
    }
  }

  return Promise.resolve(fn.apply(null, args))
}
