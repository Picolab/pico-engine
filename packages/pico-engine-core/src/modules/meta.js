var _ = require('lodash')

var getCoreCTXval = {
  'eci': function (core, ctx) {
    return _.get(ctx, ['event', 'eci'], _.get(ctx, ['query', 'eci']))
  },
  'rid': function (core, ctx) {
    return ctx.rid
  },
  'host': function (core, ctx) {
    return core.host
  },
  'picoId': function (core, ctx) {
    // currently, this will be undefined durring ruleset registration
    return ctx.pico_id
  },
  'txnId': function (core, ctx) {
    return ctx.txn_id
  },
  'rulesetName': function (core, ctx) {
    return _.get(core.rsreg.get(ctx.rid), ['meta', 'name'])
  },
  'rulesetDescription': function (core, ctx) {
    return _.get(core.rsreg.get(ctx.rid), ['meta', 'description'])
  },
  'rulesetAuthor': function (core, ctx) {
    return _.get(core.rsreg.get(ctx.rid), ['meta', 'author'])
  },
  'rulesetLogging': function (core, ctx) {
    return _.get(core.rsreg.get(ctx.rid), ['meta', 'logging']) || false
  },
  'ruleName': function (core, ctx) {
    return ctx.rule_name
  },
  'inEvent': function (core, ctx) {
    return _.has(ctx, 'event')
  },
  'inQuery': function (core, ctx) {
    return _.has(ctx, 'query')
  }
}

module.exports = function (core) {
  return {
    get: async function (ctx, id) {
      if (_.has(getCoreCTXval, id)) {
        return getCoreCTXval[id](core, ctx)
      }
      if (id === 'rulesetURI') {
        let data = await core.db.getEnabledRuleset(ctx.rid)
        return data.url
      }
      throw new Error('Meta attribute not defined `' + id + '`')
    }
  }
}
