var _ = require('lodash')
var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /pico/:pico_id/channel/:eci -> /channel/:eci {... pico_id}
    // /pico-eci-list/:pico_id/:eci true

    var dbOps = []

    dbRange(ldb, {
      prefix: ['pico']
    }, function (data) {
      if (data.key[2] !== 'channel') {
        return
      }
      var picoId = data.key[1]
      var eci = data.key[3]

      dbOps.push({
        type: 'put',
        key: ['channel', eci],
        value: _.assign({}, data.value, {
          pico_id: picoId
        })
      })
      dbOps.push({
        type: 'put',
        key: ['pico-eci-list', picoId, eci],
        value: true
      })

      dbOps.push({ type: 'del', key: data.key })
      dbOps.push({ type: 'del', key: ['eci-to-pico_id', eci] })
    }, function (err) {
      if (err) return callback(err)

      ldb.batch(dbOps, callback)
    })
  }
}
