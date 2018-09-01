var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /pico/:pico_id/ruleset/:rid
    // -> /pico-ruleset/:pico_id/:rid
    // -> /ruleset-pico/:rid/:pico_id

    var dbOps = []

    dbRange(ldb, {
      prefix: ['pico']
    }, function (data) {
      if (data.key[2] !== 'ruleset') {
        return
      }
      var picoId = data.key[1]
      var rid = data.key[3]

      dbOps.push({
        type: 'put',
        key: ['pico-ruleset', picoId, rid],
        value: data.value
      })
      dbOps.push({
        type: 'put',
        key: ['ruleset-pico', picoId, rid],
        value: data.value
      })

      dbOps.push({ type: 'del', key: data.key })
    }, function (err) {
      if (err) return callback(err)

      ldb.batch(dbOps, callback)
    })
  }
}
