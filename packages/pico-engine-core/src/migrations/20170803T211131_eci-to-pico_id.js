var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /channel/:eci/pico_id -> /eci-to-pico_id/:eci

    var dbOps = []

    dbRange(ldb, {
      prefix: ['channel']
    }, function (data) {
      if (data.key[2] !== 'pico_id') {
        return
      }
      var eci = data.key[1]

      dbOps.push({
        type: 'put',
        key: ['eci-to-pico_id', eci],
        value: data.value
      })

      dbOps.push({ type: 'del', key: data.key })
    }, function (err) {
      if (err) return callback(err)

      ldb.batch(dbOps, callback)
    })
  }
}
