var _ = require('lodash')
var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    var dbOps = []

    var newData = {}

    dbRange(ldb, {
      prefix: ['state_machine']
    }, function (data) {
      var picoId = data.key[1]
      var rid = data.key[2]
      var ruleName = data.key[3]

      _.set(newData, [picoId, rid, ruleName, 'state'], data.value)
    }, function (err) {
      if (err) return callback(err)

      dbRange(ldb, {
        prefix: ['state_machine_starttime']
      }, function (data) {
        var picoId = data.key[1]
        var rid = data.key[2]
        var ruleName = data.key[3]

        _.set(newData, [picoId, rid, ruleName, 'starttime'], data.value)

        dbOps.push({ type: 'del', key: data.key })
      }, function (err) {
        if (err) return callback(err)

        _.each(newData, function (data, picoId) {
          _.each(data, function (data, rid) {
            _.each(data, function (value, ruleName) {
              dbOps.push({
                type: 'put',
                key: ['state_machine', picoId, rid, ruleName],
                value: value
              })
            })
          })
        })
        ldb.batch(dbOps, callback)
      })
    })
  }
}
