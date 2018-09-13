var _ = require('lodash')
var async = require('async')
var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    var dbOps = []

    async.eachSeries([
      // For each of these keypath prefixes, rename the rid
      'pico-ruleset',
      'ruleset-pico',
      'entvars',
      'appvars',
      'state_machine',
      'aggregator_var'
    ], function (prefix, next) {
      dbRange(ldb, {
        prefix: [prefix]
      }, function (data) {
        var newKey = _.map(data.key, function (p) {
          return p === 'io.picolabs.pico'
            ? 'io.picolabs.wrangler'
            : p
        })
        if (_.isEqual(data.key, newKey)) {
          return
        }
        dbOps.push({ type: 'put', key: newKey, value: data.value })
        dbOps.push({ type: 'del', key: data.key })
      }, next)
    }, function (err) {
      if (err) return callback(err)
      ldb.batch(dbOps, callback)
    })
  }
}
