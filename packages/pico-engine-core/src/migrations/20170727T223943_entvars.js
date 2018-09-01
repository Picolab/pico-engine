var dbRange = require('../dbRange')

module.exports = {
  up: function (ldb, callback) {
    // /pico/:pico_id/:rid/vars/:varname -> /entvars/:pico_id/:rid/:varname

    var dbOps = []

    dbRange(ldb, {
      prefix: ['pico']
    }, function (data) {
      if (data.key[3] !== 'vars') {
        return
      }
      var picoId = data.key[1]
      var rid = data.key[2]
      var varname = data.key[4]

      dbOps.push({
        type: 'put',
        key: ['entvars', picoId, rid, varname],
        value: data.value
      })

      dbOps.push({ type: 'del', key: data.key })
    }, function (err) {
      if (err) return callback(err)

      ldb.batch(dbOps, callback)
    })
  }
}
